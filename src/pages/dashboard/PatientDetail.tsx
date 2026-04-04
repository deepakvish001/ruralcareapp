import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'visits' | 'consultations'>('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['patient-visits', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('visits').select('*').eq('patient_id', id!).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: consultations = [] } = useQuery({
    queryKey: ['patient-consultations', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('consultations').select('*').eq('patient_id', id!).order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['patient-referrals', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('referrals').select('*').eq('patient_id', id!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  if (!patient) return <div className="text-center py-8 text-muted-foreground">Patient not found</div>;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
            {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{patient.name}</h2>
            <p className="text-sm text-muted-foreground">{patient.age}y · {patient.gender} {patient.village ? `· ${patient.village}` : ''}</p>
            {patient.phone && <p className="text-xs text-muted-foreground">{patient.phone}</p>}
          </div>
        </div>
        {patient.conditions && patient.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {patient.conditions.map((c: string, i: number) => (
              <span key={i} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {(['overview', 'visits', 'consultations'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors capitalize ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold text-primary">{visits.length}</p>
              <p className="text-xs text-muted-foreground">Visits</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold text-primary">{consultations.length}</p>
              <p className="text-xs text-muted-foreground">Consults</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <p className="text-2xl font-bold text-primary">{referrals.length}</p>
              <p className="text-xs text-muted-foreground">Referrals</p>
            </div>
          </div>
          {referrals.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Recent Referrals</h3>
              {referrals.slice(0, 3).map((r: any) => (
                <div key={r.id} className="rounded-lg border border-border bg-card p-3 mb-2">
                  <p className="text-sm font-medium text-foreground">{r.destination_hospital}</p>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${r.status === 'pending' ? 'bg-warning/10 text-warning-foreground' : 'bg-success/10 text-success'}`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'visits' && (
        <div className="space-y-3">
          {visits.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No visits recorded</p>}
          {visits.map((v: any) => (
            <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">{v.type}</span>
                <span className="text-xs text-muted-foreground">{new Date(v.date).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {v.weight && <div><span className="text-muted-foreground">Weight:</span> <span className="text-foreground font-medium">{v.weight} kg</span></div>}
                {v.temperature && <div><span className="text-muted-foreground">Temp:</span> <span className="text-foreground font-medium">{v.temperature}°F</span></div>}
                {v.blood_pressure && <div><span className="text-muted-foreground">BP:</span> <span className="text-foreground font-medium">{v.blood_pressure}</span></div>}
              </div>
              {v.notes && <p className="text-sm text-muted-foreground mt-2">{v.notes}</p>}
              {v.follow_up_date && <p className="text-xs text-primary mt-1">Follow-up: {new Date(v.follow_up_date).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'consultations' && (
        <div className="space-y-3">
          {consultations.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No consultations</p>}
          {consultations.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{((c.messages as any[]) || []).length} messages</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
