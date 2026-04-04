import { ArrowLeft, Users, Calendar, Activity, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const { t } = useApp();
  const navigate = useNavigate();

  const { data: patientCount = 0, isCached: cachedPatients } = useOfflineCache<number>(
    ['patients-count'],
    async () => {
      const { count, error } = await supabase.from('patients').select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  );

  const { data: visitsThisMonth = 0, isCached: cachedVisits } = useOfflineCache<number>(
    ['visits-this-month'],
    async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('date', startOfMonth);
      if (error) throw error;
      return count || 0;
    },
  );

  const { data: vaccinationCount = 0 } = useOfflineCache<number>(
    ['vaccinations-count'],
    async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'vaccination')
        .gte('date', startOfMonth);
      if (error) throw error;
      return count || 0;
    },
  );

  const { data: followUpsDue = 0 } = useOfflineCache<number>(
    ['followups-due'],
    async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .gte('follow_up_date', today)
        .lte('follow_up_date', nextWeek);
      if (error) throw error;
      return count || 0;
    },
  );

  const { data: visitsByType = [] } = useOfflineCache<{ name: string; count: number }[]>(
    ['visits-by-type'],
    async () => {
      const { data, error } = await supabase.from('visits').select('type');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach((v) => {
        counts[v.type] = (counts[v.type] || 0) + 1;
      });
      return Object.entries(counts).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));
    },
  );

  const { data: trendData = [] } = useOfflineCache<{ month: string; visits: number }[]>(
    ['patient-trend'],
    async () => {
      const { data, error } = await supabase.from('visits').select('date');
      if (error) throw error;
      const months: Record<string, number> = {};
      (data || []).forEach((v) => {
        const d = new Date(v.date);
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + 1;
      });
      return Object.entries(months)
        .sort((a, b) => {
          const parse = (k: string) => { const [m, y] = k.split(' '); return new Date(`${m} 20${y}`).getTime(); };
          return parse(a[0]) - parse(b[0]);
        })
        .slice(-6)
        .map(([month, visits]) => ({ month, visits }));
    },
  );

  const anyCached = cachedPatients || cachedVisits;

  const stats = [
    { icon: Users, label: t('reports.totalPatients'), value: patientCount.toString(), color: 'text-primary' },
    { icon: Calendar, label: t('reports.visitsMonth'), value: visitsThisMonth.toString(), color: 'text-success' },
    { icon: Activity, label: t('reports.vaccinations'), value: vaccinationCount.toString(), color: 'text-accent-foreground' },
    { icon: Clock, label: t('reports.followUpsDue'), value: followUpsDue.toString(), color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('reports.title')}{anyCached ? ' (cached)' : ''}</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3">Visits by Type</h3>
        {visitsByType.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={visitsByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No visit data yet</p>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3">Visit Trend</h3>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip />
              <Area type="monotone" dataKey="visits" stroke="hsl(243, 75%, 59%)" fill="hsl(243, 75%, 59%, 0.15)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No visit data yet</p>
        )}
      </div>
    </div>
  );
}
