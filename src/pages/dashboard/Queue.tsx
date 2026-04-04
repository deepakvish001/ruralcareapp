import { ArrowLeft, AlertTriangle, Clock, Plus, CloudOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { toast } from 'sonner';

const priorityConfig = {
  high: { color: 'border-l-destructive bg-destructive/5', badge: 'bg-destructive/10 text-destructive' },
  medium: { color: 'border-l-warning bg-warning/5', badge: 'bg-warning/10 text-warning-foreground' },
  low: { color: 'border-l-success bg-success/5', badge: 'bg-success/10 text-success' },
};

export default function Queue() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueAction, pendingCount } = useOfflineQueue();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_name: '', patient_age: '', symptoms: '', priority: 'medium' as string });

  const { data: queue = [], isLoading, isCached } = useOfflineCache(
    ['queue'],
    async () => {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  );

  const addEntry = useMutation({
    mutationFn: async () => {
      const payload = {
        patient_name: form.patient_name,
        patient_age: parseInt(form.patient_age) || null,
        symptoms: form.symptoms,
        priority: form.priority,
        doctor_id: user?.id || null,
      };
      if (!navigator.onLine) {
        enqueueAction({ table: 'queue_entries', type: 'insert', payload });
        return;
      }
      const { error } = await supabase.from('queue_entries').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      setShowForm(false);
      setForm({ patient_name: '', patient_age: '', symptoms: '', priority: 'medium' });
      if (navigator.onLine) toast.success('Patient added to queue');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const startConsultation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('queue_entries').update({ status: 'in_progress', doctor_id: user?.id }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      toast.success('Consultation started');
    },
  });

  const filtered = filter === 'all' ? queue : queue.filter((q) => q.priority === filter);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t('queue.title')}</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} {t('queue.waiting').toLowerCase()}{isCached ? ' (cached)' : ''}</span>
      </div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning-foreground">
          <CloudOff className="h-3.5 w-3.5" />
          <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
          {pendingCount} action{pendingCount > 1 ? 's' : ''} pending sync
        </div>
      )}
      <div className="flex gap-2">
        {(['all', 'high', 'medium', 'low'] as const).map((key) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t(`queue.${key}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const config = priorityConfig[q.priority as keyof typeof priorityConfig] || priorityConfig.low;
            return (
              <div key={q.id} className={`rounded-xl border border-border border-l-4 ${config.color} p-4 shadow-card`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{q.patient_name}{q.patient_age ? `, ${q.patient_age}` : ''}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{q.symptoms || 'No symptoms listed'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badge}`}>{t(`queue.${q.priority}`)}</span>
                      {q.wait_time && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{q.wait_time}</span>}
                    </div>
                  </div>
                  <button onClick={() => startConsultation.mutate(q.id)} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    {t('queue.startConsultation')}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No patients in queue</p>}
        </div>
      )}

      <button onClick={() => setShowForm(true)} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
        <Plus className="h-5 w-5" /> Add to Queue
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Add Patient to Queue</h3>
            <div className="space-y-3">
              <input placeholder="Patient Name" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder="Age" type="number" value={form.patient_age} onChange={(e) => setForm({ ...form, patient_age: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder="Symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <button onClick={() => addEntry.mutate()} disabled={!form.patient_name || addEntry.isPending} className="mt-4 w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {addEntry.isPending ? '...' : 'Add to Queue'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
