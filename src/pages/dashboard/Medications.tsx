import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Pill, Clock, Check, Trash2, Bell, BellOff, X, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const frequencyOptions = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed'];

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_slots: string[];
  start_date: string;
  end_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
  scheduled_time: string | null;
  status: string;
}

export default function Medications() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'active' | 'history' | 'adherence'>('active');
  const [adherenceRange, setAdherenceRange] = useState<'week' | 'month'>('week');
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem('med-reminders') === 'true');

  // Form state
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [timeSlots, setTimeSlots] = useState<string[]>(['08:00']);
  const [notes, setNotes] = useState('');

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!user,
  });

  const { data: todayLogs = [] } = useQuery({
    queryKey: ['medication-logs-today', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .gte('taken_at', today + 'T00:00:00')
        .lte('taken_at', today + 'T23:59:59');
      if (error) throw error;
      return data as MedicationLog[];
    },
    enabled: !!user,
  });

  const createMedication = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('medications').insert({
        user_id: user!.id,
        name,
        dosage,
        frequency,
        time_slots: timeSlots,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication added!');
      resetForm();
    },
    onError: () => toast.error('Failed to add medication'),
  });

  const logMedication = useMutation({
    mutationFn: async ({ medicationId, scheduledTime }: { medicationId: string; scheduledTime: string }) => {
      const { error } = await supabase.from('medication_logs').insert({
        medication_id: medicationId,
        user_id: user!.id,
        scheduled_time: scheduledTime,
        status: 'taken',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-logs-today'] });
      toast.success('Marked as taken ✓');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('medications').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medications'] }),
  });

  const deleteMedication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication removed');
    },
  });

  const resetForm = () => {
    setName('');
    setDosage('');
    setFrequency('Once daily');
    setTimeSlots(['08:00']);
    setNotes('');
    setShowForm(false);
  };

  const isTakenToday = (medicationId: string, time: string) =>
    todayLogs.some((l) => l.medication_id === medicationId && l.scheduled_time === time);

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications.filter((m) => !m.active);
  const displayed = tab === 'active' ? activeMeds : inactiveMeds;

  // Reminder notifications
  useEffect(() => {
    if (!remindersEnabled || !('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();

    const interval = setInterval(() => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      activeMeds.forEach((med) => {
        med.time_slots.forEach((slot) => {
          if (slot === currentTime && !isTakenToday(med.id, slot)) {
            new Notification('💊 Medication Reminder', {
              body: `Time to take ${med.name} (${med.dosage})`,
              icon: '/icons/icon-192x192.png',
            });
          }
        });
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [remindersEnabled, activeMeds, todayLogs]);

  const toggleReminders = () => {
    const next = !remindersEnabled;
    setRemindersEnabled(next);
    localStorage.setItem('med-reminders', String(next));
    if (next && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    toast.success(next ? 'Reminders enabled' : 'Reminders disabled');
  };

  const addTimeSlot = () => setTimeSlots([...timeSlots, '12:00']);
  const removeTimeSlot = (i: number) => setTimeSlots(timeSlots.filter((_, idx) => idx !== i));
  const updateTimeSlot = (i: number, val: string) => {
    const copy = [...timeSlots];
    copy[i] = val;
    setTimeSlots(copy);
  };

  // Count how many doses are taken today vs total scheduled
  const totalDoses = activeMeds.reduce((sum, m) => sum + m.time_slots.length, 0);
  const takenDoses = activeMeds.reduce(
    (sum, m) => sum + m.time_slots.filter((t) => isTakenToday(m.id, t)).length,
    0
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Medications</h2>
        </div>
        <button onClick={toggleReminders} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors" title={remindersEnabled ? 'Disable reminders' : 'Enable reminders'}>
          {remindersEnabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5" />}
        </button>
      </div>

      {/* Today's progress */}
      {activeMeds.length > 0 && (
        <div className="rounded-xl gradient-primary p-4 text-primary-foreground">
          <p className="text-sm font-medium opacity-80">Today's Progress</p>
          <p className="text-2xl font-bold">{takenDoses} / {totalDoses} doses</p>
          <div className="mt-2 h-2 rounded-full bg-primary-foreground/20">
            <div className="h-2 rounded-full bg-primary-foreground transition-all" style={{ width: totalDoses ? `${(takenDoses / totalDoses) * 100}%` : '0%' }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['active', 'history'] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors capitalize ${tab === key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {key === 'active' ? `Active (${activeMeds.length})` : `Inactive (${inactiveMeds.length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {displayed.map((med) => (
            <div key={med.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{med.name}</h3>
                  <p className="text-sm text-muted-foreground">{med.dosage} · {med.frequency}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive.mutate({ id: med.id, active: !med.active })}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium ${med.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {med.active ? 'Active' : 'Paused'}
                  </button>
                  <button onClick={() => deleteMedication.mutate(med.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {med.notes && <p className="text-xs text-muted-foreground mb-2">{med.notes}</p>}

              {/* Time slots with take buttons */}
              {med.active && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {med.time_slots.map((time) => {
                    const taken = isTakenToday(med.id, time);
                    return (
                      <button
                        key={time}
                        onClick={() => !taken && logMedication.mutate({ medicationId: med.id, scheduledTime: time })}
                        disabled={taken}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          taken
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-border text-foreground hover:bg-primary/10 hover:border-primary/30'
                        }`}
                      >
                        {taken ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {time}
                        {taken && <span className="text-[10px]">taken</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {displayed.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tab === 'active' ? 'No active medications. Tap + to add one.' : 'No inactive medications.'}
            </p>
          )}
        </div>
      )}

      {/* Add button */}
      <button onClick={() => setShowForm(true)} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
        <Plus className="h-5 w-5" /> Add Medication
      </button>

      {/* Add medication form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Add Medication</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>

            <label className="block text-sm font-medium text-foreground mb-1">Medication Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none mb-3" />

            <label className="block text-sm font-medium text-foreground mb-1">Dosage</label>
            <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none mb-3" />

            <label className="block text-sm font-medium text-foreground mb-1">Frequency</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {frequencyOptions.map((f) => (
                <button key={f} onClick={() => setFrequency(f)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${frequency === f ? 'gradient-primary text-primary-foreground border-primary' : 'border-border text-foreground hover:bg-muted'}`}>
                  {f}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-foreground mb-1">Reminder Times</label>
            <div className="space-y-2 mb-3">
              {timeSlots.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" value={slot} onChange={(e) => updateTimeSlot(i, e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                  {timeSlots.length > 1 && (
                    <button onClick={() => removeTimeSlot(i)} className="rounded-lg p-2 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addTimeSlot} className="text-xs text-primary font-medium">+ Add time</button>
            </div>

            <label className="block text-sm font-medium text-foreground mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Take with food..."
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none resize-none mb-3" />

            <button onClick={() => createMedication.mutate()} disabled={!name || !dosage || createMedication.isPending}
              className="w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {createMedication.isPending ? '...' : 'Save Medication'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
