# AGENTS.md — AIB SITAC

Expo/React Native is **out of scope for v1**. This monorepo is a **website-first** tactical map: Next.js + NestJS + PostgreSQL. A future mobile app lives under `apps/mobile` with its **own** UI; share `packages/core` and the API only.

## Product constraints

- **Public audience, operator-focused.** Anyone can open a room; day-to-day users are operators / sala / squad leads. Never imply membership or institutional affiliation.
- **Unofficial.** No Protezione Civile / VVF / Regione logos or endorsement language.
- **Event-sourced marks.** Every change is an append-only event with a timestamp and optional `actorLabel` (display name from local profile; required before placing/removing/moving marks). Deletes are tombstones (UI confirms before `delete_feature`). Moves re-`upsert_feature` the same `featureId` with translated geometry (Cursore → **Sposta** → drag → **Termina**; live only). Timeline scrubber = fold until `T` over **mark events** (`upsert_feature` / `delete_feature`) — one step per upsert/delete. Scrubbing writes `?step=N` (1-based) on the room URL; live clears it; **Copia link** copies the current URL including step. Legacy `named_snapshot` / `estimated` may exist in old rooms but are not exposed in the UI.
- **Link rooms (+ optional password).** Product copy uses **intervento/interventi** (API still says incident). Home is a centered login-style card with **Cerca** (title search + paginated list) and **Crea**; opening a protected room uses public `GET /incidents/:id/gate` (`hasPassphrase` only), then lands on the map shell with an unclosable password modal and **no** incident/events/SSE calls until unlock — tools/settings/export/timeline stay disabled; removing the modal in DevTools still cannot load or mutate without `X-Passphrase`. On the map, the left sidebar can rename the intervento and set/remove the password (`PATCH /incidents/:id`). No org RBAC in v1. API: scrypt passphrase hashes on every get/list/append/SSE for protected rooms (`X-Passphrase` only; never query/URL); public list redacts map center/zoom when `hasPassphrase`; setting/changing/removing a password drops SSE subscribers for that room; UUID params, strict mark-event payloads (no client `ts`), body/rate/SSE caps; CORS allowlist (`aib-sitac.smnl.dev` + local Next) and trust-proxy (when `NODE_ENV=production`) are hardcoded — no `CORS_ORIGIN` / `TRUST_PROXY` env. Single root `.env` (from `.env.example`) for Compose / API / web — never commit secrets.
- **Camera family design system**, not Designers Italia / Titillium. Match AIB Camera app + `smnl.dev/aib-camera` tokens exactly:
  - **Light + dark** (system default; optional override in `localStorage` `aib-sitac-theme` = `system` | `light` | `dark`; boot script toggles `class="dark"` on `<html>`). Toggle in home footer and map sidebar.
  - Canvas `#F5F5F5` / inverse `#111111`, surface `#FFFFFF` / `#1A1A1A`, muted `#525252` / `#A3A3A3`, track + fg-inverted segmented controls, radii `12` / `16`. Use light tokens + `dark:` pairs (same as marketing site / Camera).
  - Primary actions = dark fill + light text in light mode, white fill + dark text in dark mode; secondary = muted gray fill; **min-height 52**, radius 16 — not brand-red CTAs. Brand `#AF2525` is identity/destructive accent only.
  - Interactions: `hover:opacity-70`, disabled `opacity-40`; list rows **min-height 52** with `px-3.5`; quiet chrome controls `min-h-9` + `rounded-aib-sm`.
  - Typography: 28px bold titles (`tracking-[-0.4px]`), 15px body, 13px labels/nav, links = fg + underline + `hover:opacity-70`.
  - Web: shadcn primitives in `components/ui/*` restyled to these rules; shared utilities (`.aib-link`, `.aib-list`, `.aib-quiet-btn`, `.aib-tool-btn*`) in `apps/web/app/globals.css`. Marketing layer reuses site `aib-*` classes like Camera.
- **Map marks:** annotation tools first (**Freccia** / **Forma** / **Testo**), then tactical point icons (not official NATO/PC symbology). Arrows render with a head; shapes are polygons; text marks open a dialog and show a label on the map. With **Cursore**, select a mark then **Sposta** (drag, then **Termina**) or **Elimina**. Map room view has **no site navbar/footer**. Shell uses canvas as background; on **md+** sidebar and map sit in rounded elevated panels; on **mobile** the map is full-bleed and the sidebar is an off-canvas drawer (menu button top-left; selecting a tool closes it). Sidebar: logo → intervento title (+ lock if password-protected) → scrollable **Cursore** + mark tools → room actions + **Informazioni** (About modal → marketing Guida/Privacy/Termini) → profile + theme icon at the very bottom. Top floating timeline (stacks on narrow screens); bottom floating mark controls (safe-area aware). Basemap = Humanitarian OSM (HOT) raster tiles. Optional display name (local only; save / clear); copied onto new rooms as `createdBy` when set, and onto mark events as `actorLabel`. Home has no site navbar/footer: centered card with logo, **Cerca** / **Crea** tabs, About + theme toggle + profile (safe-area padding). **Informazioni** (and `/privacy` `/terms` redirects) always open the marketing site (`smnl.dev/aib-sitac/guide|privacy|terms`) — no in-app legal/guide pages.
- **ORM**: Drizzle (`apps/api/src/db`) against PostgreSQL via required `DATABASE_URL` (any DB name/host); tables live in schema `aib_sitac` (not `public`). Host-run API uses `.env` `DATABASE_URL` (`localhost`). Compose **api** uses `@db` by default (override with `API_DATABASE_URL` for external Postgres). Schema changes: edit `schema.ts`, run `npm run drizzle:generate --workspace=@aib-sitac/api`, commit `apps/api/drizzle/`. API applies pending migrations on startup (`ensureSchema`); DBs that already had the old bootstrap tables are baselined so `0000_init` is not re-run.
- Prettier matches AIB Camera (`.prettierrc`). **Always format** edited/generated code with Prettier before finishing (`npm run format` or `npx prettier --write` on touched paths; `npm run format:check` must pass). Enforced in `.cursor/rules/prettier-format.mdc`.
- **License.** PolyForm Noncommercial 1.0.0. Do not relicense without an explicit owner request.
- **i18n.** Italian only for now (no language switcher).

## Stack rules

- Domain logic in `packages/core` (no React, no Nest).
- Persistence only in `apps/api` + Postgres — not Next Route Handlers.
- MapLibre is client-only in `apps/web`.
- One `compose.yaml`; Dockerfiles per app (`apps/api/Dockerfile`, `apps/web/Dockerfile`). Run any subset of `db` / `api` / `web`. Typical prod: Vercel web + VM API + external Postgres; TLS on the host. Marketing at `smnl.dev/aib-sitac`.

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

## Docs & site sync (required on every product change)

Whenever you change app behavior, UX, permissions, privacy, map/events/rooms/timeline, or release notes — **before declaring the task done** — update all user- and agent-facing docs that the change affects:

1. **In-repo markdown** (this repo): `README.md`, `PRIVACY.md`, `TERMS.md`, `AGENTS.md`, and any other `*.md` that describes the changed behavior.
2. **Marketing / public site** (sibling monorepo, if present locally): `../mono-lo-repo/apps/site` — especially `aib-sitac/` (`pages/aib-sitac/` → `index.vue`, `guide.vue`, `privacy.vue`, `terms.vue`), `layouts/aib-sitac.vue`, `utils/aib-sitac-copy.ts`, `components/sitac/Navbar.vue`, and related CSS/assets. Skip the site only if that path is missing; say so briefly when skipping.

Keep copy consistent across IT/EN where both exist, preserve the **unofficial** framing (no institutional affiliation), and keep the **public audience** clear (operator-focused, not membership-gated). Do not leave docs or the site describing old behavior. (Also enforced in `.cursor/rules/docs-and-site-sync.mdc`.)

## Do not

- Scaffold Expo in `apps/mobile` until mobile work starts (README placeholder only).
- Present SITAC as part of Coordinamento Operativo AIB.
- Commit secrets.
- **Add code comments** (`//`, `/* */`, JSDoc, `#`, JSX comments, narrating TODOs). Prefer clear names; do not introduce new comments when editing. (Also enforced in `.cursor/rules/no-code-comments.mdc`.)
- Leave **dead code, duplicates, or careless perf/security debt** in a diff. Clean as you go (`.cursor/rules/clean-codebase.mdc`).
