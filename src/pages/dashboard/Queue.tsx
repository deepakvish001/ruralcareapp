import { ArrowLeft, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface QueueItem {
  name: string;
  age: number;
  symptoms: string;
  priority: 'high' | 'medium' | 'low';
  waitTime: string;
}

const mockQueue: QueueItem[] = [
  { name: 'Ramesh Kumar', age: 45, symptoms: 'Chest pain, breathlessness', priority: 'high', waitTime: '5 min' },
  { name: 'Sunita Devi', age: 32, symptoms: 'High fever for 3 days', priority: 'high', waitTime: '12 min' },
  { name: 'Anil Yadav', age: 28, symptoms: 'Stomach pain, vomiting', priority: 'medium', waitTime: '20 min' },
  { name: 'Geeta Kumari', age: 55, symptoms: 'Joint pain, swelling', priority: 'medium', waitTime: '25 min' },
  { name: 'Mohan Lal', age: 38, symptoms: 'Skin rash', priority: 'low', waitTime: '35 min' },
  { name: 'Kavita Singh', age: 22, symptoms: 'Cough, cold', priority: 'low', waitTime: '40 min' },
];

const priorityConfig = {
  high: { color: 'border-l-destructive bg-destructive/5', badge: 'bg-destructive/10 text-destructive' },
  medium: { color: 'border-l-warning bg-warning/5', badge: 'bg-warning/10 text-warning-foreground' },
  low: { color: 'border-l-success bg-success/5', badge: 'bg-success/10 text-success' },
};

export default function Queue() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filtered = filter === 'all' ? mockQueue : mockQueue.filter((q) => q.priority === filter);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t('queue.title')}</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} {t('queue.waiting').toLowerCase()}</span>
      </div>
      <div className="flex gap-2">
        {(['all', 'high', 'medium', 'low'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t(`queue.${key}`)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((q, i) => {
          const config = priorityConfig[q.priority];
          return (
            <div key={i} className={`rounded-xl border border-border border-l-4 ${config.color} p-4 shadow-card`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{q.name}, {q.age}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{q.symptoms}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.badge}`}>{t(`queue.${q.priority}`)}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{q.waitTime}</span>
                  </div>
                </div>
                <button className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  {t('queue.startConsultation')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
