# CampusSwap

Verified, campus-exclusive marketplace for CityU MOS residence students (S01G3, Group 3).
Stack: Vite + React + TypeScript + PWA, Supabase (Auth, Postgres, Realtime, Storage), Vercel.

```bash
npm install
cp .env.example .env.local   # fill in Supabase values, never commit
npm run dev
```

Status: UI ported from the clickable mock up (`docs/mockup.html`) with in-memory data. Supabase wiring is next. See `docs/HANDOFF.md`.

## Demo accounts

Type any `@demo.campusswap.test` address (see `supabase/seed.md`) on the Login screen to get a password field. Use this as a fallback if OTP email is delayed. Real students sign in with a CityU email and an 8-digit code.
