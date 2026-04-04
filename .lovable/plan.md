

# PWA Offline Support — Full Implementation Plan

## Overview

Make RuralCare fully functional without internet. The app already has `vite-plugin-pwa`, a manifest, and PWA icons. The missing pieces are: proper asset caching, offline data fallback for critical pages, and a cache-first strategy for Supabase API calls.

## What will work offline

| Feature | Offline behavior |
|---------|-----------------|
| First Aid guides | Fully available (static data) |
| Emergency contacts | Fully available (tel: links) |
| Symptom Checker | Offline fallback analysis (already exists) |
| Dashboard home | Cached last-known data |
| Consultations, Reports, Patients | Show cached data or "offline" message |
| Landing, Login | Cached shell loads; login requires network |

## Steps

### 1. Enhance Workbox caching strategy in `vite.config.ts`

- Add `runtimeCaching` rules to the VitePWA config:
  - **Supabase REST API** (`xdpzkzmrvdixuupvgfsr.supabase.co/rest/*`): `NetworkFirst` with 30s timeout, falling back to cache. This means previously loaded data is available offline.
  - **Supabase Auth**: `NetworkOnly` (auth must always hit network)
  - **Google Fonts / CDN assets**: `CacheFirst` with 30-day expiry
- Keep existing `globPatterns` for static assets (JS, CSS, HTML, icons)
- Keep `navigateFallbackDenylist: [/^\/~oauth/]`

### 2. Add manifest link to `index.html`

- Add `<link rel="manifest" href="/manifest.json">` to `<head>`
- Add `<meta name="theme-color" content="#2563EB">`
- Add `<meta name="apple-mobile-web-app-capable" content="yes">`
- Add apple-touch-icon link

### 3. Create an Install Prompt component

- A small `InstallPWA.tsx` banner/button that captures the `beforeinstallprompt` event
- Shows "Install RuralCare" button when the prompt is available
- Dismissible, stored in localStorage so it doesn't reappear after dismissal
- Shown on the Dashboard layout

### 4. Add offline-aware data hooks

- Create a `useOfflineCache` utility hook that wraps React Query:
  - On successful fetch, saves response to `localStorage` (keyed by query key)
  - When offline (`!navigator.onLine`), returns cached data instead of fetching
- Apply to critical queries: dashboard stats, patients list, consultations list
- Show a subtle "(cached)" indicator when serving stale data

### 5. Update `OfflineBanner.tsx`

- Improve messaging: "You're offline — showing saved data. Some features need internet."
- Add animation for appear/disappear transitions

---

## Technical Notes

- No new database tables or migrations needed
- No new dependencies — `vite-plugin-pwa` with Workbox handles everything
- Service worker only activates in production (already configured with `devOptions: { enabled: false }`)
- The iframe/preview guard in `main.tsx` is already in place
- First Aid and Emergency pages are fully static — they work offline automatically once cached

