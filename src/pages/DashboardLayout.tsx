import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import SOSButton from '@/components/SOSButton';

export default function DashboardLayout() {
  const { role, t } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate('/login');
  }, [role, navigate]);

  if (!role) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{t('app.name')}</h1>
            <p className="text-xs text-muted-foreground">{t(`role.${role}`)}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="container mx-auto px-4 py-4">
        <Outlet />
      </main>

      <SOSButton />
      <BottomNav />
    </div>
  );
}
