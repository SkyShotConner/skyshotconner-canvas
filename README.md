# SkyShotConner Canvas

SkyShotConner's production e-commerce storefront for aviation, wildlife and nature photography, built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion and Supabase.

## Production stack

- **Source:** `SkyShotConner/skyshotconner-canvas`
- **Hosting:** Vercel
- **Backend:** Supabase project `SkyShotConner Shop`
- **Payments:** Paystack
- **Primary domains:** `skyshotconner.co.za` and `www.skyshotconner.co.za`

## Supabase

The app expects the public Supabase project URL and publishable key in `.env.local`.

The production backend contains the store catalogue, categories, product images, orders, profiles, customer addresses, wishlists, site branding images and Special Collection data.

## Payments

Paystack is the active payment integration. Server routes live under:

- `/api/paystack/initialize`
- `/api/paystack/verify`
- `/api/paystack/webhook`

Never place the Paystack secret key in client-side code or a `NEXT_PUBLIC_` environment variable.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Build note

The current production build still uses a set of compatibility and migration scripts in `scripts/` during `prebuild`. Some of these scripts transform the older base storefront into the current production experience.

Do **not** remove those scripts simply because they look historical. They should only be retired after their final generated output has been baked into the source and a clean production build has been verified.

## Brand

SkyShotConner covers aviation, wildlife and nature photography. Site copy and metadata should represent the full photography brand rather than describing it as aviation-only.
