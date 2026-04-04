import { useNavigate } from 'react-router-dom';
import { Stethoscope, Heart, MapPin, Phone, Video, Pill } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import illustSymptoms from '@/assets/illust-symptoms.png';
import illustFirstaid from '@/assets/illust-firstaid.png';
import illustFinddoctor from '@/assets/illust-finddoctor.png';
import illustEmergency from '@/assets/illust-emergency.png';
import illustTelemedicine from '@/assets/illust-telemedicine.png';

interface MedSummary {
  totalDoses: number;
  takenDoses: number;
  activeMeds: number;
}

export default function PatientHome() {
  const { t, user } = useApp();
  const navigate = useNavigate();

  const { data: medSummary } = useOfflineCache<MedSummary>(
    ['med-summary', user?.id || ''],
    async () => {
      const { data: meds, error: medsErr } = await supabase
        .from('medications')
        .select('id, time_slots, active')
        .eq('active', true);
      if (medsErr) throw medsErr;

      const today = new Date().toISOString().split('T')[0];
      const { data: logs, error: logsErr } = await supabase
        .from('medication_logs')
        .select('medication_id, scheduled_time')
        .gte('taken_at', today + 'T00:00:00')
        .lte('taken_at', today + 'T23:59:59');
      if (logsErr) throw logsErr;

      const activeMeds = meds || [];
      const totalDoses = activeMeds.reduce((s, m) => s + (m.time_slots?.length || 0), 0);
      const takenDoses = (logs || []).length;
      return { totalDoses, takenDoses, activeMeds: activeMeds.length };
    },
    { enabled: !!user },
  );

  const actions = [
    { icon: Stethoscope, label: t('nav.symptoms'), path: '/dashboard/symptoms', color: 'gradient-primary text-primary-foreground', img: illustSymptoms },
    { icon: Heart, label: t('nav.firstAid'), path: '/dashboard/first-aid', color: 'bg-destructive/10 text-destructive', img: illustFirstaid },
    { icon: MapPin, label: t('nav.findDoctor'), path: '/dashboard/find-doctor', color: 'bg-success/10 text-success', img: illustFinddoctor },
    { icon: Phone, label: t('nav.emergency'), path: '/dashboard/emergency', color: 'bg-accent/10 text-accent-foreground', img: illustEmergency },
    { icon: Pill, label: t('nav.medications') || 'Medications', path: '/dashboard/medications', color: 'bg-warning/10 text-warning-foreground', img: illustEmergency },
    { icon: Video, label: t('nav.telemedicine'), path: '/dashboard/telemedicine', color: 'bg-secondary text-secondary-foreground', img: illustTelemedicine },
  ];

  const pct = medSummary && medSummary.totalDoses > 0
    ? Math.round((medSummary.takenDoses / medSummary.totalDoses) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="rounded-2xl gradient-primary p-6 text-primary-foreground">
        <h2 className="text-xl font-bold">{t('home.welcome')} 👋</h2>
        <p className="mt-1 text-sm text-primary-foreground/80">{t('app.tagline')}</p>
      </div>

      {/* Medication adherence summary */}
      {medSummary && medSummary.activeMeds > 0 && (
        <button
          onClick={() => navigate('/dashboard/medications')}
          className="w-full rounded-xl border border-border bg-card p-4 shadow-card text-left transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">Today's Medications</span>
            </div>
            <span className="text-lg font-bold text-foreground">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {medSummary.takenDoses} / {medSummary.totalDoses} doses taken · {medSummary.activeMeds} active meds
          </p>
        </button>
      )}

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
