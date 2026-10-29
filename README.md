# AIB SITAC

Independent, unofficial **tactical situation map (SITAC)** for wildfires / **incendi boschivi**: draw symbols, areas, and arrows on a shared map, with every mark timestamped so you can scrub how the scenario developed.

**Open to anyone** — aimed at operators, sala, and squad leads, but not limited to a single organization. Citizens and volunteers may use it too.

**Not affiliated with** Protezione Civile, Vigili del Fuoco, Regione Lombardia, or any other public institution. Built by a volunteer ([smnl.dev](https://smnl.dev)).

License: [PolyForm Noncommercial 1.0.0](./LICENSE) · UI: Italian · timestamps: `Europe/Rome`

App: [aib-sitac.smnl.dev](https://aib-sitac.smnl.dev) · Marketing: [smnl.dev/aib-sitac](https://smnl.dev/aib-sitac) ([Guida](https://smnl.dev/aib-sitac/guide) · [Privacy](https://smnl.dev/aib-sitac/privacy) · [Termini](https://smnl.dev/aib-sitac/terms))

## Features (v1)

- Create an **intervento** room (optional password); open rooms from the home card (**Cerca** list with title search + pagination, or **Crea**); rename / set or remove password from the map sidebar; share the link
- Curated symbol palette with tactical-style icons (hotspot, active front, burned area, water, lookout, posto di comando, vehicle, squad, road closed, wind, note) — unofficial, not institutional symbology
- **Cursore** mode to select marks; draw **Freccia** / **Forma** / **Testo** (plus tactical symbols); soft-delete via tombstone events
- **Append-only event log** in PostgreSQL → every mark add/remove is an automatic timeline step (scrubber / ← → / `?step=N`), with the local profile name recorded as `actorLabel`; **Copia link** shares the current step when scrubbing
- Home + map: no site navbar/footer; works on phone and desktop. **Home** = centered card with **Cerca** / **Crea**, About + theme + profile. **Map** sidebar (drawer on mobile) = logo + intervento info + cursore/symbols + room actions + About + profile/theme; floating timeline + mark controls. Guida / Privacy / Termini open on the marketing site (`smnl.dev/aib-sitac/…`); old `/privacy` and `/terms` app paths redirect there
- **Light and dark** UI (follows system by default; toggle on home and in the map sidebar)
- Export **GeoJSON** and map **PNG**
- Realtime updates via SSE (password-protected rooms poll; SSE drops if a password is set/changed)
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

All config is the root `.env` (gitignored). Each app has its own Dockerfile (`apps/api`, `apps/web`). `compose.yaml` has services `db`, `api`, `web` — start any subset.

## Local development

```bash
docker compose up -d db    # Postgres
npm run dev:api            # Nest on the host
npm run dev:web            # Next on the host

npm run docker:up          # or run db + api + web all in Docker
npm run docker:down
```

`DATABASE_URL` is for the API on the **host** (`localhost` in `.env.example`). Compose **api** ignores that and talks to the `db` service (`@db`) unless you set `API_DATABASE_URL` (e.g. external Postgres in production — then do not start `db`).

```bash
npm run typecheck
npm test
```

## Production

Same Compose file, pick what you need. This project typically:

- **Web** → Vercel project Root Directory `apps/web` (install/build in `apps/web/vercel.json` build `@aib-sitac/core` first). Set `NEXT_PUBLIC_API_URL` to the public API origin
- **API** → `docker compose up -d --build api` on the VM
- **DB** → external Postgres via `API_DATABASE_URL` (Compose api service; leave `db` off)
- **TLS** → whatever already runs on the VM (point it at `localhost:$API_PORT`)

CORS and trust-proxy are hardcoded in the API. Schema migrations live in `apps/api/drizzle/` and are applied on API startup (Drizzle Kit). Existing DBs that already have tables are baselined automatically so only new migrations run.

```bash
npm run db:generate   # after editing apps/api/src/db/schema.ts → apps/api/drizzle/
npm run db:migrate    # optional; API startup also migrates
```

## Privacy notes

Intervento geometry and history live in your database. Password is optional; the home list (title, date, optional creator, protected flag) is public. See [PRIVACY.md](./PRIVACY.md) and [TERMS.md](./TERMS.md).
