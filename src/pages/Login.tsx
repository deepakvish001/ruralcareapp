import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Stethoscope, Activity, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useApp, UserRole } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import rolePatientImg from '@/assets/role-patient.png';
import roleHealthworkerImg from '@/assets/role-healthworker.png';
import roleDoctorImg from '@/assets/role-doctor.png';

const roleImages: Record<UserRole, string> = {
  patient: rolePatientImg,
  healthWorker: roleHealthworkerImg,
  doctor: roleDoctorImg,
};

const roles: { key: UserRole; icon: React.ElementType; color: string; accent: string }[] = [
  { key: 'patient', icon: User, color: 'border-l-primary', accent: 'bg-primary/10 text-primary' },
  { key: 'healthWorker', icon: Heart, color: 'border-l-success', accent: 'bg-success/10 text-success' },
  { key: 'doctor', icon: Stethoscope, color: 'border-l-accent', accent: 'bg-accent/10 text-accent-foreground' },
];

type Step = 'auth' | 'role';

export default function Login() {
  const { t, setRole, user, role } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(user ? 'role' : 'auth');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  // If user already has a role, go straight to dashboard
  useEffect(() => {
    if (user && role) {
      navigate('/dashboard');
    }
  }, [user, role, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t('login.signupSuccess') || 'Account created! Please check your email to verify.');
        setStep('role');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t('login.loginSuccess') || 'Logged in successfully!');
        setStep('role');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: UserRole) => {
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

      {/* Right content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">RuralCare</span>
        </div>

        {step === 'auth' ? (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-foreground">
              {isSignUp ? (t('login.signUp') || 'Create Account') : (t('login.signIn') || 'Sign In')}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? (t('login.signUpDesc') || 'Join RuralCare to access healthcare services') : (t('login.signInDesc') || 'Welcome back! Sign in to continue')}
            </p>

            <form onSubmit={handleAuth} className="mt-8 space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('login.displayName') || 'Display Name'}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder={t('login.email') || 'Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder={t('login.password') || 'Password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl gradient-primary py-3 font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? '...' : isSignUp ? (t('login.signUp') || 'Create Account') : (t('login.signIn') || 'Sign In')}
              </button>
            </form>

            {!isSignUp && (
              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) { toast.error('Enter your email first'); return; }
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) toast.error(error.message);
                    else toast.success('Password reset email sent! Check your inbox.');
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </p>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? (t('login.haveAccount') || 'Already have an account?') : (t('login.noAccount') || "Don't have an account?")}
              {' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline">
                {isSignUp ? (t('login.signIn') || 'Sign In') : (t('login.signUp') || 'Sign Up')}
              </button>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-foreground">{t('login.title')}</h2>
            <p className="mt-2 text-muted-foreground">{t('login.subtitle')}</p>

            <div className="mt-8 space-y-4">
              {roles.map((r) => (
                <button
                  key={r.key}
                  onClick={() => handleSelectRole(r.key)}
                  className={`w-full flex items-center gap-4 rounded-xl border border-border ${r.color} border-l-4 bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:-translate-y-0.5`}
                >
                  <img src={roleImages[r.key]} alt={r.key} className="h-14 w-14 object-contain" loading="lazy" width={56} height={56} />
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-foreground">{t(`role.${r.key}`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`role.${r.key}.desc`)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
