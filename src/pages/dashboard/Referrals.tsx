import { ArrowLeft, GitBranch, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning-foreground',
  completed: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function Referrals() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patient_name: '', destination_hospital: '', reason: '' });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*, profiles:referring_doctor_id(display_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addReferral = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('referrals').insert({
        patient_name: form.patient_name,
        destination_hospital: form.destination_hospital,
        reason: form.reason,
        referring_doctor_id: user?.id!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      setShowForm(false);
      setForm({ patient_name: '', destination_hospital: '', reason: '' });
      toast.success('Referral created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = filter === 'all' ? referrals : referrals.filter((r) => r.status === filter);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('referrals.title')}</h2>
      <div className="flex gap-2 overflow-x-auto">
        {(['all', 'pending', 'completed', 'rejected'] as const).map((key) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${filter === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key === 'all' ? t('queue.all') : t(`referrals.${key}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const doctorName = (r.profiles as any)?.display_name || 'Unknown Doctor';
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{r.patient_name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusColors[r.status] || ''}`}>{r.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{doctorName}</span>
                  <GitBranch className="h-3 w-3" />
                  <span>{r.destination_hospital}</span>
                </div>
                <p className="text-sm text-muted-foreground">{r.reason}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No referrals found</p>}
        </div>
      )}

      <button onClick={() => setShowForm(true)} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
        <Plus className="h-5 w-5" /> New Referral
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">New Referral</h3>
            <div className="space-y-3">
              <input placeholder="Patient Name" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder="Destination Hospital" value={form.destination_hospital} onChange={(e) => setForm({ ...form, destination_hospital: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <textarea placeholder="Reason for referral" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none" />
            </div>
            <button onClick={() => addReferral.mutate()} disabled={!form.patient_name || !form.destination_hospital || !form.reason || addReferral.isPending} className="mt-4 w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {addReferral.isPending ? '...' : 'Create Referral'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
