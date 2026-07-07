# WOW-Toon-Data

Track the Achievements and Quests completed across all your World of Warcraft (Retail) characters, powered by the free Blizzard Battle.net API.

> Powered by the Blizzard API. World of Warcraft is a trademark of Blizzard Entertainment, Inc. This is an unofficial, non-commercial portfolio project and is not affiliated with or endorsed by Blizzard.

## Features (planned)

- **Character menu + detail** — pick a character to see its render image, basic stats, achievements, and completed quests.
- **Combined achievements** — sortable, searchable list of every achievement across all your toons; select one to see which characters have it.
- **Combined quests** — same idea, for completed quests.
- **Accounts** — email/password login, forgot-password, delete account.
- **Battle.net linking** — connect your Battle.net account to auto-import your character roster (US region).
- **Demo mode** — a read-only seeded account so anyone can explore without a Blizzard account.
- **PWA** — installable, offline app shell.

## Tech stack

| Layer    | Tech |
|----------|------|
| Frontend | React + Vite, React Router; hand-rolled PWA (manifest + service worker) |
| Backend  | Node + Express, Mongoose |
| Database | MongoDB (Atlas) |
| Auth     | JWT (httpOnly cookie) + bcrypt; Battle.net OAuth for roster import |
| Hosting  | Render — a single Web Service (the Express API serves the built SPA) |

## Monorepo layout

```
WOW-Toon-Data/
├── client/      # React + Vite SPA (PWA)
├── server/      # Express API + Mongoose; serves client/dist in production
├── render.yaml  # Render blueprint (single web service)
└── package.json # npm workspaces + dev scripts
```

## Local development

Prerequisites: Node 20+ (repo pins 22 via `.nvmrc`), a MongoDB connection string (Atlas free tier or local `mongod`).

```bash
# from the repo root
npm install                 # installs client + server via workspaces

cp server/.env.example server/.env    # then fill in values
cp client/.env.example client/.env

npm run dev                 # runs API (default :5000) and client (:5173) together
```

- API health check: <http://localhost:5000/api/health>
- Client: <http://localhost:5173>

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list. The Blizzard client ID/secret come from <https://develop.battle.net>.

## Deployment (Render)

`render.yaml` defines a **single Web Service**: the build compiles the React client (`npm run build --workspace client`) and the Express API serves the resulting `client/dist` alongside `/api/*`. Because the app and API share one origin, the auth cookie is **first-party** (`SameSite=Lax`), so login works in every browser — including Safari/iOS, which block the third-party cookies a split client/API deployment would require.

- **Build:** `npm install --include=dev && npm run build --workspace client` (`--include=dev` so Vite is available under `NODE_ENV=production`).
- **Start:** `npm start --workspace server` (Express serves the SPA + API).
- **Database:** MongoDB Atlas — set `MONGO_URI`, and allow Render's egress under Atlas Network Access (`0.0.0.0/0`).
- **Key env vars:** `CLIENT_URL` = the service's own URL (used for the post-OAuth redirect); `BLIZZARD_REDIRECT_URI` = `<service-url>/api/blizzard/callback`, matched exactly in the Blizzard developer portal.
- Locally, `npm run dev` still runs the client (Vite, `:5173`) and API (`:5000`) separately, with Vite proxying `/api` — so dev is same-origin too.

## Roadmap

- [x] **M1 — Scaffold:** monorepo, Vite client, Express API, Mongo connection, health check, Render config.
- [x] **M2 — Auth:** register/login/JWT, forgot-password, delete-account, footer + static pages, seeded demo account.
- [x] **M3 — Battle.net OAuth linking** + roster import (connect/callback/resync/unlink, encrypted token, character roster).
- [x] **M4 — Sync engine + data model** (per-character deep sync: achievements/quests/media/item level, shared metadata caches, staleness + auto-sync, 404 handling).
- [x] **M5 — Character menu + detail page** (Deliverable #1: render image, stats, and searchable/sortable achievements & quests per character).
- [x] **M6 — Combined achievement & quest lists** (Deliverables #2 & #3: account-wide sortable/searchable lists + reverse lookup of which characters have each).
- [x] **M7 — PWA** (manifest, service worker, install button).
- [x] **Collections** — account-wide mounts, pets, and toys with lazy-loaded art.
- [ ] **M8 — Demo/seeded account + polish.**
