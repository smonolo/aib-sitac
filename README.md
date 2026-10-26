# AIB SITAC

Independent, unofficial **tactical situation map (SITAC)** for wildfires / **incendi boschivi**: draw symbols, areas, and arrows on a shared map, with every mark timestamped so you can scrub how the scenario developed.

**Open to anyone** — aimed at operators, sala, and squad leads, but not limited to a single organization. Citizens and volunteers may use it too.

**Not affiliated with** Protezione Civile, Vigili del Fuoco, Regione Lombardia, or any other public institution. Built by a volunteer ([smnl.dev](https://smnl.dev)).

License: [PolyForm Noncommercial 1.0.0](./LICENSE) · UI: Italian (default) + English · timestamps: `Europe/Rome`

Marketing / privacy / terms: [smnl.dev/aib-sitac](https://smnl.dev/aib-sitac)

## Features (v1)

- Create an **incident room** (optional passphrase); share the link
- Curated symbol palette with tactical-style icons (hotspot, active front, burned area, water, lookout, PC/ROS, vehicle, squad, road closed, wind, note) — unofficial, not institutional symbology
- Draw **points** (one click), **lines/arrows** (multi-click + Finish), and **areas** (polygon vertices + Finish); soft-delete via tombstone events
- **Append-only event log** in PostgreSQL → every mark add/remove is an automatic timeline step (scrubber / ← →); optional **labels** are named bookmarks only, not required for replay
- **Dark mode only** (v1 UI)
- Export **GeoJSON** and map **PNG**
- Realtime updates via SSE (passphrase rooms poll)
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
cp .env.example .env
npm ci
```

### Docker Compose (full stack)

```bash
npm run dev:docker
# web http://localhost:3000 · api http://localhost:4000/api/health · db :5432
```

### Subsets

```bash
# Database only, then API + web on the host
docker compose up db -d
npm run dev:api
npm run dev:web

# DB + API in Compose, Next on the host
docker compose -f compose.yaml -f compose.dev.yaml up db api --build
npm run dev:web
```

### Checks

```bash
npm run typecheck
npm test
```

## Production topology

- **Web** → Vercel (`apps/web`); set `NEXT_PUBLIC_API_URL` to the public API origin
- **API** → long-running Nest host (Fly, Railway, Render, Cloud Run, VPS); set `DATABASE_URL`, `CORS_ORIGIN`
- **DB** → managed PostgreSQL; schema applied automatically on API startup from `apps/api/sql/schema.sql`

Nest does **not** deploy as the Vercel serverless app.

## Privacy notes

Incident geometry and history live in your database. Passphrase is optional; there is no public incident directory. See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md).
