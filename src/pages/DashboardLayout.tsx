import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Settings, LogOut, CloudOff } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import BottomNav from '@/components/BottomNav';
import SOSButton from '@/components/SOSButton';
import NotificationBell from '@/components/NotificationBell';
import InstallPWA from '@/components/InstallPWA';

export default function DashboardLayout() {
  const { role, t, user, loading, signOut } = useApp();
  const navigate = useNavigate();
  const { pendingCount } = useOfflineQueue();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
    else if (!loading && user && !role) navigate('/login');
  }, [role, user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user || !role) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-card glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t(`role.${role}`)}</p>
          </div>
          <div className="flex items-center gap-1">
            {pendingCount > 0 && (
              <button
                onClick={() => navigate('/dashboard/sync')}
                className="flex items-center gap-1 rounded-full bg-warning/10 border border-warning/30 px-2 py-1 text-[10px] font-medium text-warning-foreground mr-1"
              >
                <CloudOff className="h-3 w-3" />
                {pendingCount}
              </button>
            )}
            <NotificationBell />
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="rounded-lg p-2 bg-muted/60 text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-border mx-0.5" />
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-destructive/70 hover:bg-destructive/15 hover:text-destructive transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <Outlet />
      </main>

      <SOSButton />
      <InstallPWA />
      <BottomNav />
    </div>
  );
}
