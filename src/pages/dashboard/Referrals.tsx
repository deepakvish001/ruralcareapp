import { ArrowLeft, GitBranch } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface Referral {
  patient: string;
  age: number;
  from: string;
  to: string;
  reason: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  date: string;
}

const mockReferrals: Referral[] = [
  { patient: 'Ramesh Kumar', age: 45, from: 'Dr. Priya Sharma', to: 'City Hospital - Cardiology', reason: 'Suspected cardiac issue, needs ECG and echocardiogram', status: 'Pending', date: 'Apr 4' },
  { patient: 'Sunita Devi', age: 32, from: 'Dr. Arun Singh', to: 'District Hospital - Gynecology', reason: 'High-risk pregnancy, needs specialist monitoring', status: 'Pending', date: 'Apr 3' },
  { patient: 'Anil Yadav', age: 28, from: 'Dr. Rajesh Kumar', to: 'City Hospital - Gastro', reason: 'Chronic stomach pain, endoscopy recommended', status: 'Completed', date: 'Mar 28' },
  { patient: 'Geeta Kumari', age: 55, from: 'Dr. Priya Sharma', to: 'District Hospital - Ortho', reason: 'Severe joint degeneration', status: 'Rejected', date: 'Mar 25' },
];

const statusColors: Record<string, string> = {
  Pending: 'bg-warning/10 text-warning-foreground',
  Completed: 'bg-success/10 text-success',
  Rejected: 'bg-destructive/10 text-destructive',
};

export default function Referrals() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Completed' | 'Rejected'>('all');

  const filtered = filter === 'all' ? mockReferrals : mockReferrals.filter((r) => r.status === filter);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('referrals.title')}</h2>
      <div className="flex gap-2 overflow-x-auto">
        {(['all', 'Pending', 'Completed', 'Rejected'] as const).map((key) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${filter === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key === 'all' ? t('queue.all') : t(`referrals.${key.toLowerCase()}`)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground">{r.patient}, {r.age}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[r.status]}`}>{r.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{r.from}</span>
              <GitBranch className="h-3 w-3" />
              <span>{r.to}</span>
            </div>
            <p className="text-sm text-muted-foreground">{r.reason}</p>
            <p className="text-xs text-muted-foreground mt-2">{r.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
