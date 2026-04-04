import { Phone } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export default function SOSButton() {
  const { t } = useApp();

  const handleSOS = () => {
    window.location.href = 'tel:108';
  };

  return (
    <button
      onClick={handleSOS}
      className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-destructive shadow-lg animate-pulse-sos"
      aria-label={t('sos.emergency')}
    >
      <Phone className="h-7 w-7 text-destructive-foreground" />
    </button>
  );
}
