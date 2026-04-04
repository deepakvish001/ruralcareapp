import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, BarChart3, Stethoscope, Heart, Phone } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import illustHwHome from '@/assets/illust-healthworker-home.png';

export default function HealthWorkerHome() {
  const { t } = useApp();
  const navigate = useNavigate();

  const { data: patientCount = 0, isCached } = useOfflineCache<number>(
    ['patients-count'],
    async () => {
      const { count, error } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  );

  const stats = [
    { label: t('reports.totalPatients'), value: patientCount.toString() },
    { label: t('reports.visitsMonth'), value: '0' },
    { label: t('reports.followUpsDue'), value: '0' },
  ];

  const actions = [
    { icon: Users, label: t('nav.patients'), path: '/dashboard/patients', color: 'bg-primary/10 text-primary' },
    { icon: CalendarDays, label: t('nav.scheduler'), path: '/dashboard/scheduler', color: 'bg-success/10 text-success' },
    { icon: BarChart3, label: t('nav.reports'), path: '/dashboard/reports', color: 'bg-accent/10 text-accent-foreground' },
    { icon: Stethoscope, label: t('nav.symptoms'), path: '/dashboard/symptoms', color: 'bg-secondary text-secondary-foreground' },
    { icon: Heart, label: t('nav.firstAid'), path: '/dashboard/first-aid', color: 'bg-destructive/10 text-destructive' },
    { icon: Phone, label: t('nav.emergency'), path: '/dashboard/emergency', color: 'bg-warning/10 text-warning-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-bold">{t('home.welcome')}, Health Worker 👋</h2>
          <p className="mt-1 text-sm text-primary-foreground/80">{t('role.healthWorker.desc')}</p>
        </div>
        <img src={illustHwHome} alt="Health Worker" loading="lazy" width={100} height={67} className="h-20 w-auto object-contain rounded-lg" />
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
