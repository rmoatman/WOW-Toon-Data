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
| Frontend | React + Vite, React Router, TanStack Query, `vite-plugin-pwa` |
| Backend  | Node + Express, Mongoose |
| Database | MongoDB (Atlas) |
| Auth     | JWT (httpOnly cookie) + bcrypt; Battle.net OAuth for roster import |
| Hosting  | Render (Static Site + Web Service) |

## Monorepo layout

```
WOW-Toon-Data/
├── client/      # React + Vite SPA (PWA)
├── server/      # Express API + Mongoose
├── render.yaml  # Render blueprint (API web service + static client)
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

## Roadmap

- [x] **M1 — Scaffold:** monorepo, Vite client, Express API, Mongo connection, health check, Render config.
- [x] **M2 — Auth:** register/login/JWT, forgot-password, delete-account, footer + static pages, seeded demo account.
- [ ] **M3 — Battle.net OAuth linking** + roster import.
- [ ] **M4 — Sync engine + data model** (per-character fetch, metadata cache, staleness).
- [ ] **M5 — Character menu + detail page.**
- [ ] **M6 — Combined achievement & quest lists** (sortable/searchable + reverse lookup).
- [ ] **M7 — PWA** (manifest, service worker, install page).
- [ ] **M8 — Demo/seeded account + polish.**
