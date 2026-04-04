import { ArrowLeft, MapPin, Phone, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function FindDoctor() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const filtered = doctors.filter((d: any) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.facility_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground text-sm"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h2 className="text-xl font-bold text-foreground">{t('findDoctor.title')}</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('findDoctor.search')}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => (
            <div key={d.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{d.name}</h3>
                  <p className="text-sm text-muted-foreground">{d.specialty}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {d.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.location}</span>}
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {d.facility_type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {d.available ? t('findDoctor.available') : t('findDoctor.unavailable')}
                  </span>
                  {d.phone && (
                    <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No doctors found</p>}
        </div>
      )}
    </div>
  );
}
