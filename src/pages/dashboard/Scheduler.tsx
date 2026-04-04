import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const typeColors: Record<string, string> = {
  routine: 'bg-primary/10 text-primary',
  followup: 'bg-accent/10 text-accent-foreground',
  vaccination: 'bg-success/10 text-success',
  pregnancy: 'bg-secondary text-secondary-foreground',
  emergency: 'bg-destructive/10 text-destructive',
};

export default function Scheduler() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

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
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
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
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No visits</p>}
        </div>
      )}
    </div>
  );
}
