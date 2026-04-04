import { useNavigate } from 'react-router-dom';
import { ListOrdered, MessageSquare, GitBranch, Video, BarChart3 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function DoctorHome() {
  const { t } = useApp();
  const navigate = useNavigate();

  const stats = [
    { label: 'Patients Today', value: '12' },
    { label: 'Consultations', value: '8' },
    { label: 'Pending Referrals', value: '3' },
  ];

  const actions = [
    { icon: ListOrdered, label: t('nav.queue'), path: '/dashboard/queue', color: 'bg-primary/10 text-primary' },
    { icon: MessageSquare, label: t('nav.consultations'), path: '/dashboard/consultations', color: 'bg-success/10 text-success' },
    { icon: GitBranch, label: t('nav.referrals'), path: '/dashboard/referrals', color: 'bg-accent/10 text-accent-foreground' },
    { icon: Video, label: t('nav.telemedicine'), path: '/dashboard/telemedicine', color: 'bg-secondary text-secondary-foreground' },
    { icon: BarChart3, label: t('nav.reports'), path: '/dashboard/reports', color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground">
        <h2 className="text-xl font-bold">{t('home.welcome')}, Doctor 👋</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('role.doctor.desc')}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-4 text-center shadow-card">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">{t('home.quickActions')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((a) => (
            <button key={a.path} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-2 rounded-xl bg-card border border-border p-4 shadow-card transition-transform hover:scale-[1.02]">
              <div className={`rounded-lg p-2 ${a.color}`}><a.icon className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-foreground">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
