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

One gitignored `.env` at the repo root drives Compose, the API, and the web app. Ports (`API_PORT`, `WEB_PORT`, `POSTGRES_PORT`), `DATABASE_URL`, and API URL vars all live there.

## Local development

Mix and match — only Postgres needs Docker if you want; everything else can run on the host.

```bash
# Database only, then API + web on the host
docker compose up -d db
npm run dev:api
npm run dev:web

# Full stack in Docker (db + api + web)
npm run docker:up

# API image + Compose db (web on the host)
docker compose up -d --build db api
npm run dev:web

# Tear down
npm run docker:down
```

Point `DATABASE_URL` at `localhost` when the API runs on the host, or at host `db` when the API runs in Compose against the Compose Postgres. For an external database, set `DATABASE_URL` to that URL and skip the `db` service.

### Checks

```bash
npm run typecheck
npm test
```

## Production / hosting

There is no fixed topology — use the same Compose file and `.env` with whatever subset you need.

Typical layout used for this project:

- **Web** → Vercel (`apps/web`); set `NEXT_PUBLIC_API_URL` (and optionally `API_URL`) to the public API origin
- **API** → Oracle VM (or any host) via Docker: `docker compose up -d --build api`
- **DB** → external Postgres (`DATABASE_URL`); do not start the `db` service
- **TLS / routing** → Cloudflare Tunnel: set `TUNNEL_TOKEN`, then  
  `docker compose --profile tunnel up -d api tunnel`  
  Public hostname service URL: `http://api:${API_PORT}` (Docker DNS)

You can also run **db + api + web** (and tunnel) all on one machine with the same Compose file if you prefer a self-contained deploy.

- `Dockerfile` — multi-stage targets `api` and `web`
- `compose.yaml` — services `db`, `api`, `web`, and optional `tunnel`
- Schema `aib_sitac` is applied on API startup from `apps/api/sql/schema.sql`

CORS defaults to `https://aib-sitac.smnl.dev` plus `localhost` / `127.0.0.1` on `WEB_PORT`. Add more with `CORS_ORIGINS` (comma-separated). Trust proxy is on when `NODE_ENV=production`.

## Privacy notes

Intervento geometry and history live in your database. Password is optional; rooms are listed on the home page. See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md).
