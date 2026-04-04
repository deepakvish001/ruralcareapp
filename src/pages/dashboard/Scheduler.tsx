import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const mockVisits = [
  { time: '9:00 AM', patient: 'Lakshmi Devi', type: 'Routine', village: 'Rampur', status: 'today' },
  { time: '10:30 AM', patient: 'Ramu Singh', type: 'Vaccination', village: 'Khandpur', status: 'today' },
  { time: '2:00 PM', patient: 'Sita Kumari', type: 'Follow-up', village: 'Rampur', status: 'today' },
  { time: 'Apr 5', patient: 'Gopal Das', type: 'Pregnancy', village: 'Sundarpur', status: 'upcoming' },
  { time: 'Apr 6', patient: 'Meera Bai', type: 'Routine', village: 'Khandpur', status: 'upcoming' },
  { time: 'Apr 1', patient: 'Hari Om', type: 'Follow-up', village: 'Rampur', status: 'overdue' },
  { time: 'Mar 28', patient: 'Radha Devi', type: 'Vaccination', village: 'Sundarpur', status: 'overdue' },
];

const typeColors: Record<string, string> = {
  Routine: 'bg-primary/10 text-primary',
  'Follow-up': 'bg-accent/10 text-accent-foreground',
  Vaccination: 'bg-success/10 text-success',
  Pregnancy: 'bg-secondary text-secondary-foreground',
  Emergency: 'bg-destructive/10 text-destructive',
};

export default function Scheduler() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  const filtered = mockVisits.filter((v) => v.status === tab);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('scheduler.title')}</h2>
      <div className="flex gap-2">
        {(['today', 'upcoming', 'overdue'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(`scheduler.${key}`)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((v, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex flex-col items-center text-center min-w-[50px]">
              <Clock className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs font-medium text-foreground">{v.time}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{v.patient}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[v.type] || 'bg-muted text-muted-foreground'}`}>{v.type}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{v.village}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No visits</p>}
      </div>
    </div>
  );
}
