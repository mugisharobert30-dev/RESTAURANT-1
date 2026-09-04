# Luwombo Restaurant — Full-Stack Restaurant Platform

A production-ready restaurant website and operations platform for **Luwombo
Restaurant** (KG 652 St, Kimihurura — Kigali, Rwanda): online ordering,
table-QR dining, reservations, customer accounts, and a complete staff
back-office.

## Tech stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Frontend  | Next.js 14 (App Router) · TypeScript · Tailwind CSS           |
| Backend   | Supabase (Postgres + Auth + Storage + Realtime + Edge Fn)     |
| Charts    | Recharts                                                      |
| Icons     | lucide-react                                                  |
| QR codes  | qrcode.react                                                  |
| PWA       | Custom service worker (`public/sw.js`) + web manifest         |

## Demo mode vs. production mode

The app ships with a **zero-config demo mode**: all data lives in the browser
(localStorage) seeded with realistic Rwandan content. The moment you add
Supabase env variables, `SUPABASE_ENABLED` flips and auth/data flows target
Postgres instead.

```bash
cp .env.example .env.local   # optional — enables production mode
```

Demo accounts:

| Role            | Email                | Password   |
| --------------- | -------------------- | ---------- |
| Customer        | chantal@example.rw   | demo1234   |
| Administrator   | admin@luwombo.rw     | admin1234  |
| Kitchen staff   | chef@luwombo.rw      | staff1234  |
| Other staff     | manager@ / waiter@ / cashier@ / driver@luwombo.rw | staff1234 |

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm start            # serve the production build
npx tsc --noEmit     # type-check only
```

## Feature map

### Public site

- Home: hero, popular dishes, promos strip, how-it-works, reviews, JSON-LD schema
- Menu browser: search, category/diet/price filters, sorting; dish pages with
  customization groups, related items and reviews
- Checkout: delivery / takeaway / dine-in, coupon codes, MTN MoMo, Airtel
  Money, card, cash on delivery, pay-at-counter
- Live order tracking page with status timeline
- Table reservations with slot picker and area selection
- About, gallery (lightbox), FAQ, contact (map + form)
- Trilingual interface: English / Kinyarwanda / Français
- PWA installable, offline shell caching

### Guest account

Orders (reorder + review), reservations (modify/cancel), addresses, favourites,
profile, notifications.

### Staff back-office (`/admin`, role-gated)

Dashboard · Orders · Kitchen display system · Reservations · Tables & QR codes ·
Menu & categories CRUD · Inventory with stock movements · Customers · Staff &
roles · Promotions · Coupons · Reviews moderation · Payments · Analytics ·
Notifications · Settings (hours, delivery zones, FAQs editor, message inbox) ·
Audit logs.

Table QR codes open `/menu?table=<token>` — guests browse, order and call a
waiter without an app.

## Supabase setup (production)

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/001_initial_schema.sql` then `002_seed_data.sql`
   in the SQL editor (enums, tables, indexes, triggers, RLS policies, realtime).
3. Set Auth → URL configuration to your domain; disable email confirmations for
   quick onboarding if desired.
4. Deploy the payment webhook:

   ```bash
   supabase secrets set PAYMENT_WEBHOOK_SECRET=$(openssl rand -hex 32)
   supabase functions deploy payment-webhook --no-verify-jwt
   ```

5. Point your MoMo/PSP callback URL to
   `https://<project>.functions.supabase.co/payment-webhook`.

Environment variables (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-side only (webhook)
NEXT_PUBLIC_SITE_URL=https://luwombo.rw
```

## Project layout

```
src/
  app/               routes (public, account, admin) + sitemap/robots/error pages
  components/        UI kit, food imagery generator, layout chrome, menu browser
  context/           language, cart, auth, toast providers
  hooks/             useStoreData store selector
  lib/               types, seed data, demo store, db layer, i18n, formatting
  middleware.ts      protects /admin routes
supabase/            SQL migrations + payment webhook edge function
public/              manifest, icon, service worker
```

---

Made with ❤️ in Kigali. Murakaza neza!
