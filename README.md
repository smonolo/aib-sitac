# AIB SITAC

Independent, unofficial **tactical situation map (SITAC)** for wildfires / **incendi boschivi**: draw symbols, areas, and arrows on a shared map, with every mark timestamped so you can scrub how the scenario developed.

**Open to anyone** — aimed at operators, sala, and squad leads, but not limited to a single organization. Citizens and volunteers may use it too.

**Not affiliated with** Protezione Civile, Vigili del Fuoco, Regione Lombardia, or any other public institution. Built by a volunteer ([smnl.dev](https://smnl.dev)).

License: [PolyForm Noncommercial 1.0.0](./LICENSE) · UI: Italian · timestamps: `Europe/Rome`

App: [aib-sitac.smnl.dev](https://aib-sitac.smnl.dev) · Marketing: [smnl.dev/aib-sitac](https://smnl.dev/aib-sitac) ([Guida](https://smnl.dev/aib-sitac/guide) · [Privacy](https://smnl.dev/aib-sitac/privacy) · [Termini](https://smnl.dev/aib-sitac/terms))

## Features (v1)

- Create an **intervento** room (optional password); browse rooms from the home list (search, date filter, pagination); rename / set or remove password from the map sidebar; share the link
- Curated symbol palette with tactical-style icons (hotspot, active front, burned area, water, lookout, PC/ROS, vehicle, squad, road closed, wind, note) — unofficial, not institutional symbology
- **Cursore** mode to select marks; draw **Freccia** / **Forma** / **Testo** (plus tactical symbols); soft-delete via tombstone events
- **Append-only event log** in PostgreSQL → every mark add/remove is an automatic timeline step (scrubber / ← → / `?step=N`), with the local profile name recorded as `actorLabel`; **Copia link** shares the current step when scrubbing
- Shared site **navbar/footer** on every page; map **left sidebar** = cursore + symbols, **right sidebar** = timeline / export / room actions
- **Dark mode only** (v1 UI)
- Export **GeoJSON** and map **PNG**
- Realtime updates via SSE (password-protected rooms poll)
- Website first (`apps/web`); Nest API (`apps/api`); shared domain (`packages/core`); mobile slot reserved (`apps/mobile`)

## Stack

Next.js 16 · NestJS 11 · PostgreSQL 17 · Drizzle ORM · shadcn/ui · MapLibre GL · TypeScript · Docker Compose

## Monorepo layout

| Path            | Role                                                                  |
| --------------- | --------------------------------------------------------------------- |
| `apps/web`      | Next.js map UI (Vercel in production)                                 |
| `apps/api`      | NestJS HTTP + SSE (separate Node host in production)                  |
| `apps/mobile`   | Reserved for a future Expo app (own UI; shares `packages/core` + API) |
| `packages/core` | Event types, fold/replay, symbols, GeoJSON export                     |

## Local development

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm ci
```

Env is per app: web only needs the API URL; API only needs `DATABASE_URL` (CORS / trust-proxy are hardcoded). Docker Compose injects its own values and does not use these files.

### Docker Compose

```bash
# Full stack (db + api + web)
npm run dev:docker
# web http://localhost:3000 · api http://localhost:4000/api/health · db :5432

# Database only (Postgres on :5432), then run API/web on the host
npm run dev:docker:db
npm run dev:api
npm run dev:web

# DB + API in Docker, Next on the host
npm run dev:docker:api
npm run dev:web

# Tear down Compose services
npm run dev:docker:down
```

Use `dev:docker:up` / `dev:docker:api:up` for the same stacks without Compose Watch.

### Checks

```bash
npm run typecheck
npm test
```

## Production topology

- **Web** → Vercel (`apps/web`) at `https://aib-sitac.smnl.dev`; in the Vercel project env set `NEXT_PUBLIC_API_URL` (and optionally `API_URL`) to the public API origin — mirrors `apps/web/.env.example`
- **API** → long-running Nest host (Fly, Railway, Render, Cloud Run, VPS); set `DATABASE_URL` there (not on Vercel). CORS allowlist and trust-proxy (prod) are hardcoded in the API
- **Marketing** → `https://smnl.dev/aib-sitac` (site layer in mono-lo-repo; app CTA via `NUXT_PUBLIC_AIB_SITAC_APP_URL`)
- **DB** → set `DATABASE_URL` on the API host to your Postgres; the app uses schema `aib_sitac` inside that database (DDL on startup from `apps/api/sql/schema.sql`). Local Compose defaults to DB name `postgres`.

API hardening (no UX change for normal use): passphrase hashing (async scrypt), attempt rate limits, UUID param checks, strict event payloads (mark add/remove only; server timestamps), JSON body size cap, per-route rate limits, SSE connection caps, security headers.

Nest does **not** deploy as the Vercel serverless app.

## Privacy notes

Intervento geometry and history live in your database. Password is optional; rooms are listed on the home page. See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md).
