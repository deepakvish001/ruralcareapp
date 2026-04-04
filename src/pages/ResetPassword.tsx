import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">RuralCare</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center">Set New Password</h2>
        <p className="mt-2 text-muted-foreground text-center">Enter your new password below</p>

        <form onSubmit={handleReset} className="mt-8 space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="New Password"
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
            {loading ? '...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
