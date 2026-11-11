# Demo data

The database currently holds **no mock listings, chats or ratings** (cleared on 2026-11-11). Only accounts remain.

Demo accounts (kept as a login fallback; the domain cannot receive mail, so OTP signup with it is impossible):
- `alex|mei|jason|priya|kenji|sam|buyer|admin@demo.campusswap.test`
- `admin@` can open Profile > Moderation. The maintainer's CityU account is also admin.
- Password for all demo accounts: `DEMO_PASSWORD` in your local `.env.local` (gitignored). Type a demo email on the Login screen to get a password field.
- Demo accounts cannot delete themselves (`delete_my_account` refuses them).

Before a demo, post a few real listings (with photos) from the demo seller accounts so Home is not empty.
