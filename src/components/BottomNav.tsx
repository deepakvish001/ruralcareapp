import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Stethoscope, Heart, MapPin, Users, CalendarDays, BarChart3, ListOrdered, MessageSquare, GitBranch, CalendarCheck, Settings } from 'lucide-react';
import { useApp, UserRole } from '@/contexts/AppContext';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  path: string;
}

const navItems: Partial<Record<UserRole, NavItem[]>> = {
  patient: [
    { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
    { icon: Stethoscope, labelKey: 'nav.symptoms', path: '/dashboard/symptoms' },
    { icon: CalendarCheck, labelKey: 'nav.appointments', path: '/dashboard/appointments' },
    { icon: MapPin, labelKey: 'nav.findDoctor', path: '/dashboard/find-doctor' },
  ],
  healthWorker: [
    { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
    { icon: Users, labelKey: 'nav.patients', path: '/dashboard/patients' },
    { icon: CalendarDays, labelKey: 'nav.scheduler', path: '/dashboard/scheduler' },
    { icon: BarChart3, labelKey: 'nav.reports', path: '/dashboard/reports' },
  ],
  doctor: [
    { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
    { icon: ListOrdered, labelKey: 'nav.queue', path: '/dashboard/queue' },
    { icon: MessageSquare, labelKey: 'nav.consultations', path: '/dashboard/consultations' },
    { icon: GitBranch, labelKey: 'nav.referrals', path: '/dashboard/referrals' },
  ],
  admin: [
    { icon: Home, labelKey: 'nav.home', path: '/dashboard' },
    { icon: Settings, labelKey: 'nav.admin', path: '/dashboard/admin' },
  ],
};

export default function BottomNav() {
  const { role, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  if (!role) return null;

  const items = navItems[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card glass">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="truncate max-w-[72px] text-[10px]">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
