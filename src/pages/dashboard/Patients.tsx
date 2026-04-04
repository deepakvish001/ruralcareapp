import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  phone: string;
  conditions: string[];
  registeredAt: string;
}

export default function Patients() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', village: '', phone: '', conditions: '' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('ruralcare_patients') || '[]');
    setPatients(stored);
  }, []);

  const save = () => {
    const newPatient: Patient = {
      id: Date.now().toString(),
      name: form.name,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      village: form.village,
      phone: form.phone,
      conditions: form.conditions ? form.conditions.split(',').map((c) => c.trim()) : [],
      registeredAt: new Date().toISOString(),
    };
    const updated = [...patients, newPatient];
    setPatients(updated);
    localStorage.setItem('ruralcare_patients', JSON.stringify(updated));
    setShowForm(false);
    setForm({ name: '', age: '', gender: 'Male', village: '', phone: '', conditions: '' });
  };

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.village.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t('patients.title')}</h2>
        <span className="text-sm text-muted-foreground">{patients.length} {t('patients.totalPatients').toLowerCase()}</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('patients.search')} className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
              {getInitials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
              <p className="text-xs text-muted-foreground">{p.age}y · {p.gender} · {p.village}</p>
            </div>
            {p.conditions.length > 0 && (
              <div className="flex gap-1">
                {p.conditions.slice(0, 2).map((c) => (
                  <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{c}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No patients found</p>}
      </div>

      {/* Add Patient FAB */}
      <button onClick={() => setShowForm(true)} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
        <Plus className="h-5 w-5" /> {t('patients.addNew')}
      </button>

      {/* Add Patient Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">{t('patients.addNew')}</h3>
            <div className="space-y-3">
              <input placeholder={t('patients.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={t('patients.age')} type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="Male">{t('patients.male')}</option>
                  <option value="Female">{t('patients.female')}</option>
                  <option value="Other">{t('patients.other')}</option>
                </select>
              </div>
              <input placeholder={t('patients.village')} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder={t('patients.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder={t('patients.conditions') + ' (comma separated)'} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <button onClick={save} disabled={!form.name || !form.age} className="mt-4 w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">{t('patients.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
