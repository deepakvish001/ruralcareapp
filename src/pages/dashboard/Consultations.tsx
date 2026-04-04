import { ArrowLeft, Send, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface Chat {
  id: string;
  patient: string;
  lastMessage: string;
  unread: number;
  time: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'doctor' | 'patient';
  time: string;
}

const mockChats: Chat[] = [
  { id: '1', patient: 'Lakshmi Devi', lastMessage: 'Doctor, my fever is still not going down', unread: 2, time: '2 min ago' },
  { id: '2', patient: 'Ramu Singh', lastMessage: 'Thank you for the prescription', unread: 0, time: '1 hour ago' },
  { id: '3', patient: 'Sita Kumari', lastMessage: 'When should I take the medicine?', unread: 1, time: '3 hours ago' },
];

const mockMessages: Message[] = [
  { id: '1', text: 'Hello Doctor, I have been having fever for 2 days', sender: 'patient', time: '10:00 AM' },
  { id: '2', text: 'How high is the temperature? Any other symptoms?', sender: 'doctor', time: '10:05 AM' },
  { id: '3', text: 'It was 101°F this morning. I also have body pain and headache', sender: 'patient', time: '10:10 AM' },
  { id: '4', text: 'Take Paracetamol 500mg twice a day. Drink plenty of fluids. If fever persists for more than 3 days, visit the PHC.', sender: 'doctor', time: '10:15 AM' },
  { id: '5', text: 'Doctor, my fever is still not going down', sender: 'patient', time: '2:30 PM' },
];

export default function Consultations() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (activeChat) {
    const chat = mockChats.find((c) => c.id === activeChat);
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] animate-fade-in-up">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <button onClick={() => setActiveChat(null)} className="text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
            {chat?.patient.charAt(0)}
          </div>
          <h3 className="font-semibold text-foreground">{chat?.patient}</h3>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {mockMessages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                m.sender === 'doctor' ? 'gradient-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
                <p className="text-sm">{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.sender === 'doctor' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-3 border-t border-border">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('consultations.typeMessage')}
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <button className="rounded-lg gradient-primary p-2.5 text-primary-foreground">
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('consultations.title')}</h2>
      <div className="space-y-3">
        {mockChats.map((chat) => (
          <button key={chat.id} onClick={() => setActiveChat(chat.id)} className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card text-left">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                {chat.patient.charAt(0)}
              </div>
              {chat.unread > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{chat.unread}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{chat.patient}</h3>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
