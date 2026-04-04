import { ArrowLeft, Phone, AlertTriangle, Building2, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const contacts = [
  { key: 'ambulance', icon: AlertTriangle, number: '108', color: 'bg-destructive text-destructive-foreground' },
  { key: 'police', icon: Phone, number: '100', color: 'gradient-primary text-primary-foreground' },
  { key: 'hospital', icon: Building2, number: '102', color: 'bg-success text-success-foreground' },
  { key: 'healthWorker', icon: Heart, number: '+91 98765 43210', color: 'bg-accent text-accent-foreground' },
];

export default function Emergency() {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('emergency.title')}</h2>
      <div className="space-y-3">
        {contacts.map((c) => (
          <a
            key={c.key}
            href={`tel:${c.number.replace(/\s/g, '')}`}
            className={`flex items-center gap-4 rounded-xl p-5 shadow-card transition-transform hover:scale-[1.01] ${c.color}`}
          >
            <c.icon className="h-8 w-8" />
            <div className="flex-1">
              <h3 className="text-lg font-bold">{t(`emergency.${c.key}`)}</h3>
              <p className="text-sm opacity-90">{c.number}</p>
            </div>
            <Phone className="h-6 w-6" />
          </a>
        ))}
      </div>
    </div>
  );
}
