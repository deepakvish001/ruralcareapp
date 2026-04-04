

# RuralCare — Next Features Plan (Phase 2)

## Overview
Five features to strengthen clinical workflows, improve data-driven insights, and enhance the user experience.

---

## Feature 1: Real-Time Reports Dashboard

**What**: Replace hardcoded stats in `Reports.tsx` with live data from the database — actual visit counts, follow-ups due, and trend charts based on real records.

**Steps**:
- Query `visits` table grouped by `type` for the visit breakdown chart
- Query `visits` grouped by month for the trend chart
- Count visits with `follow_up_date` in the next 7 days for "follow-ups due"
- Count visits in the current month for "visits this month"
- All data fetched via React Query; no new tables needed

---

## Feature 2: Consultation Chat with Patient View

**What**: Let patients see and respond to their consultations (currently only doctors can chat). Link consultations to patient accounts via `patient_user_id`.

**Steps**:
- In `Consultations.tsx`, when role is `patient`, query consultations where `patient_user_id = user.id`
- Allow patients to send messages (append to the `messages` JSON array)
- Show patient-side consultation list with doctor name (join `doctors` table)
- Add realtime subscription so both sides see new messages instantly

---

## Feature 3: Telemedicine Improvement — Doctor Assignment & Video Placeholder

**What**: Fix the placeholder `doctor_id` in telemedicine requests. Let patients pick a doctor, and add a "Join Call" button that links to a video placeholder.

**Steps**:
- In the telemedicine request form, add a doctor selector (query available doctors)
- Store the selected `doctor_id` and `patient_id` on the consultation
- Add a "Join Call" button on active consultations that opens a placeholder video room page
- Create a simple `/dashboard/video-call/:consultationId` page with camera/mic permission prompts and a "call in progress" UI

---

## Feature 4: Patient Medical History Export

**What**: Let health workers or doctors export a patient's visit history as a downloadable PDF summary — useful for referrals to hospitals.

**Steps**:
- Add an "Export" button on the `PatientDetail` page
- Generate a PDF client-side (using `jspdf` or `html2canvas`) with patient info, visit history, conditions, and referrals
- Include a header with the app name and date generated
- Download the file directly in the browser

---

## Feature 5: Multi-Language Content Expansion

**What**: The app has an i18n system but translations may be incomplete. Audit and complete translations for Hindi and the existing languages.

**Steps**:
- Audit `src/i18n/translations.ts` for missing keys across all pages
- Add translations for new features (notifications, doctor profile, patient detail tabs)
- Add a language indicator in the header or settings showing the current language
- Ensure all user-facing strings use `t()` — no hardcoded English in components

---

## Technical Notes

- No new database tables required (Feature 3's video page is client-side only)
- Feature 1 uses aggregate queries on existing `visits` and `patients` tables
- Feature 2 adds realtime to `consultations` (ALTER PUBLICATION)
- Feature 4 adds a client-side dependency (`jspdf`) — no backend changes
- Feature 5 is a content-only change in the translations file

