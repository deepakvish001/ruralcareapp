import { useEffect, useCallback, useRef } from 'react';

interface ReminderMed {
  id: string;
  name: string;
  dosage: string;
  time_slots: string[];
}

/**
 * Schedules browser notifications for medication time slots.
 * Checks every 30s so we don't miss the minute window.
 * Avoids duplicate notifications by tracking which (med+slot+date) combos
 * have already fired in the current session.
 */
export function useMedicationReminders(
  enabled: boolean,
  medications: ReminderMed[],
  isTakenToday: (medId: string, time: string) => boolean,
) {
  const firedRef = useRef<Set<string>>(new Set());

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!enabled || !('Notification' in window)) return;

    // Request permission on mount
    requestPermission();

    const check = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];

      medications.forEach((med) => {
        med.time_slots.forEach((slot) => {
          const key = `${med.id}_${slot}_${today}`;
          if (slot === currentTime && !isTakenToday(med.id, slot) && !firedRef.current.has(key)) {
            firedRef.current.add(key);
            new Notification('💊 Medication Reminder', {
              body: `Time to take ${med.name} (${med.dosage})`,
              icon: '/pwa-192x192.png',
              tag: key, // prevents OS-level duplicates
              requireInteraction: true,
            });
          }
        });
      });
    };

    // Check immediately then every 30s
    check();
    const interval = setInterval(check, 30_000);

    // Reset fired set at midnight
    const resetAtMidnight = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
      return setTimeout(() => {
        firedRef.current.clear();
        resetAtMidnight();
      }, msUntilMidnight);
    };
    const midnightTimeout = resetAtMidnight();

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, [enabled, medications, isTakenToday, requestPermission]);

  return { requestPermission };
}
