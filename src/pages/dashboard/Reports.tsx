import { ArrowLeft, Users, Calendar, Activity, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const visitData = [
  { name: 'Routine', count: 45 },
  { name: 'Follow-up', count: 28 },
  { name: 'Vaccination', count: 18 },
  { name: 'Emergency', count: 8 },
  { name: 'Pregnancy', count: 12 },
];

const trendData = [
  { month: 'Jan', patients: 12 },
  { month: 'Feb', patients: 19 },
  { month: 'Mar', patients: 28 },
  { month: 'Apr', patients: 35 },
];

export default function Reports() {
  const { t } = useApp();
  const navigate = useNavigate();

  const patients = JSON.parse(localStorage.getItem('ruralcare_patients') || '[]');

  const stats = [
    { icon: Users, label: t('reports.totalPatients'), value: patients.length.toString(), color: 'text-primary' },
    { icon: Calendar, label: t('reports.visitsMonth'), value: '38', color: 'text-success' },
    { icon: Activity, label: t('reports.vaccinations'), value: '18', color: 'text-accent-foreground' },
    { icon: Clock, label: t('reports.followUpsDue'), value: '7', color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('reports.title')}</h2>
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
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={visitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3">Patient Registration Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Area type="monotone" dataKey="patients" stroke="hsl(243, 75%, 59%)" fill="hsl(243, 75%, 59%, 0.15)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
