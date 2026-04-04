import { ArrowLeft, Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function VideoCall() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm mb-4"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className="flex-1 rounded-2xl bg-muted/50 border border-border flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-4 left-4 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
          {formatTime(elapsed)}
        </div>
        <div className="absolute top-4 right-4 w-24 h-32 rounded-xl bg-card border border-border shadow-card flex items-center justify-center">
          <span className="text-xs text-muted-foreground">You</span>
        </div>

        <div className="text-center space-y-3">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-primary/10">
            <Video className="h-10 w-10 text-primary" />
          </div>
          <p className="text-foreground font-semibold">Call in Progress</p>
          <p className="text-sm text-muted-foreground">Teleconsultation #{consultationId?.slice(0, 8)}</p>
          <p className="text-xs text-muted-foreground">Video calling will be available in a future update</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-6">
        <button onClick={() => setVideoEnabled(!videoEnabled)} className={`rounded-full p-4 ${videoEnabled ? 'bg-muted text-foreground' : 'bg-destructive/10 text-destructive'}`}>
          {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
        <button onClick={() => setAudioEnabled(!audioEnabled)} className={`rounded-full p-4 ${audioEnabled ? 'bg-muted text-foreground' : 'bg-destructive/10 text-destructive'}`}>
          {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button onClick={() => navigate(-1)} className="rounded-full p-4 bg-destructive text-destructive-foreground">
          <Phone className="h-5 w-5 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}
