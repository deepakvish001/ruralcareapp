import { ArrowLeft, Send, ChevronLeft, Plus, X, Trash2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'doctor' | 'patient';
  time: string;
}

export default function Consultations() {
  const { t, user, role } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');

  const isPatient = role === 'patient';
  const senderRole = isPatient ? 'patient' : 'doctor';

  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('id, name');
      if (error) throw error;
      return data;
    },
    enabled: !isPatient,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('id, name, user_id');
      if (error) throw error;
      return data;
    },
    enabled: isPatient,
  });

  const { data: consultations = [], isLoading, isCached } = useOfflineCache(
    ['consultations', role || ''],
    async () => {
      let query = supabase
        .from('consultations')
        .select('*, patients(name)')
        .order('updated_at', { ascending: false });

      if (isPatient) {
        query = query.eq('patient_user_id', user?.id!);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  );

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('consultations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['consultations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createConsultation = useMutation({
    mutationFn: async (patientId?: string) => {
      const { error } = await supabase.from('consultations').insert({
        doctor_id: user?.id!,
        patient_id: patientId || null,
        messages: [],
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      setShowForm(false);
      setSelectedPatientId('');
      toast.success('Consultation created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const consultation = consultations.find((c) => c.id === activeChat);
      if (!consultation) return;
      const currentMessages = (consultation.messages as unknown as ChatMessage[]) ?? [];
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        sender: senderRole,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const updatedMessages = [...currentMessages, newMsg] as unknown as Json[];
      const { error } = await supabase
        .from('consultations')
        .update({ messages: updatedMessages })
        .eq('id', activeChat);
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
  });

  const closeConsultation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultations').update({ status: 'closed' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success('Consultation closed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteConsultation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('consultations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveChat(null);
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success('Consultation deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activeConsultation = consultations.find((c) => c.id === activeChat);

  // Chat view
  if (activeChat && activeConsultation) {
    const messages = (activeConsultation.messages as unknown as ChatMessage[]) || [];
    const canSend = activeConsultation.status === 'active';
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] animate-fade-in-up">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => setActiveChat(null)} className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">{((activeConsultation as any).patients?.name?.[0] || 'C').toUpperCase()}</div>
          <h3 className="font-semibold text-foreground">{(activeConsultation as any).patients?.name || 'Consultation'}</h3>
          <div className="ml-auto flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${activeConsultation.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
              {activeConsultation.status}
            </span>
            {activeConsultation.status === 'active' && !isPatient && (
              <button onClick={() => closeConsultation.mutate(activeChat)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" title="Close consultation">
                <X className="h-4 w-4" />
              </button>
            )}
            {!isPatient && (
              <button onClick={() => { if (confirm('Delete this consultation?')) deleteConsultation.mutate(activeChat); }} className="rounded-lg border border-destructive/30 p-1.5 text-destructive hover:bg-destructive/10" title="Delete consultation">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation.</p>}
          {messages.map((m) => {
            const isMe = m.sender === senderRole;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  <p className="text-sm">{m.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        {canSend && (
          <div className="flex gap-2 pt-3 border-t border-border">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && message.trim() && sendMessage.mutate()}
              placeholder={t('consultations.typeMessage')}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button onClick={() => message.trim() && sendMessage.mutate()} disabled={!message.trim()} className="rounded-lg gradient-primary p-2.5 text-primary-foreground disabled:opacity-50">
              <Send className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('consultations.title')}{isCached ? ' (cached)' : ''}</h2>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {consultations
            .filter((c) => {
              const name = ((c as any).patients?.name || '').toLowerCase();
              const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
              return matchesSearch && matchesStatus;
            })
            .map((c) => {
            const msgs = (c.messages as unknown as ChatMessage[]) || [];
            const lastMsg = msgs[msgs.length - 1];
            return (
              <button key={c.id} onClick={() => setActiveChat(c.id)} className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">{((c as any).patients?.name?.[0] || 'C').toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{(c as any).patients?.name || 'Consultation'}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastMsg?.text || 'No messages yet'}</p>
                </div>
              </button>
            );
          })}
          {consultations.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No consultations yet</p>}
        </div>
      )}

      {!isPatient && !showForm && (
        <button onClick={() => setShowForm(true)} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
          <Plus className="h-5 w-5" /> New Consultation
        </button>
      )}

      {!isPatient && showForm && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm rounded-xl border border-border bg-card p-4 shadow-elevated space-y-3">
          <h4 className="font-semibold text-foreground text-sm">Select Patient</h4>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">No patient (general)</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">Cancel</button>
            <button onClick={() => createConsultation.mutate(selectedPatientId || undefined)} className="flex-1 rounded-lg gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}
