import { useState } from 'react';
import { UserCog, Mail, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { UserRole } from '@/contexts/AppContext';
import type { User } from '@supabase/supabase-js';

interface Props {
  role: UserRole | null;
  roles: { key: UserRole; label: string }[];
  user: User | null;
}

export default function RoleChangeSection({ role, roles, user }: Props) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [desiredRole, setDesiredRole] = useState('');
  const [reason, setReason] = useState('');

  const { data: existingRequest } = useQuery({
    queryKey: ['role-change-request', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('role_change_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!user || !role) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('role_change_requests')
        .insert({
          user_id: user.id,
          from_role: role,
          to_role: desiredRole,
          reason,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-change-request', user?.id] });
      toast.success('Role change request submitted!');
      setShowForm(false);
      setDesiredRole('');
      setReason('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const availableRoles = roles.filter((r) => r.key !== role);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <UserCog className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Role</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {roles.find((r) => r.key === role)?.label || role}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        Your role was set when you first signed up.
      </p>

      {existingRequest ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
          <CheckCircle className="h-4 w-4 text-warning-foreground shrink-0" />
          <p className="text-xs text-warning-foreground">
            Pending request to switch to <span className="font-semibold">{existingRequest.to_role}</span>
          </p>
        </div>
      ) : showForm ? (
        <div className="mt-3 space-y-3">
          <select
            value={desiredRole}
            onChange={(e) => setDesiredRole(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground"
          >
            <option value="">Select desired role</option>
            {availableRoles.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
          <textarea
            placeholder="Why do you need this role change?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => submitRequest.mutate()}
              disabled={!desiredRole || !reason.trim() || submitRequest.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {submitRequest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Submit
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          Request Role Change
        </button>
      )}
    </div>
  );
}
