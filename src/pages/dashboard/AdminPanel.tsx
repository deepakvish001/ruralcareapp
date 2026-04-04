import { ArrowLeft, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminPanel() {
  const { isAdmin } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['role-change-requests-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_change_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Fetch profile info for each request
      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      return (data || []).map((r: any) => ({ ...r, display_name: profileMap[r.user_id] || 'Unknown' }));
    },
    enabled: isAdmin,
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status, userId, toRole }: { id: string; status: string; userId: string; toRole: string }) => {
      // Update request status
      const { error } = await supabase
        .from('role_change_requests')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // If approved, update the user's profile role
      if (status === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: toRole })
          .eq('user_id', userId);
        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['role-change-requests-admin'] });
      toast.success(`Request ${vars.status}!`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        You do not have permission to view this page.
      </div>
    );
  }

  const statusIcon = (status: string) => {
    if (status === 'approved') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'denied') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning-foreground" />;
  };

  const roleName = (role: string) => {
    const map: Record<string, string> = { patient: 'Patient', healthWorker: 'Health Worker', doctor: 'Doctor', admin: 'Admin' };
    return map[role] || role;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Admin Panel</h2>
      <p className="text-sm text-muted-foreground">Review and manage role change requests from users.</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !requests?.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          No role change requests yet.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <div key={req.id} className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground text-sm">{req.display_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {roleName(req.from_role)} → <span className="font-medium text-foreground">{roleName(req.to_role)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusIcon(req.status)}
                  <span className={`text-xs font-medium capitalize ${
                    req.status === 'approved' ? 'text-success' : req.status === 'denied' ? 'text-destructive' : 'text-warning-foreground'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                "{req.reason}"
              </p>

              <p className="text-[10px] text-muted-foreground/70">
                {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString()}
              </p>

              {req.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => updateRequest.mutate({ id: req.id, status: 'approved', userId: req.user_id, toRole: req.to_role })}
                    disabled={updateRequest.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-xs font-semibold text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                  >
                    {updateRequest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                  <button
                    onClick={() => updateRequest.mutate({ id: req.id, status: 'denied', userId: req.user_id, toRole: req.to_role })}
                    disabled={updateRequest.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                  >
                    {updateRequest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
