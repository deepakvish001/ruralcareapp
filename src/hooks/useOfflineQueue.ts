import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- Storage layer (localStorage-based for simplicity) ---

export interface QueuedAction {
  id: string;
  table: string;
  type: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  /** For update/delete – filter by column=value */
  match?: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

const QUEUE_KEY = 'offline_sync_queue';

export function readQueue(): QueuedAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedAction[]) : [];
  } catch {
    return [];
  }
}

export function writeQueue(queue: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function enqueue(action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>) {
  const queue = readQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retries: 0,
  });
  writeQueue(queue);
}

export function dequeue(id: string) {
  writeQueue(readQueue().filter((a) => a.id !== id));
}

// --- Sync engine ---

export async function processAction(action: QueuedAction): Promise<boolean> {
  try {
    if (action.type === 'insert') {
      const { error } = await (supabase as any).from(action.table).insert(action.payload);
      if (error) throw error;
    } else if (action.type === 'update') {
      let query = (supabase as any).from(action.table).update(action.payload);
      if (action.match) {
        for (const [col, val] of Object.entries(action.match)) {
          query = query.eq(col, val);
        }
      }
      const { error } = await query;
      if (error) throw error;
    } else if (action.type === 'delete') {
      let query = (supabase as any).from(action.table).delete();
      if (action.match) {
        for (const [col, val] of Object.entries(action.match)) {
          query = query.eq(col, val);
        }
      }
      const { error } = await query;
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error('[OfflineQueue] Failed to sync action', action.id, err);
    return false;
  }
}

async function flushQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  let synced = 0;
  for (const action of queue) {
    const ok = await processAction(action);
    if (ok) {
      dequeue(action.id);
      synced++;
    } else {
      // Increment retries, drop after 10 failures
      const updated = readQueue().map((a) =>
        a.id === action.id ? { ...a, retries: a.retries + 1 } : a
      );
      writeQueue(updated.filter((a) => a.retries < 10));
    }
  }
  return synced;
}

// --- React hook ---

/**
 * Provides `enqueueAction` to queue mutations when offline,
 * and automatically syncs when connection is restored.
 */
export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(() => readQueue().length);
  const syncingRef = useRef(false);

  const refreshCount = useCallback(() => {
    setPendingCount(readQueue().length);
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const synced = await flushQueue();
      if (synced > 0) {
        toast.success(`Synced ${synced} offline action${synced > 1 ? 's' : ''}`);
      }
    } finally {
      syncingRef.current = false;
      refreshCount();
    }
  }, [refreshCount]);

  // Auto-sync on online event + periodic check
  useEffect(() => {
    const onOnline = () => sync();
    window.addEventListener('online', onOnline);

    // Also try syncing on mount and every 30s
    sync();
    const interval = setInterval(sync, 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [sync]);

  const enqueueAction = useCallback(
    (action: Omit<QueuedAction, 'id' | 'createdAt' | 'retries'>) => {
      enqueue(action);
      refreshCount();
      toast.info('Saved offline — will sync when connected');
    },
    [refreshCount]
  );

  return { enqueueAction, pendingCount, sync };
}
