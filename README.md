# Kashmir Explorer · Admin

Internal CMS for managing destinations, treks, providers, advisories, and bookings.

## Stack

- **Vite + React 18 + TypeScript** — fast HMR
- **TanStack Router** — file-based routing with full type-safety
- **TanStack Query** — server cache, optimistic updates
- **TanStack Table** — the destinations/treks/providers grids
- **Tailwind CSS** — Kashmiri palette baked into `tailwind.config.js`
- **Phone OTP auth** — same flow as the mobile app (role-gated to admin)

## Routes

| Path | Purpose |
|---|---|
| `/login` | Phone OTP sign-in |
| `/` | Operations overview — KPIs, critical alerts, recent destinations |
| `/destinations` | TanStack Table with search, filter, inline edit |
| `/treks` | Trek table with difficulty badges and status |
| `/providers` | Provider grid with one-click JKTDC verification |
| `/bookings` | Bookings ops — payouts, refunds, disputes |
| `/advisories` | **Live Ops console** — publish an alert, auto-pushes via WebSocket |
| `/media` | Per-destination image library |
| `/analytics` | Views, saves, bookings, search queries (PostHog) |
| `/settings` | Seasonal banner override, featured destinations, maintenance mode |

## Develop

```bash
pnpm install
pnpm dev          # → http://localhost:3001
pnpm build
pnpm preview
```

Make sure the Go API is running first (`pnpm api` from repo root, or `cd services/api && make run`).

## Env

Copy `.env.example` → `.env.local` and set:

- `VITE_API_BASE` — Go API base URL, default `http://localhost:8080/v1`
- `VITE_POSTHOG_KEY` — analytics
- `VITE_SENTRY_DSN` — error tracking
