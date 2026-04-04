import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, MapPin, Phone, Video, Pill } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import illustSymptoms from '@/assets/illust-symptoms.png';
import illustFirstaid from '@/assets/illust-firstaid.png';
import illustFinddoctor from '@/assets/illust-finddoctor.png';
import illustEmergency from '@/assets/illust-emergency.png';
import illustTelemedicine from '@/assets/illust-telemedicine.png';

export default function PatientHome() {
  const { t } = useApp();
  const navigate = useNavigate();

  const actions = [
    { icon: Stethoscope, label: t('nav.symptoms'), path: '/dashboard/symptoms', color: 'gradient-primary text-primary-foreground', img: illustSymptoms },
    { icon: Heart, label: t('nav.firstAid'), path: '/dashboard/first-aid', color: 'bg-destructive/10 text-destructive', img: illustFirstaid },
    { icon: MapPin, label: t('nav.findDoctor'), path: '/dashboard/find-doctor', color: 'bg-success/10 text-success', img: illustFinddoctor },
    { icon: Phone, label: t('nav.emergency'), path: '/dashboard/emergency', color: 'bg-accent/10 text-accent-foreground', img: illustEmergency },
    { icon: Pill, label: t('nav.medications') || 'Medications', path: '/dashboard/medications', color: 'bg-warning/10 text-warning-foreground', img: illustEmergency },
    { icon: Video, label: t('nav.telemedicine'), path: '/dashboard/telemedicine', color: 'bg-secondary text-secondary-foreground', img: illustTelemedicine },
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
              className="flex flex-col items-center gap-1 rounded-xl bg-card border border-border p-4 shadow-card transition-transform hover:scale-[1.02] overflow-hidden"
            >
              <img src={a.img} alt={a.label} loading="lazy" width={80} height={80} className="h-16 w-16 object-contain" />
              <div className={`rounded-lg p-1.5 ${a.color.includes('gradient') ? a.color : a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
