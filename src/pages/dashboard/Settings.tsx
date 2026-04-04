import { ArrowLeft, Globe, Moon, Sun, UserCog, Info, LogOut, Stethoscope, Save, Loader2, CloudOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, UserRole } from '@/contexts/AppContext';
import { Language, languageNames } from '@/i18n/translations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export default function Settings() {
  const { t, language, setLanguage, darkMode, setDarkMode, role, setRole, signOut, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pendingCount } = useOfflineQueue();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const languages: Language[] = ['en', 'hi', 'ta', 'te', 'bn'];
  const roles: { key: UserRole; label: string }[] = [
    { key: 'patient', label: t('role.patient') },
    { key: 'healthWorker', label: t('role.healthWorker') },
    { key: 'doctor', label: t('role.doctor') },
  ];

  // Doctor profile management
  const { data: doctorProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && role === 'doctor',
  });

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialty: '',
    facility_type: 'PHC',
    location: '',
    phone: '',
    available: true,
  });

  useEffect(() => {
    if (doctorProfile) {
      setDoctorForm({
        name: doctorProfile.name || '',
        specialty: doctorProfile.specialty || '',
        facility_type: doctorProfile.facility_type || 'PHC',
        location: doctorProfile.location || '',
        phone: doctorProfile.phone || '',
        available: doctorProfile.available ?? true,
      });
    }
  }, [doctorProfile]);

  const saveDoctorProfile = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (doctorProfile) {
        const { error } = await supabase
          .from('doctors')
          .update({ ...doctorForm })
          .eq('id', doctorProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert({ ...doctorForm, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      toast.success('Doctor profile saved!');
    },
    onError: (err: any) => toast.error(err.message),
  });

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

      {/* Doctor Profile Management */}
      {role === 'doctor' && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Doctor Profile</h3>
          </div>
          {loadingProfile ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="space-y-3">
              <input
                placeholder="Full Name"
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                placeholder="Specialty (e.g. General Medicine)"
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={doctorForm.facility_type}
                  onChange={(e) => setDoctorForm({ ...doctorForm, facility_type: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                >
                  <option value="PHC">PHC</option>
                  <option value="District Hospital">District Hospital</option>
                  <option value="Private Clinic">Private Clinic</option>
                  <option value="Community Health Center">CHC</option>
                </select>
                <input
                  placeholder="Location / Distance"
                  value={doctorForm.location}
                  onChange={(e) => setDoctorForm({ ...doctorForm, location: e.target.value })}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                placeholder="Phone number"
                value={doctorForm.phone}
                onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Available for consultations</span>
                <button
                  onClick={() => setDoctorForm({ ...doctorForm, available: !doctorForm.available })}
                  className={`relative h-7 w-12 rounded-full transition-colors ${doctorForm.available ? 'bg-success' : 'bg-muted'}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform ${doctorForm.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <button
                onClick={() => saveDoctorProfile.mutate()}
                disabled={!doctorForm.name || !doctorForm.specialty || saveDoctorProfile.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {saveDoctorProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {doctorProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          )}
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

      {/* Role Display */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{t('settings.role')}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {roles.find((r) => r.key === role)?.label || role}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Your role was set when you first signed up.
        </p>
        <a
          href="mailto:support@ruralcare.app?subject=Role%20Change%20Request&body=Hi%2C%20I%20would%20like%20to%20change%20my%20role.%0A%0ACurrent%20role%3A%20{role}%0ADesired%20role%3A%20%0AReason%3A%20"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          Request Role Change
        </a>
      </div>

      {/* Offline Sync */}
      <button
        onClick={() => navigate('/dashboard/sync')}
        className="w-full rounded-xl border border-border bg-card p-4 shadow-card flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-sm">Offline Sync Queue</h3>
            <p className="text-xs text-muted-foreground">View and manage pending offline actions</p>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full gradient-primary px-1.5 text-[11px] font-bold text-primary-foreground">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Sign Out */}
      <button
        onClick={() => setShowSignOutDialog(true)}
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

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
