# CampusSwap: Handoff to Claude Code

## 0. How to work with me (Eric)
- Reply in **Cantonese mixed with English technical terms**.
- Use bullet points, not long paragraphs. Be blunt, no sugar coating.
- If unsure, say "I'm not sure" and why. Never guess.
- End answers with a confidence score 1 to 10; flag anything below 7.
- Numbers, stats and claims about people or products need a verifiable source.
- Confirm layouts/design with me conversationally before building.
- Root-cause fixes over surface patches. Clean, systematic design logic over decoration.
- Never ask me to paste secrets (Supabase keys etc.) into chat. Use env vars.

## 1. Project
- **CampusSwap**: verified, campus-exclusive marketplace for **CityU MOS residence students** to buy/sell/trade secondhand goods and services.
- University group project (S01G3, Group 3). I am the UI/UX designer. Other roles: Dasha (coordinator), Marcela (problem analyst), Andrew (technical feasibility), Raivo (AI documentation), Jayden (UX research).
- **Goal now: a live demo for assignment/presentation. NOT a public launch.** Stability for presenting matters more than scale.
- Deadline: **TBD, ask Eric first.**

## 2. Problem and users
- Residents lack a secure hyper-local marketplace during move-in/out. Group chats bury listings, no verification, no search; Carousell has unverified profiles, MTR-station meetups for bulky items, and too many commercial listings.
- Users: MOS residence students (18 to 24). Sellers need fast listing, same-building pickup, verified buyers. Buyers need cheap nearby items, verified sellers, lobby pickup.
- Constraints: mobile-only, no car, time-poor, safety concerns, items sell fast.
- Differentiators: CityU email + OTP verification, zero-travel hall-lobby meetups, QR handover confirmation, filters/ratings.

## 3. MoSCoW (from the proposal)
| Must | Should | Could | Won't (now) |
|---|---|---|---|
| MOS residence verification | Filter across goods/services | P2P move helpers | Off-campus/public accounts |
| Post/browse goods | In-app chat | Listing templates | Postal shipping |
| On-campus meetup spots | Ratings/reviews | Buyer/seller reputation profiles | Live auction bidding |
| Report/block + moderation | Favourites/wanted alerts | Bundle checkouts | In-house logistics |

Business notes: no commission in MVP (maybe later); planned stack in proposal is free-tier Supabase + PWA; cost ~HK$1,000 posters.

## 4. User journey and screen flow
Login (CityU email + OTP) -> Home Feed -> Search & Filter -> Listing Detail -> Chat / Make Offer -> Schedule Pickup -> QR Handover Confirmation -> Rate Seller.

Design rationale: bottom tab bar (thumb reach); single-column scroll; primary button fixed at bottom; large touch targets, minimal typing; price/condition first, badges near top; listing cards, filter chips, chat bubbles, OTP input, QR code.

## 5. Current state: clickable mock up (done)
- File: `campusswap.html` (single file, vanilla JS, no backend, all state in memory). Port its UI to the real app.
- Visual style: **pure black/white/grey, matches the team wireframe**. No accent colour (Eric chose this "first"; an accent version was offered but not requested). English UI, HK$ prices.
- Screens built: Login (email validation + 6-box OTP), Home (search, Goods/Services toggle, category chips, Filter sheet: max price / condition / sort, favourites), Listing Detail (seller card, CityU Verified badge, meetup spots, report/block sheet), Chat (bubbles, offer cards, auto seller replies), Schedule Pickup (spot/day/time), Handover (QR + "simulate seller scan"), Rate Seller (stars + tags + comment), Post, Messages, Profile.
- Schedule Pickup entry points (added after Eric couldn't find it): header button in Chat, an "Offer accepted" deal card in Chat, and the Propose Pickup Time chip. I suggested removing the chip as redundant; undecided.
- Deviations from the wireframe (told to Eric): Offer + Pickup controls moved into chips/bottom sheets; added Goods/Services toggle and Filter sheet.
- Tested with headless browser (full journey, no console errors) at a 480px viewport only. **Not tested on a real phone.**
- Mock data: 11 listings (goods + services) by 6 fake sellers.

## 6. Decisions made
- Format: single HTML mock up first, then a real build.
- Hosting/back end: **Supabase (Auth, Postgres, Realtime, Storage, RLS) + Vercel** for deploy. Vercel is convenient, not mandatory.
- Proposed stack: **Vite + React + TypeScript + PWA plugin + Supabase JS**. Not yet confirmed by Eric or Andrew.

## 7. Demo scope
**Make real:** CityU email OTP login with server-side domain check; listings CRUD + photo upload; search/filter; realtime chat + offers; pickup scheduling; QR handover (token-based, seller scans with phone camera, HTTPS needed); ratings; report/block.

**Simplify/fake:** moderation = reports saved + a simple admin page only; services have no special logic; no push notifications; skip favourites sync/Help pages if time is short.

**Demo insurance:**
- Backup login with demo accounts (email+password) in case OTP email fails.
- Seed 15 to 20 listings and a few chats.
- Log in to Supabase the day before presenting (free projects can pause).
- Present with two phones to show buyer and seller sides.

## 8. Risks and unknowns
- **Unverified (highest risk): whether Supabase's default email sending and CityU's mail system reliably deliver OTP emails.** Test this first with a real CityU address. Fallbacks: custom SMTP, magic link, or demo accounts. I did not check Supabase's current email rate limits.
- Supabase free plan: projects with low activity over 7 days can be paused; restorable up to 1 year after pause. Source: https://supabase.com/docs/guides/platform/free-plan-pausing
- Vercel Hobby is restricted to non-commercial personal use; fine for a school demo, but moving to commercial (proposal mentions a possible future commission) needs Pro (developer seat US$20/user/month). Source: https://vercel.com/docs/plans/hobby
- Real students' emails/chats would raise privacy duties. Out of scope for the demo; revisit before any real launch (also check whether CityU permission is needed to use its name).
- Real camera QR scanning needs HTTPS and a camera permission prompt.

## 9. Suggested next steps
1. Ask Eric: deadline, GitHub repo (`owner/repo`), who else commits (Andrew?).
2. Eric creates the GitHub repo and a Supabase project; secrets go in env vars (Vercel + local `.env`, gitignored).
3. Scaffold Vite + React + TS + PWA; port mock up UI and keep the black/white/grey design tokens.
4. Design the schema + RLS: profiles (verified CityU email), listings, listing_photos, favourites, threads, messages, offers, pickups (spot/day/time/status), handover tokens, ratings, reports, blocks. Enforce the CityU domain server-side (auth hook/trigger), not only in the client.
5. **First task: prove OTP delivery with a real CityU email.**
6. Wire features one by one in this order: auth -> listings/browse -> chat/offers -> pickup + QR -> ratings -> report/block + admin view. Test each.
7. Deploy to Vercel, seed data, test on a real phone, rehearse the demo.
