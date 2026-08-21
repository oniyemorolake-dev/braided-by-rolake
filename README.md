# Braided by Rolake

Mobile-first hair braiding booking site for a home-based studio in Calgary.

## Stack

- React + Vite + TypeScript
- Tailwind CSS v4
- React Router
- localStorage for bookings (structured for a future Supabase swap)
- Web3Forms for email notifications (no backend)

## Setup

```bash
npm install
npm run dev
```

## Before you go live

1. **Web3Forms** — Create a free key at [web3forms.com](https://web3forms.com) and replace `web3formsAccessKey` in `src/data.ts`.
2. **Admin password** — Change `adminPassword` in `src/data.ts` (default: `rolake2024`). Open `/admin` to manage offers.
3. **Instagram / email** — Update `instagram`, `instagramUrl`, and `email` in `src/data.ts`.
4. **Studio address** — Set `studioAddress` (shown only after a booking is confirmed).
5. **Logo** — Replace `public/logo.png` with your badge if needed.
6. **Gallery** — Swap SVGs in `public/gallery/` for real photos; update paths in `src/data.ts` if filenames change.

## Deploy

Build static files and host on Netlify, Vercel, Cloudflare Pages, or any static host:

```bash
npm run build
```

Publish the `dist/` folder. No server required.

## Booking rules

- Working hours: Mon–Sat, 9:00–19:00 (config in `src/data.ts`)
- Slot blocking uses full service duration + `bufferMinutes` (60)
- Listed-price bookings confirm instantly
- Offers stay `pending` and hold the slot; below `minOffer` auto-declines

## Future Supabase

Replace `src/lib/storage.ts` (and optionally notifications) with Supabase calls while keeping the types in `src/data.ts` and the `BookingProvider` API the same.
