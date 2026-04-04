import { ArrowLeft, Video, Clock, CheckCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusConfig = {
  active: { icon: Clock, color: 'bg-warning/10 text-warning-foreground', label: 'Pending' },
  closed: { icon: CheckCircle, color: 'bg-success/10 text-success', label: 'Completed' },
};

export default function Telemedicine() {
  const { t, user, role } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [showForm, setShowForm] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const { data: doctors = [] } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('id, name, specialty, user_id').eq('available', true);
      if (error) throw error;
      return data;
    },
    enabled: role === 'patient',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['telemedicine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitRequest = useMutation({
    mutationFn: async () => {
      const doctor = doctors.find(d => d.id === selectedDoctorId);
      if (!doctor?.user_id) throw new Error('Please select a doctor');
      const { error } = await supabase.from('consultations').insert({
        patient_user_id: user?.id,
        doctor_id: doctor.user_id,
        messages: [{ id: Date.now().toString(), text: symptoms, sender: 'patient', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine'] });
      setShowForm(false);
      setSymptoms('');
      setSelectedDoctorId('');
      toast.success('Telemedicine request submitted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('consultations').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telemedicine'] });
      toast.success('Status updated');
    },
  });

  const filtered = requests.filter((r) => r.status === tab);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center gap-2">
        <Video className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t('telemedicine.title')}</h2>
      </div>
      <div className="flex gap-2">
        {(['active', 'closed'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key === 'active' ? 'Pending' : 'Completed'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const config = statusConfig[r.status as keyof typeof statusConfig] || statusConfig.active;
            const messages = (r.messages as any[]) || [];
            const firstMsg = messages[0];
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground">Teleconsultation</h3>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                    <config.icon className="h-3 w-3" /> {config.label}
                  </span>
                </div>
                {firstMsg && <p className="text-sm text-foreground">{firstMsg.text}</p>}
                <div className="mt-3 flex gap-2">
                  {r.status === 'active' && (
                    <button onClick={() => navigate(`/dashboard/video-call/${r.id}`)} className="flex-1 rounded-lg border border-primary text-primary py-2 text-xs font-semibold hover:bg-primary/5">
                      <Video className="h-3 w-3 inline mr-1" /> Join Call
                    </button>
                  )}
                  {r.status === 'active' && role === 'doctor' && (
                    <button onClick={() => updateStatus.mutate({ id: r.id, status: 'closed' })} className="flex-1 rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground">Complete</button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No requests</p>}
        </div>
      )}

      {role === 'patient' && (
        <button onClick={() => setShowForm(true)} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
          <Plus className="h-5 w-5" /> Request Consultation
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Request Teleconsultation</h3>
            <label className="block text-sm font-medium text-foreground mb-1">Select Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none mb-3"
            >
              <option value="">Choose a doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
              ))}
            </select>
            <label className="block text-sm font-medium text-foreground mb-1">Describe Your Symptoms</label>
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={4} placeholder="Describe what you're experiencing..." className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none" />
            <button onClick={() => submitRequest.mutate()} disabled={!symptoms.trim() || !selectedDoctorId || submitRequest.isPending} className="mt-4 w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {submitRequest.isPending ? '...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
