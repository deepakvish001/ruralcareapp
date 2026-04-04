import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, MapPin, Phone, Video } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function PatientHome() {
  const { t } = useApp();
  const navigate = useNavigate();

  const actions = [
    { icon: Stethoscope, label: t('nav.symptoms'), path: '/dashboard/symptoms', color: 'gradient-primary text-primary-foreground' },
    { icon: Heart, label: t('nav.firstAid'), path: '/dashboard/first-aid', color: 'bg-destructive/10 text-destructive' },
    { icon: MapPin, label: t('nav.findDoctor'), path: '/dashboard/find-doctor', color: 'bg-success/10 text-success' },
    { icon: Phone, label: t('nav.emergency'), path: '/dashboard/emergency', color: 'bg-accent/10 text-accent-foreground' },
    { icon: Video, label: t('nav.telemedicine'), path: '/dashboard/telemedicine', color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground">
        <h2 className="text-xl font-bold">{t('home.welcome')} 👋</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('app.tagline')}</p>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">{t('home.quickActions')}</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className={`flex flex-col items-center gap-2 rounded-xl p-5 shadow-card transition-transform hover:scale-[1.02] ${a.color.includes('gradient') ? a.color : `bg-card border border-border`}`}
            >
              <div className={`rounded-lg p-2 ${a.color.includes('gradient') ? '' : a.color}`}>
                <a.icon className="h-6 w-6" />
              </div>
              <span className={`text-sm font-medium ${a.color.includes('gradient') ? 'text-primary-foreground' : 'text-foreground'}`}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
