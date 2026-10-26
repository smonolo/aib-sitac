# AGENTS.md — AIB SITAC

Expo/React Native is **out of scope for v1**. This monorepo is a **website-first** tactical map: Next.js + NestJS + PostgreSQL. A future mobile app lives under `apps/mobile` with its **own** UI; share `packages/core` and the API only.

## Product constraints

- **Public audience, operator-focused.** Anyone can open a room; day-to-day users are operators / sala / squad leads. Never imply membership or institutional affiliation.
- **Unofficial.** No Protezione Civile / VVF / Regione logos or endorsement language.
- **Event-sourced marks.** Every change is an append-only event with a timestamp. Deletes are tombstones. Timeline scrubber = fold until `T` over **mark events** (`upsert_feature` / `delete_feature`) — one step per add/remove. `named_snapshot` is an optional label/bookmark only, not required for replay.
- **Link rooms (+ optional passphrase).** No org RBAC in v1.
- **Camera family design system**, not Designers Italia / Titillium. Match AIB Camera app + `smnl.dev/aib-camera` tokens exactly:
  - **Dark mode only for now** (`class="dark"` on `<html>`; canvas inverse `#111111`, surface `#1A1A1A`, muted `#A3A3A3`).
  - Canvas `#F5F5F5` / inverse `#111111`, surface `#FFFFFF` / `#1A1A1A`, muted `#525252` / `#A3A3A3`, track + fg-inverted segmented controls, radii `12` / `16`.
  - Primary actions = muted surface fill + fg text, **min-height 52**, radius 16 — not brand-red CTAs. Brand `#AF2525` is identity/destructive accent only.
  - Typography: 28px bold titles (`tracking-[-0.4px]`), 15px body, 13px labels/nav, links = fg + underline + `hover:opacity-70`.
  - Web: shadcn primitives in `components/ui/*` restyled to these rules; tokens in `apps/web/app/globals.css` (`aib-*` + mapped shadcn vars). Marketing layer reuses site `aib-*` classes like Camera.
- **Map marks:** point symbols use in-app tactical-style icons (not official NATO/PC symbology); lines/areas use stroke/fill. Palette rows show geometry kind (point / line / area).
- **ORM**: Drizzle (`apps/api/src/db`) against PostgreSQL; bootstrap DDL remains in `apps/api/sql/schema.sql`.
- Prettier matches AIB Camera (`.prettierrc`).
- **License.** PolyForm Noncommercial 1.0.0. Do not relicense without an explicit owner request.
- **i18n.** Italian default + English; keep catalogs in sync with natural product copy.

## Stack rules

- Domain logic in `packages/core` (no React, no Nest).
- Persistence only in `apps/api` + Postgres — not Next Route Handlers.
- MapLibre is client-only in `apps/web`.
- Local: Docker Compose (`db` / `api` / `web` subsettable). Production: web on Vercel, Nest on a separate host, remote Postgres.

## Commands

```bash
npm ci
npm run dev:docker
npm run dev:api
npm run dev:web
npm run typecheck
npm test
```

## Docs & site sync

After product/behavior changes, update `README.md`, `PRIVACY.md`, `TERMS.md`, `AGENTS.md`, and marketing pages under `../mono-lo-repo/apps/site` (`aib-sitac/` layer) when that path exists.

## Do not

- Scaffold Expo in `apps/mobile` until mobile work starts (README placeholder only).
- Present SITAC as part of Coordinamento Operativo AIB.
- Commit secrets.
