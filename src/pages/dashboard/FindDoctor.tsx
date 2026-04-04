import { ArrowLeft, MapPin, Phone, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const doctors = [
  { name: 'Dr. Priya Sharma', specialty: 'General Medicine', type: 'PHC', distance: '2.5 km', phone: '+91 98765 00001', available: true },
  { name: 'Dr. Rajesh Kumar', specialty: 'Pediatrics', type: 'District Hospital', distance: '8 km', phone: '+91 98765 00002', available: true },
  { name: 'Dr. Anita Desai', specialty: 'OB/GYN', type: 'Private Clinic', distance: '5 km', phone: '+91 98765 00003', available: false },
  { name: 'Dr. Suresh Reddy', specialty: 'Orthopedics', type: 'District Hospital', distance: '8 km', phone: '+91 98765 00004', available: true },
  { name: 'Dr. Meena Patel', specialty: 'Dermatology', type: 'Private Clinic', distance: '12 km', phone: '+91 98765 00005', available: true },
  { name: 'Dr. Arun Singh', specialty: 'ENT', type: 'PHC', distance: '3 km', phone: '+91 98765 00006', available: false },
];

export default function FindDoctor() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = doctors.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
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
      <div className="space-y-3">
        {filtered.map((d, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{d.name}</h3>
                <p className="text-sm text-muted-foreground">{d.specialty}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.distance}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {d.type}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                  {d.available ? t('findDoctor.available') : t('findDoctor.unavailable')}
                </span>
                <a href={`tel:${d.phone.replace(/\s/g, '')}`} className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20">
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
