import { ArrowLeft, Flame, Scissors, Wind, Bug, Bone, Thermometer, Droplets, Sun, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface Guide {
  key: string;
  icon: React.ElementType;
  color: string;
  steps: string[];
}

const guides: Guide[] = [
  { key: 'burns', icon: Flame, color: 'bg-destructive/10 text-destructive', steps: [
    'Cool the burn under cold running water for at least 10 minutes',
    'Remove clothing/jewelry near the burn (unless stuck)',
    'Cover with a clean, non-fluffy cloth or cling film',
    'Do NOT apply ice, butter, or toothpaste',
    'Seek medical help if burn is larger than palm or on face/joints',
  ]},
  { key: 'cuts', icon: Scissors, color: 'bg-primary/10 text-primary', steps: [
    'Apply pressure with a clean cloth to stop bleeding',
    'Wash the wound gently with clean water',
    'Apply antiseptic if available',
    'Cover with a sterile bandage',
    'Seek medical help if bleeding doesn\'t stop in 10 minutes',
  ]},
  { key: 'choking', icon: Wind, color: 'bg-accent/10 text-accent-foreground', steps: [
    'Encourage the person to cough forcefully',
    'Give 5 back blows between shoulder blades',
    'Give 5 abdominal thrusts (Heimlich maneuver)',
    'Alternate between back blows and thrusts',
    'Call emergency services if choking continues',
  ]},
  { key: 'snakeBite', icon: Bug, color: 'bg-success/10 text-success', steps: [
    'Keep the person calm and still',
    'Remove jewelry near the bite',
    'Keep bitten limb below heart level',
    'Do NOT cut, suck, or apply tourniquet',
    'Rush to nearest hospital immediately — note snake appearance if safe',
  ]},
  { key: 'fracture', icon: Bone, color: 'bg-secondary text-secondary-foreground', steps: [
    'Do NOT move the injured limb',
    'Immobilize with a splint (sticks, cardboard)',
    'Apply ice wrapped in cloth to reduce swelling',
    'Keep the person comfortable and still',
    'Seek immediate medical attention',
  ]},
  { key: 'fever', icon: Thermometer, color: 'bg-warning/10 text-warning-foreground', steps: [
    'Rest and drink plenty of fluids (water, ORS, juice)',
    'Take paracetamol as directed (NOT aspirin for children)',
    'Apply cool wet cloth on forehead',
    'Wear light, comfortable clothing',
    'Seek medical help if fever exceeds 103°F or lasts more than 3 days',
  ]},
  { key: 'dehydration', icon: Droplets, color: 'bg-primary/10 text-primary', steps: [
    'Give ORS (Oral Rehydration Solution) or homemade: 6 tsp sugar + ½ tsp salt in 1L water',
    'Give small sips frequently, not large amounts at once',
    'Continue breastfeeding for infants',
    'Avoid caffeinated or sugary drinks',
    'Seek medical help if person cannot keep fluids down',
  ]},
  { key: 'heatStroke', icon: Sun, color: 'bg-destructive/10 text-destructive', steps: [
    'Move person to shade or cool area immediately',
    'Remove excess clothing',
    'Apply cold water or wet towels to body',
    'Fan the person continuously',
    'Call emergency services — heat stroke is life-threatening',
  ]},
];

export default function FirstAid() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('firstAid.title')}</h2>
      <div className="space-y-3">
        {guides.map((g) => (
          <div key={g.key} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <button
              onClick={() => setOpen(open === g.key ? null : g.key)}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${g.color}`}><g.icon className="h-5 w-5" /></div>
                <span className="font-semibold text-foreground">{t(`firstAid.${g.key}`)}</span>
              </div>
              {open === g.key ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>
            {open === g.key && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 animate-fade-in-up">
                {g.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                    <p className="text-sm text-foreground">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
