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

| Path            | Role                                              |
| --------------- | ------------------------------------------------- |
| `apps/web`      | Next.js map UI                                    |
| `apps/api`      | NestJS HTTP + SSE                                 |
| `apps/mobile`   | Reserved for a future Expo app                    |
| `packages/core` | Event types, fold/replay, symbols, GeoJSON export |

## Setup

```bash
cp .env.example .env
npm ci
```

All config is the root `.env` (gitignored). `Dockerfile` has targets `api` and `web`. `compose.yaml` has services `db`, `api`, `web` — start any subset.

## Local development

```bash
docker compose up -d db    # Postgres
npm run dev:api            # Nest on the host
npm run dev:web            # Next on the host

npm run docker:up          # or run db + api + web all in Docker
npm run docker:down
```

`DATABASE_URL` host must match how the API runs:

- API on the host → `localhost` (default in `.env.example`)
- API in Compose with Compose `db` → use hostname `db`
- External Postgres → your provider URL; do not start `db`

```bash
npm run typecheck
npm test
```

## Production

Same Compose file, pick what you need. This project typically:

- **Web** → Vercel project Root Directory `apps/web` (install/build in `apps/web/vercel.json` build `@aib-sitac/core` first). Set `NEXT_PUBLIC_API_URL` to the public API origin
- **API** → `docker compose up -d --build api` on the VM
- **DB** → external Postgres via `DATABASE_URL`
- **TLS** → whatever already runs on the VM (point it at `localhost:$API_PORT`)

CORS and trust-proxy are hardcoded in the API. Schema `aib_sitac` is applied on startup from `apps/api/sql/schema.sql`.

## Privacy notes

Intervento geometry and history live in your database. Password is optional; rooms are listed on the home page. See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md).
