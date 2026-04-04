import { ArrowLeft, CalendarDays, Clock, Plus, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-warning/10 text-warning-foreground', label: 'Pending' },
  confirmed: { color: 'bg-success/10 text-success', label: 'Confirmed' },
  cancelled: { color: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
};

export default function Appointments() {
  const { t, user, role } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const isPatient = role === 'patient';
  const isDoctor = role === 'doctor';

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-for-booking'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('id, name, specialty, user_id').eq('available', true);
      if (error) throw error;
      return data;
    },
    enabled: isPatient,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      const doctor = doctors.find(d => d.id === selectedDoctor);
      if (!doctor?.user_id) throw new Error('Please select a doctor');
      if (!selectedDate) throw new Error('Please select a date');
      if (!selectedSlot) throw new Error('Please select a time slot');
      const { error } = await supabase.from('appointments').insert({
        patient_user_id: user?.id!,
        doctor_id: doctor.user_id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedSlot,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowForm(false);
      setSelectedDoctor('');
      setSelectedDate(undefined);
      setSelectedSlot('');
      setReason('');
      toast.success('Appointment booked!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const today = new Date().toISOString().split('T')[0];
  const upcoming = appointments.filter(a => a.appointment_date >= today && a.status !== 'cancelled');
  const past = appointments.filter(a => a.appointment_date < today || a.status === 'cancelled');
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold text-foreground">{t('appointments.title') || 'Appointments'}</h2>
      </div>

      <div className="flex gap-2">
        {(['upcoming', 'past'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors capitalize ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {displayed.map((a) => {
            const config = statusConfig[a.status] || statusConfig.pending;
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{new Date(a.appointment_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{a.time_slot}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>{config.label}</span>
                </div>
                {a.reason && <p className="text-sm text-foreground mt-1">{a.reason}</p>}
                
                {a.status === 'pending' && isDoctor && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => updateStatus.mutate({ id: a.id, status: 'confirmed' })} className="flex-1 flex items-center justify-center gap-1 rounded-lg gradient-primary py-2 text-xs font-semibold text-primary-foreground">
                      <CheckCircle className="h-3.5 w-3.5" /> Confirm
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: a.id, status: 'cancelled' })} className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-destructive/30 py-2 text-xs font-semibold text-destructive">
                      <XCircle className="h-3.5 w-3.5" /> Decline
                    </button>
                  </div>
                )}
                {a.status === 'pending' && isPatient && (
                  <button onClick={() => updateStatus.mutate({ id: a.id, status: 'cancelled' })} className="mt-3 w-full rounded-lg border border-destructive/30 py-2 text-xs font-semibold text-destructive">
                    Cancel Appointment
                  </button>
                )}
              </div>
            );
          })}
          {displayed.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No {tab} appointments</p>}
        </div>
      )}
    </div>

      {isPatient && (
        <button onClick={() => setShowForm(true)} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
          <Plus className="h-5 w-5" /> Book Appointment
        </button>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">Book Appointment</h3>

            <label className="block text-sm font-medium text-foreground mb-1">Select Doctor</label>
            <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none mb-3">
              <option value="">Choose a doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-foreground mb-1">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn("w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-left mb-3", !selectedDate && "text-muted-foreground")}>
                  <CalendarDays className="h-4 w-4 inline mr-2" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <label className="block text-sm font-medium text-foreground mb-1">Select Time</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {timeSlots.map((slot) => (
                <button key={slot} onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border py-2 text-xs font-medium transition-colors ${selectedSlot === slot ? 'gradient-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {slot}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-foreground mb-1">Reason (optional)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Brief reason for visit..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none mb-3" />

            <button onClick={() => createAppointment.mutate()} disabled={!selectedDoctor || !selectedDate || !selectedSlot || createAppointment.isPending}
              className="w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {createAppointment.isPending ? '...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
