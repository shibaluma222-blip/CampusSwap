# Demo data

Seeded directly in the database (not committed as SQL because it sets passwords):
- 8 demo accounts `alex|mei|jason|priya|kenji|sam|buyer|admin@demo.campusswap.test` (`admin@` can open Profile > Moderation; the maintainer's CityU account is also admin) (domain cannot receive mail, so OTP signup with it is impossible).
- Password for all demo accounts: `DEMO_PASSWORD` in your local `.env.local` (gitignored). Sign in by typing a demo email on the Login screen.
- 16 listings (12 goods, 4 services) owned by the sellers above.
