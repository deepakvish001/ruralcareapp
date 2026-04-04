import { ArrowLeft, Video, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface TeleconsultRequest {
  patient: string;
  age: number;
  village: string;
  symptoms: string;
  status: 'pending' | 'accepted' | 'declined';
  date: string;
  response?: string;
}

const mockRequests: TeleconsultRequest[] = [
  { patient: 'Ganesh Prasad', age: 60, village: 'Rampur', symptoms: 'Persistent cough for 2 weeks, blood in sputum', status: 'pending', date: 'Apr 4' },
  { patient: 'Parvati Devi', age: 35, village: 'Sundarpur', symptoms: 'Severe headache, blurred vision', status: 'pending', date: 'Apr 3' },
  { patient: 'Bhola Nath', age: 50, village: 'Khandpur', symptoms: 'Chest pain during exertion', status: 'accepted', date: 'Apr 2', response: 'Prescribed Aspirin 75mg. Advised ECG at district hospital.' },
  { patient: 'Maya Kumari', age: 28, village: 'Rampur', symptoms: 'Recurring stomach ache', status: 'declined', date: 'Apr 1', response: 'Patient needs in-person examination. Referred to PHC.' },
];

const statusConfig = {
  pending: { icon: Clock, color: 'bg-warning/10 text-warning-foreground', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'bg-success/10 text-success', label: 'Accepted' },
  declined: { icon: XCircle, color: 'bg-destructive/10 text-destructive', label: 'Declined' },
};

export default function Telemedicine() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const filtered = mockRequests.filter((r) => r.status === tab);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center gap-2">
        <Video className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t('telemedicine.title')}</h2>
      </div>
      <div className="flex gap-2">
        {(['pending', 'accepted', 'declined'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {t(`telemedicine.${key}`)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((r, i) => {
          const config = statusConfig[r.status];
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{r.patient}, {r.age}</h3>
                  <p className="text-xs text-muted-foreground">{r.village} · {r.date}</p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                  <config.icon className="h-3 w-3" /> {config.label}
                </span>
              </div>
              <p className="text-sm text-foreground">{r.symptoms}</p>
              {r.response && (
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Doctor's Response:</p>
                  <p className="text-sm text-foreground">{r.response}</p>
                </div>
              )}
              {r.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground">Accept</button>
                  <button className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted">Decline</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
