

# RuralCare — Next Features Plan

## Overview
Seven features to add, including PWA offline support, to make RuralCare production-ready for rural healthcare delivery.

---

## Feature 1: PWA Offline Support

**What**: Make the app installable and functional offline — critical for rural areas with poor connectivity.

**Steps**:
- Install `vite-plugin-pwa` and configure in `vite.config.ts` with `devOptions: { enabled: false }`, `navigateFallbackDenylist: [/^\/~oauth/]`
- Create `public/manifest.json` with app name, theme colors, icons
- Generate PWA icons (192x192, 512x512) in `/public`
- Add iframe/preview guard in `src/main.tsx` to prevent service worker registration in Lovable preview
- Pre-cache static assets (first aid guides, symptom checker data, emergency contacts) so they work offline
- Add an offline indicator banner component that shows when `navigator.onLine` is false
- Create an `/install` page with install prompt instructions

**Key constraint**: Service worker only activates in production builds. Offline features (first aid, emergency, symptom checker) use local data already, so they'll work naturally. Database-dependent pages (patients, consultations) will show a "You're offline" message.

---

## Feature 2: AI-Powered Symptom Analysis

**What**: Replace the static weight-based symptom checker with an AI model that provides more nuanced assessments.

**Steps**:
- Create a backend function that calls a Lovable AI supported model (e.g., `google/gemini-2.5-flash`) with selected symptoms
- Return structured JSON with severity, possible conditions, and recommended actions
- Update `SymptomChecker.tsx` to call the function and display AI results
- Keep the offline fallback using the existing weight-based logic

---

## Feature 3: Doctors Table in Database

**What**: Move the hardcoded doctor list (`FindDoctor.tsx`) to the database so it's dynamic.

**Steps**:
- Create a `doctors` table with columns: `id`, `user_id`, `name`, `specialty`, `facility_type`, `location`, `phone`, `available`, `latitude`, `longitude`
- Add RLS policies (authenticated can view, doctors can update own)
- Seed with initial data
- Update `FindDoctor.tsx` to query from the database with search/filter

---

## Feature 4: Visit Recording for Health Workers

**What**: Let health workers record vitals and notes during patient visits from the Scheduler page.

**Steps**:
- Add a "Record Visit" button on the Scheduler page for each scheduled item
- Create a form with fields: weight, temperature, blood pressure, notes, follow-up date
- Insert into the existing `visits` table on submission
- Show visit history on the patient detail view

---

## Feature 5: Patient Detail Page

**What**: A dedicated page showing a patient's full profile, visit history, and consultations.

**Steps**:
- Create `/dashboard/patients/:id` route and `PatientDetail.tsx`
- Fetch patient info, visits (joined), consultations, and referrals
- Display in tabbed sections: Overview, Visits, Consultations
- Link from patient cards in `Patients.tsx`

---

## Feature 6: Notification System

**What**: In-app notifications for follow-up reminders, consultation updates, and queue status.

**Steps**:
- Create a `notifications` table (`id`, `user_id`, `title`, `body`, `read`, `type`, `created_at`)
- Add RLS (users see own notifications)
- Create a bell icon in the dashboard header with unread count badge
- Use Supabase Realtime to push new notifications
- Trigger notifications via database triggers (e.g., when a referral status changes)

---

## Feature 7: Password Reset Flow

**What**: Add forgot password functionality to the login page.

**Steps**:
- Add "Forgot Password?" link on `Login.tsx`
- Call `supabase.auth.resetPasswordForEmail()` with a redirect URL
- Create `/reset-password` page that calls `supabase.auth.updateUser()` with the new password
- Add route in `App.tsx`

---

## Technical Notes

- PWA icons will be simple generated images matching the app's primary color
- AI symptom analysis uses an edge function with Lovable AI — no API key needed
- All new tables include RLS policies and require authentication
- Offline-capable pages (first aid, emergency, symptoms) use local/cached data; database pages gracefully degrade

