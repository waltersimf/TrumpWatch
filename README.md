# TrumpWatch

TrumpWatch is a dashboard that tracks the current U.S. presidential term through **20 January 2029**. It combines a live countdown, FRED economic indicators, Trump-related news, verified quotes, government metrics, API health, and operational notifications.

## Repository layout

| Path | Purpose |
|---|---|
| `client/` | React 19 and Tailwind web dashboard |
| `server/` | Express and tRPC backend, external-data services, and API health logic |
| `drizzle/` | MySQL/TiDB schema for metrics, news, quotes, statuses, and reports |
| `shared/` | Shared application constants and types |
| `mobile-android/` | Native Expo/React Native Android application, home-screen widgets, background refresh, and Android tests |

## Web application

The web application uses React 19, Tailwind 4, Express 4, tRPC 11, Drizzle ORM, and Vitest.

```bash
pnpm install
pnpm dev
pnpm test
```

The backend keeps quotes truthful: technical fallback strings are not displayed as quotes. Dashboard news is restricted to records that explicitly mention Trump, while government metrics use canonical Treasury and Census source pages.

## Android application

The Android source is intentionally kept in `mobile-android/` so it can evolve independently from the web deployment.

```bash
cd mobile-android
npm install
npm run check
npm test
```

The mobile application reads the production tRPC dashboard contract, renders the overview and news sections, supports quote copying and refresh, and includes countdown and economic home-screen widgets.
