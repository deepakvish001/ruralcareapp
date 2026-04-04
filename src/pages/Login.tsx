import { useNavigate } from 'react-router-dom';
import { User, Heart, Stethoscope, Activity } from 'lucide-react';
import { useApp, UserRole } from '@/contexts/AppContext';

const roles: { key: UserRole; icon: React.ElementType; color: string; accent: string }[] = [
  { key: 'patient', icon: User, color: 'border-l-primary', accent: 'bg-primary/10 text-primary' },
  { key: 'healthWorker', icon: Heart, color: 'border-l-success', accent: 'bg-success/10 text-success' },
  { key: 'doctor', icon: Stethoscope, color: 'border-l-accent', accent: 'bg-accent/10 text-accent-foreground' },
];

export default function Login() {
  const { t, setRole } = useApp();
  const navigate = useNavigate();

  const handleSelect = (role: UserRole) => {
    setRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <div className="text-center">
          <Activity className="h-20 w-20 text-primary-foreground mx-auto mb-6 animate-float" />
          <h1 className="text-4xl font-extrabold text-primary-foreground">RuralCare</h1>
          <p className="mt-3 text-lg text-primary-foreground/80">{t('app.tagline')}</p>
        </div>
      </div>

      {/* Right role selection */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">RuralCare</span>
        </div>

        <h2 className="text-2xl font-bold text-foreground">{t('login.title')}</h2>
        <p className="mt-2 text-muted-foreground">{t('login.subtitle')}</p>

        <div className="mt-8 w-full max-w-md space-y-4">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => handleSelect(r.key)}
              className={`w-full flex items-center gap-4 rounded-xl border border-border ${r.color} border-l-4 bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5`}
            >
              <div className={`rounded-lg p-3 ${r.accent}`}>
                <r.icon className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-foreground">{t(`role.${r.key}`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`role.${r.key}.desc`)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
