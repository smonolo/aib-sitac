# AGENTS.md — AIB SITAC

Expo/React Native is **out of scope for v1**. This monorepo is a **website-first** tactical map: Next.js + NestJS + PostgreSQL. A future mobile app lives under `apps/mobile` with its **own** UI; share `packages/core` and the API only.

## Product constraints

- **Public audience, operator-focused.** Anyone can open a room; day-to-day users are operators / sala / squad leads. Never imply membership or institutional affiliation.
- **Unofficial.** No Protezione Civile / VVF / Regione logos or endorsement language.
- **Event-sourced marks.** Every change is an append-only event with a timestamp and optional `actorLabel` (display name from local profile; required before placing/removing marks). Deletes are tombstones. Timeline scrubber = fold until `T` over **mark events** (`upsert_feature` / `delete_feature`) — one step per add/remove. Scrubbing writes `?step=N` (1-based) on the room URL; live clears it; **Copia link** copies the current URL including step. Legacy `named_snapshot` / `estimated` may exist in old rooms but are not exposed in the UI.
- **Link rooms (+ optional password).** Product copy uses **intervento/interventi** (API still says incident). Home lists interventi with title search, date range (Europe/Rome), and pagination; opening a protected room still needs the password. On the map, the right sidebar can rename the intervento and set/remove the password (`PATCH /incidents/:id`). No org RBAC in v1. API: scrypt passphrase hashes, UUID params, strict mark-event payloads (no client `ts`), body/rate/SSE caps; CORS allowlist (`aib-sitac.smnl.dev` + local Next) and trust-proxy (when `NODE_ENV=production`) are hardcoded — no `CORS_ORIGIN` / `TRUST_PROXY` env. Single root `.env` (from `.env.example`) for Compose / API / web — never commit secrets.
- **Camera family design system**, not Designers Italia / Titillium. Match AIB Camera app + `smnl.dev/aib-camera` tokens exactly:
  - **Dark mode only for now** (`class="dark"` on `<html>`; canvas inverse `#111111`, surface `#1A1A1A`, muted `#A3A3A3`).
  - Canvas `#F5F5F5` / inverse `#111111`, surface `#FFFFFF` / `#1A1A1A`, muted `#525252` / `#A3A3A3`, track + fg-inverted segmented controls, radii `12` / `16`.
  - Primary actions = muted surface fill + fg text, **min-height 52**, radius 16 — not brand-red CTAs. Brand `#AF2525` is identity/destructive accent only.
  - Interactions: `hover:opacity-70`, disabled `opacity-40`; list rows **min-height 52** with `px-3.5`; quiet chrome controls `min-h-9` + `rounded-aib-sm`.
  - Typography: 28px bold titles (`tracking-[-0.4px]`), 15px body, 13px labels/nav, links = fg + underline + `hover:opacity-70`.
  - Web: shadcn primitives in `components/ui/*` restyled to these rules; shared utilities (`.aib-link`, `.aib-list`, `.aib-quiet-btn`, `.aib-tool-btn*`) in `apps/web/app/globals.css`. Marketing layer reuses site `aib-*` classes like Camera.
- **Map marks:** annotation tools first (**Freccia** / **Forma** / **Testo**), then tactical point icons (not official NATO/PC symbology). Arrows render with a head; shapes are polygons; text marks open a dialog and show a label on the map. Left sidebar: **Cursore** (select) or a tool to place; right sidebar = timeline + room actions. Optional display name via navbar user icon (local only; save / clear). Footer: Guida/Privacy/Termini left; smnl.dev + email right.
- **ORM**: Drizzle (`apps/api/src/db`) against PostgreSQL via required `DATABASE_URL` (any DB name/host); tables live in schema `aib_sitac` (not `public`). Bootstrap DDL in `apps/api/sql/schema.sql`.
- Prettier matches AIB Camera (`.prettierrc`).
- **License.** PolyForm Noncommercial 1.0.0. Do not relicense without an explicit owner request.
- **i18n.** Italian only for now (no language switcher).

## Stack rules

- Domain logic in `packages/core` (no React, no Nest).
- Persistence only in `apps/api` + Postgres — not Next Route Handlers.
- MapLibre is client-only in `apps/web`.
- One `compose.yaml` + root `Dockerfile` (`api` / `web`). Run any subset of `db` / `api` / `web`. Typical prod: Vercel web + VM API + external Postgres; TLS on the host. Marketing at `smnl.dev/aib-sitac`.

## Commands

```bash
npm ci
cp .env.example .env
npm run dev:api
npm run dev:web
docker compose up -d db
npm run docker:up
npm run typecheck
npm test
```

## Docs & site sync

After product/behavior changes, update `README.md`, `PRIVACY.md`, `TERMS.md`, `AGENTS.md`, and marketing pages under `../mono-lo-repo/apps/site` (`aib-sitac/` layer) when that path exists.

## Do not

- Scaffold Expo in `apps/mobile` until mobile work starts (README placeholder only).
- Present SITAC as part of Coordinamento Operativo AIB.
- Commit secrets.
