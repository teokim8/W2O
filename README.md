# W2O — Weather to Outfit

A mobile-first web app that recommends a complete outfit based on the current
weather. Built with **Vite + React + TypeScript**, deployable as a PWA for both
desktop and mobile.

The product principle: **one item per slot, no layering** — an intentionally
minimal, intuitive UX. The recommendation engine is pure and deterministic, and
lives separately from the UI in `src/engine.ts`.

---

## Requirements

- **Node.js 18+** (20 LTS recommended)
- npm (bundled with Node)

## Run locally

```bash
npm install      # install dependencies
npm run dev      # start dev server → http://localhost:5173
```

Open the printed URL. On desktop you'll see a phone-framed preview; on a phone
(or a narrow window) it goes full-bleed.

> **Test on your phone over the local network:** run `npm run dev -- --host`,
> then open the Network URL it prints from your phone (same Wi-Fi).
> Geolocation needs HTTPS (see below), so GPS won't work over plain `http://`
> on a phone — manual temperature/weather and city search still do.

## Build & preview

```bash
npm run build    # type-check (tsc) + production build → dist/
npm run preview  # serve the production build locally
```

---

## Deploy (desktop + mobile web app)

The output is a static site in `dist/`. Any static host works. Geolocation and
the PWA install prompt **require HTTPS** — all options below provide it free.

### Vercel
```bash
npm i -g vercel
vercel            # first run links the project
vercel --prod     # deploy to production
```
Framework preset auto-detects Vite. No config needed.

### Netlify
- Drag-and-drop the `dist/` folder at app.netlify.com, **or** connect the repo
  with build command `npm run build` and publish directory `dist`.

### GitHub Pages
- Push the repo, build, and publish `dist/` (e.g. via the `gh-pages` package or
  a GitHub Action). If you deploy under a sub-path, set Vite's `base` option.

---

## PWA / installable app

`vite-plugin-pwa` is configured (`vite.config.ts`) with a web manifest and an
auto-updating service worker. Once deployed over HTTPS:

- **iOS (Safari):** Share → *Add to Home Screen*.
- **Android (Chrome):** the install prompt appears, or menu → *Install app*.
- **Desktop (Chrome/Edge):** install icon in the address bar.

Icons live in `public/` (`pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png`,
`favicon.svg`) and use the dial-dot motif. Replace them to rebrand.

---

## External services (no API key required)

- **Weather:** [Open-Meteo](https://open-meteo.com) — `apparent_temperature` +
  `weather_code`, mapped to our four conditions in `engine.ts → codeToCondition`.
- **Geocoding / city search:** [Nominatim](https://nominatim.openstreetmap.org)
  (OpenStreetMap). A built-in dataset of 55 major cities (`engine.ts → CITIES`)
  provides instant, offline-safe search results; online results are merged in
  when available. For production traffic at scale, review Nominatim's usage
  policy or swap in a dedicated geocoder.

---

## Project structure

```
w2o/
├─ index.html
├─ vite.config.ts          # Vite + PWA config
├─ tsconfig.json
├─ public/                 # icons, favicon (served as-is)
└─ src/
   ├─ main.tsx             # React entry
   ├─ App.tsx              # UI: home / setting / location pages + dial
   ├─ engine.ts            # pure logic + types (no React/DOM) ← the core
   └─ index.css            # global reset + frame + control styles
```

`engine.ts` is intentionally framework-agnostic so it can be reused (e.g. React
Native) without touching the recommendation logic.

See **PRD.md** for the full product, engine, and design specification — including
the decisions that must be preserved when extending the app.
