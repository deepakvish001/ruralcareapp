import { useState } from 'react';
import { Thermometer, Wind, Brain, Activity, Droplets, Zap, Bone, AlertCircle, ArrowLeft, CheckCircle, Loader2, AlertTriangle, Home } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Symptom {
  key: string;
  icon: React.ElementType;
  weight: number;
}

const symptoms: Symptom[] = [
  { key: 'fever', icon: Thermometer, weight: 2 },
  { key: 'cough', icon: Wind, weight: 1 },
  { key: 'headache', icon: Brain, weight: 1 },
  { key: 'stomachPain', icon: Activity, weight: 2 },
  { key: 'skinIssue', icon: Droplets, weight: 1 },
  { key: 'breathing', icon: Zap, weight: 3 },
  { key: 'bodyPain', icon: Bone, weight: 1 },
  { key: 'vomiting', icon: AlertCircle, weight: 2 },
];

type Severity = 'mild' | 'moderate' | 'severe';

interface AIResult {
  severity_level: string;
  possible_conditions: string[];
  recommendation: string;
  home_remedies: string[];
  warning_signs: string[];
}

export default function SymptomChecker() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const toggleSymptom = (key: string) => {
    setSelected((prev) => prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]);
  };

  // Offline fallback
  const getOfflineRecommendation = () => {
    const totalWeight = selected.reduce((sum, key) => {
      const s = symptoms.find((sy) => sy.key === key);
      return sum + (s?.weight || 0);
    }, 0);
    const severityMultiplier = severity === 'severe' ? 3 : severity === 'moderate' ? 2 : 1;
    const score = totalWeight * severityMultiplier;
    if (score >= 10) return { level: 'severe', text: t('symptom.goHospital'), color: 'bg-destructive/10 text-destructive border-destructive' };
    if (score >= 5) return { level: 'moderate', text: t('symptom.visitWorker'), color: 'bg-warning/10 text-warning-foreground border-warning' };
    return { level: 'mild', text: t('symptom.restHome'), color: 'bg-success/10 text-success border-success' };
  };

  const analyze = async () => {
    if (selected.length === 0 || !severity) return;
    setAnalyzing(true);

    try {
      if (!navigator.onLine) throw new Error('offline');

      const symptomNames = selected.map((key) => t(`symptom.${key}`));
      const { data, error } = await supabase.functions.invoke('analyze-symptoms', {
        body: { symptoms: symptomNames, severity },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiResult(data);
      setShowResult(true);
    } catch (err) {
      console.warn('AI analysis unavailable, using offline fallback:', err);
      setAiResult(null);
      setShowResult(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setSelected([]);
    setSeverity(null);
    setShowResult(false);
    setAiResult(null);
  };

  if (showResult) {
    const severityColors: Record<string, string> = {
      severe: 'bg-destructive/10 text-destructive border-destructive',
      moderate: 'bg-warning/10 text-warning-foreground border-warning',
      mild: 'bg-success/10 text-success border-success',
    };

    if (aiResult) {
      const color = severityColors[aiResult.severity_level] || severityColors.moderate;
      return (
        <div className="space-y-4 animate-fade-in-up">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
          <h2 className="text-xl font-bold text-foreground">{t('symptom.result')}</h2>
          
          <div className={`rounded-2xl border-2 p-6 ${color}`}>
            {aiResult.severity_level === 'severe' ? <AlertTriangle className="h-10 w-10 mx-auto mb-3" /> : <CheckCircle className="h-10 w-10 mx-auto mb-3" />}
            <p className="text-center text-lg font-semibold">{aiResult.recommendation}</p>
          </div>

          {aiResult.possible_conditions.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="font-semibold text-foreground mb-2">Possible Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {aiResult.possible_conditions.map((c, i) => (
                  <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{c}</span>
                ))}
              </div>
            </div>
          )}

          {aiResult.home_remedies.length > 0 && (
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Home className="h-4 w-4" /> Home Remedies</h3>
              <ul className="space-y-1">
                {aiResult.home_remedies.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {aiResult.warning_signs.length > 0 && (
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
              <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Warning Signs</h3>
              <ul className="space-y-1">
                {aiResult.warning_signs.map((w, i) => (
                  <li key={i} className="text-sm text-destructive/80">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="font-semibold text-foreground mb-2">{t('symptom.selected')}</h3>
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{t(`symptom.${s}`)}</span>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t('symptom.severity')}: {t(`symptom.${severity}`)}</p>
          </div>

          <button onClick={reset} className="w-full rounded-lg border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted">{t('symptom.reset')}</button>
        </div>
      );
    }

    // Offline fallback result
    const rec = getOfflineRecommendation();
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h2 className="text-xl font-bold text-foreground">{t('symptom.result')}</h2>
        <div className={`rounded-2xl border-2 p-6 ${rec.color}`}>
          <CheckCircle className="h-10 w-10 mx-auto mb-3" />
          <p className="text-center text-lg font-semibold">{rec.text}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="font-semibold text-foreground mb-2">{t('symptom.selected')}</h3>
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{t(`symptom.${s}`)}</span>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t('symptom.severity')}: {t(`symptom.${severity}`)}</p>
        </div>
        <p className="text-xs text-center text-muted-foreground">Offline mode — basic analysis only</p>
        <button onClick={reset} className="w-full rounded-lg border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted">{t('symptom.reset')}</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('symptom.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('symptom.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {symptoms.map((s) => {
          const isSelected = selected.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSymptom(s.key)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                isSelected ? 'border-primary bg-primary/5 shadow-soft' : 'border-border bg-card'
              }`}
            >
              <s.icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{t(`symptom.${s.key}`)}</span>
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="space-y-3 animate-fade-in-up">
          <h3 className="font-semibold text-foreground">{t('symptom.severity')}</h3>
          <div className="flex gap-3">
            {(['mild', 'moderate', 'severe'] as Severity[]).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all ${
                  severity === sev
                    ? sev === 'severe' ? 'border-destructive bg-destructive/10 text-destructive'
                  : sev === 'moderate' ? 'border-warning bg-warning/10 text-warning-foreground'
                  : 'border-success bg-success/10 text-success'
                    : 'border-border bg-card text-foreground'
                }`}
              >
                {t(`symptom.${sev}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={analyze}
        disabled={selected.length === 0 || !severity || analyzing}
        className="w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
      >
        {analyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing...</> : t('symptom.analyze')}
      </button>
    </div>
  );
}
