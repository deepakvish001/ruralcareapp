import { useEffect, useCallback, useRef } from 'react';

interface ReminderMed {
  id: string;
  name: string;
  dosage: string;
  time_slots: string[];
}

// How late a reminder can still fire after its scheduled slot. Backgrounded
// or screen-locked mobile tabs get their setInterval throttled by the
// browser (sometimes suspended entirely), so the poll that's supposed to
// catch the exact HH:MM minute can easily miss it — without a grace window
// a missed tick means that dose's reminder never fires for the rest of the
// day.
const REMINDER_GRACE_WINDOW_MINUTES = 60;

function toMinutesSinceMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
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
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const today = now.toISOString().split('T')[0];

      medications.forEach((med) => {
        med.time_slots.forEach((slot) => {
          const key = `${med.id}_${slot}_${today}`;
          const slotMinutes = toMinutesSinceMidnight(slot);
          const isDue = nowMinutes >= slotMinutes && nowMinutes < slotMinutes + REMINDER_GRACE_WINDOW_MINUTES;
          if (isDue && !isTakenToday(med.id, slot) && !firedRef.current.has(key)) {
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
