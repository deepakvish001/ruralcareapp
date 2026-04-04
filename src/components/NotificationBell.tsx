import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function NotificationBell() {
  const { user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-foreground text-sm">Notifications</h4>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => { markAsRead(n.id); setShowDropdown(false); }}
                  className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
