import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Trash2, CloudOff, CheckCircle, AlertTriangle, Clock, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOfflineQueue, readQueue, dequeue, processAction, writeQueue, type QueuedAction } from '@/hooks/useOfflineQueue';
import { toast } from 'sonner';

const typeIcons: Record<string, React.ElementType> = {
  insert: Database,
  update: RefreshCw,
  delete: Trash2,
};

const typeColors: Record<string, string> = {
  insert: 'bg-success/10 text-success',
  update: 'bg-primary/10 text-primary',
  delete: 'bg-destructive/10 text-destructive',
};

export default function SyncStatus() {
  const navigate = useNavigate();
  const { sync, pendingCount } = useOfflineQueue();
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const isOnline = useIsOnline();

  useEffect(() => {
    setQueue(readQueue());
  }, [pendingCount]);

  const handleSyncAll = async () => {
    if (!isOnline) {
      toast.error('You\'re offline — connect to sync');
      return;
    }
    setSyncing(true);
    await sync();
    setQueue(readQueue());
    setSyncing(false);
  };

  const handleRetrySingle = async (action: QueuedAction) => {
    if (!isOnline) {
      toast.error('You\'re offline — connect to sync');
      return;
    }
    setSyncingId(action.id);
    const ok = await processAction(action);
    if (ok) {
      dequeue(action.id);
      toast.success('Action synced');
    } else {
      const updated = readQueue().map((a) =>
        a.id === action.id ? { ...a, retries: a.retries + 1 } : a
      );
      writeQueue(updated.filter((a) => a.retries < 10));
      toast.error('Sync failed — will retry later');
    }
    setQueue(readQueue());
    setSyncingId(null);
  };

  const handleDelete = (id: string) => {
    dequeue(id);
    setQueue(readQueue());
    toast.success('Action removed from queue');
  };

  const handleClearAll = () => {
    writeQueue([]);
    setQueue([]);
    toast.success('Queue cleared');
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getPayloadSummary = (action: QueuedAction) => {
    const keys = Object.keys(action.payload).filter(k => !['user_id', 'registered_by', 'referring_doctor_id', 'doctor_id'].includes(k));
    const first = keys.slice(0, 3).map(k => {
      const val = action.payload[k];
      const str = typeof val === 'string' ? val : JSON.stringify(val);
      return str && str.length > 30 ? str.slice(0, 30) + '…' : str;
    });
    return first.join(', ') || '—';
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudOff className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Sync Status</h2>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${isOnline ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success' : 'bg-destructive animate-pulse'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xl font-bold text-foreground">{queue.length}</p>
            <p className="text-xs text-muted-foreground">pending action{queue.length !== 1 ? 's' : ''}</p>
          </div>
          {queue.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleSyncAll}
                disabled={syncing || !isOnline}
                className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Sync All
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </button>
            </div>
          )}
        </div>
        {queue.length > 0 && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{queue.filter(a => a.type === 'insert').length} inserts</span>
            <span>{queue.filter(a => a.type === 'update').length} updates</span>
            <span>{queue.filter(a => a.type === 'delete').length} deletes</span>
          </div>
        )}
      </div>

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle className="h-12 w-12 text-success mb-3" />
          <p className="text-lg font-semibold text-foreground">All synced!</p>
          <p className="text-sm text-muted-foreground mt-1">No pending offline actions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map((action) => {
            const Icon = typeIcons[action.type] || Database;
            const color = typeColors[action.type] || '';
            const isSyncingThis = syncingId === action.id;
            return (
              <div key={action.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">{action.type} → {action.table}</p>
                      <p className="text-[11px] text-muted-foreground">{formatTime(action.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.retries > 0 && (
                      <span className="flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        {action.retries}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 truncate">{getPayloadSummary(action)}</p>

                {action.match && (
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Match: {Object.entries(action.match).map(([k, v]) => `${k}=${String(v).slice(0, 12)}`).join(', ')}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRetrySingle(action)}
                    disabled={isSyncingThis || !isOnline}
                    className="flex-1 flex items-center justify-center gap-1 rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                    {isSyncingThis ? 'Syncing...' : 'Retry'}
                  </button>
                  <button
                    onClick={() => handleDelete(action.id)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function useIsOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return isOnline;
}
