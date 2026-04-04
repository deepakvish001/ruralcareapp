import { ArrowLeft, Calendar, Clock, MapPin, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const typeColors: Record<string, string> = {
  routine: 'bg-primary/10 text-primary',
  followup: 'bg-accent/10 text-accent-foreground',
  vaccination: 'bg-success/10 text-success',
  pregnancy: 'bg-secondary text-secondary-foreground',
  emergency: 'bg-destructive/10 text-destructive',
};

export default function Scheduler() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'today' | 'upcoming' | 'overdue'>('today');
  const [recordingVisitId, setRecordingVisitId] = useState<string | null>(null);
  const [vitals, setVitals] = useState({ weight: '', temperature: '', blood_pressure: '', notes: '', follow_up_date: '' });

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['visits-schedule'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visits')
        .select('*, patients(name, village)')
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const recordVisit = useMutation({
    mutationFn: async ({ patientId }: { patientId: string }) => {
      const { error } = await supabase.from('visits').insert({
        patient_id: patientId,
        recorded_by: user?.id!,
        type: 'followup',
        weight: vitals.weight ? parseFloat(vitals.weight) : null,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        blood_pressure: vitals.blood_pressure || null,
        notes: vitals.notes || null,
        follow_up_date: vitals.follow_up_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits-schedule'] });
      setRecordingVisitId(null);
      setVitals({ weight: '', temperature: '', blood_pressure: '', notes: '', follow_up_date: '' });
      toast.success('Visit recorded');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const categorized = visits.map((v) => {
    const followUp = v.follow_up_date ? new Date(v.follow_up_date) : null;
    const visitDate = followUp || new Date(v.date);
    let status: 'today' | 'upcoming' | 'overdue';
    if (visitDate >= today && visitDate < tomorrow) status = 'today';
    else if (visitDate >= tomorrow) status = 'upcoming';
    else status = 'overdue';
    return { ...v, status, displayDate: visitDate };
  });

  const filtered = categorized.filter((v) => v.status === tab);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('scheduler.title')}</h2>
      <div className="flex gap-2">
        {(['today', 'upcoming', 'overdue'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t(`scheduler.${key}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const patient = v.patients as any;
            const isRecording = recordingVisitId === v.id;
            return (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center text-center min-w-[50px]">
                    <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                    <span className="text-xs font-medium text-foreground">
                      {v.displayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{patient?.name || 'Unknown'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${typeColors[v.type] || 'bg-muted text-muted-foreground'}`}>{v.type}</span>
                      {patient?.village && <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{patient.village}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setRecordingVisitId(isRecording ? null : v.id)}
                    className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                    title="Record Visit"
                  >
                    {isRecording ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>

                {isRecording && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fade-in-up">
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder={t('visit.weight')} value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" type="number" step="0.1" />
                      <input placeholder={t('visit.temp')} value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" type="number" step="0.1" />
                      <input placeholder={t('visit.bp')} value={vitals.blood_pressure} onChange={(e) => setVitals({ ...vitals, blood_pressure: e.target.value })}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
                    </div>
                    <textarea placeholder={t('visit.notes')} value={vitals.notes} onChange={(e) => setVitals({ ...vitals, notes: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" rows={2} />
                    <div className="flex gap-2 items-center">
                      <input type="date" value={vitals.follow_up_date} onChange={(e) => setVitals({ ...vitals, follow_up_date: e.target.value })}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
                      <button
                        onClick={() => recordVisit.mutate({ patientId: v.patient_id })}
                        className="rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        {t('visit.save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No visits</p>}
        </div>
      )}
    </div>
  );
}
