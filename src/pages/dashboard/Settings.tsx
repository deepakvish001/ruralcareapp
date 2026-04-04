import { ArrowLeft, Globe, Moon, Sun, UserCog, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp, UserRole } from '@/contexts/AppContext';
import { Language, languageNames } from '@/i18n/translations';

export default function Settings() {
  const { t, language, setLanguage, darkMode, setDarkMode, role, setRole, signOut, user } = useApp();
  const navigate = useNavigate();

  const languages: Language[] = ['en', 'hi', 'ta', 'te', 'bn'];
  const roles: { key: UserRole; label: string }[] = [
    { key: 'patient', label: t('role.patient') },
    { key: 'healthWorker', label: t('role.healthWorker') },
    { key: 'doctor', label: t('role.doctor') },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('settings.title')}</h2>

      {/* Account */}
      {user && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
              {(user.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user.user_metadata?.display_name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Language */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('settings.language')}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                language === lang ? 'gradient-primary text-primary-foreground shadow-soft' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {languageNames[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* Dark Mode */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-accent" />}
            <h3 className="font-semibold text-foreground">{t('settings.darkMode')}</h3>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative h-7 w-12 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Role Switch */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <UserCog className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('settings.role')}</h3>
        </div>
        <div className="space-y-2">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => { setRole(r.key); navigate('/dashboard'); }}
              className={`w-full rounded-lg px-4 py-3 text-sm font-medium text-left transition-all ${
                role === r.key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive font-medium hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        {t('settings.signOut') || 'Sign Out'}
      </button>

      {/* About */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('settings.about')}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          RuralCare v1.0 — Healthcare access for every village. Built with ❤️ for rural India.
        </p>
      </div>
    </div>
  );
}
