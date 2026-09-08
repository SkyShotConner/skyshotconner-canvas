# SkyShotConner Canvas

Cinematic aviation-art commerce platform built with Next.js, React, TypeScript, Tailwind CSS, Framer Motion and Supabase.

## Connected backend
The application is prepared for the existing **SkyShotConner Shop** Supabase project. It expects the public project URL and publishable key in `.env.local`.

The existing database already contains products, categories, product images, variants, orders, profiles, wishlists and customer addresses. The app reads the public catalogue from Supabase when configured and falls back to editorial demo works when it is not.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## PayFast
PayFast is intentionally not faked. The payment boundary lives at `/api/payfast` and requires server-side PayFast credentials before live payment processing can be enabled.

## Photography
Replace the `FALLBACK` and editorial image URLs in `app/page.tsx` with the final SkyShotConner photography when ready. The first hero is deliberately isolated as one variable so the Harvard sunset photograph can be swapped without changing layout.

## Routes
Home, shop, collections, product, search, wishlist, cart, checkout, order confirmation, authentication, account, orders, addresses, settings, about, journal/articles, contact, FAQ, shipping/returns, privacy and terms are routed through the App Router catch-all experience and can be split into dedicated route files later without changing the visual system.
