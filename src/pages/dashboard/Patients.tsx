import { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Filter, X, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOfflineCache } from '@/hooks/useOfflineCache';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string | null;
  phone: string | null;
  conditions: string[];
  created_at: string;
}

export default function Patients() {
  const { t, user } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: 'male', village: '', phone: '', conditions: '' });

  // Filter state
  const [filterVillage, setFilterVillage] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterAgeMin, setFilterAgeMin] = useState('');
  const [filterAgeMax, setFilterAgeMax] = useState('');

  const { data: patients = [], isLoading, isCached } = useOfflineCache<Patient[]>(
    ['patients'],
    async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Patient[];
    },
  );

  const addPatient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('patients').insert({
        name: form.name,
        age: parseInt(form.age) || 0,
        gender: form.gender,
        village: form.village || null,
        phone: form.phone || null,
        conditions: form.conditions ? form.conditions.split(',').map((c) => c.trim()) : [],
        registered_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowForm(false);
      setForm({ name: '', age: '', gender: 'male', village: '', phone: '', conditions: '' });
      toast.success(t('patients.saved') || 'Patient registered!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Derive unique villages and conditions for filter dropdowns
  const villages = useMemo(() => {
    const set = new Set(patients.map(p => p.village).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [patients]);

  const conditions = useMemo(() => {
    const set = new Set(patients.flatMap(p => p.conditions || []));
    return Array.from(set).sort();
  }, [patients]);

  const activeFilterCount = [filterVillage, filterCondition, filterAgeMin, filterAgeMax].filter(Boolean).length;

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.village || '').toLowerCase().includes(search.toLowerCase());
      const matchesVillage = !filterVillage || p.village === filterVillage;
      const matchesCondition = !filterCondition || (p.conditions || []).includes(filterCondition);
      const matchesAgeMin = !filterAgeMin || p.age >= parseInt(filterAgeMin);
      const matchesAgeMax = !filterAgeMax || p.age <= parseInt(filterAgeMax);
      return matchesSearch && matchesVillage && matchesCondition && matchesAgeMin && matchesAgeMax;
    });
  }, [patients, search, filterVillage, filterCondition, filterAgeMin, filterAgeMax]);

  const clearFilters = () => {
    setFilterVillage('');
    setFilterCondition('');
    setFilterAgeMin('');
    setFilterAgeMax('');
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t('patients.title')}</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} of {patients.length}{isCached ? ' (cached)' : ''}</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('patients.search')} className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`relative rounded-lg border px-3 py-3 transition-colors ${showFilters || activeFilterCount > 0 ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full gradient-primary text-[9px] font-bold text-primary-foreground">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Filters</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-primary hover:underline"><X className="h-3 w-3" /> Clear all</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('patients.village')}</label>
              <select value={filterVillage} onChange={(e) => setFilterVillage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="">All villages</option>
                {villages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">{t('patients.conditions')}</label>
              <select value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="">All conditions</option>
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Min Age</label>
              <input type="number" value={filterAgeMin} onChange={(e) => setFilterAgeMin(e.target.value)} placeholder="0"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Max Age</label>
              <input type="number" value={filterAgeMax} onChange={(e) => setFilterAgeMax(e.target.value)} placeholder="120"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} onClick={() => navigate(`/dashboard/patients/${p.id}`)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card cursor-pointer hover:shadow-elevated transition-shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                {getInitials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.age}y · {p.gender} · {p.village || 'N/A'}</p>
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
      )}

      <button onClick={() => setShowForm(true)} className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-105">
        <Plus className="h-5 w-5" /> {t('patients.addNew')}
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-card p-6 shadow-elevated animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-4">{t('patients.addNew')}</h3>
            <div className="space-y-3">
              <input placeholder={t('patients.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder={t('patients.age')} type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="male">{t('patients.male')}</option>
                  <option value="female">{t('patients.female')}</option>
                  <option value="other">{t('patients.other')}</option>
                </select>
              </div>
              <input placeholder={t('patients.village')} value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder={t('patients.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
              <input placeholder={t('patients.conditions') + ' (comma separated)'} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
            <button onClick={() => addPatient.mutate()} disabled={!form.name || !form.age || addPatient.isPending} className="mt-4 w-full rounded-lg gradient-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
              {addPatient.isPending ? '...' : t('patients.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
