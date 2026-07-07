# Challenges & How They Were Addressed

A running log of the non-obvious problems this project hit and how each was
solved. Grouped by area. Useful as a portfolio narrative and as a reference so
the same traps aren't re-sprung.

---

## 1. Data modeling

### Account-wide collections don't fit the per-character model
Achievements and quests are per-character (join tables `CharacterAchievement` /
`CharacterQuest` + reverse "who has this?" lookups). Mounts, pets, and toys are
**account-wide** in WoW, so cloning that shape would duplicate data and invent a
meaningless per-character breakdown.
**Fix:** modeled collectibles at the **user** level (`UserCollectible`), synced
once per account during roster sync, and presented them on a single Collections
page with no reverse lookup.

### Blizzard reuses display names across different IDs
The same achievement/quest name maps to multiple IDs (e.g. Raid vs. Remix
variants), which double-counted and showed duplicates.
**Fix:** aggregation groups by name (falling back to `#id` when a name is
missing) and counts **distinct characters**, so each shows once.

### Counts needed on cards without extra queries
**Fix:** denormalized `achievementCount` / `questCount` onto each `Character`
during deep sync so the roster grid renders without join queries.

---

## 2. Blizzard API quirks

### The Profile API 404s low-level / inactive characters
Characters not yet indexed by Blizzard return 404 for their profile.
**Fix:** each endpoint is fetched with `Promise.allSettled`; a `profileAvailable`
flag is stored and the UI prompts the user to log in on that character in-game.

### The toys collection returns only IDs — no names or icons
Unlike mounts/pets (which inline a name), the account toys endpoint returns just
`{ toy: { id }, is_favorite }`.
**Fix:** toy IDs are stored at sync; names + icon (item-media) IDs are resolved
lazily the first time the Toys tab is opened, cached globally in `ToyMeta`
(mirroring the achievement/quest metadata caches), so the cost is paid once and
shared across all users.

### Pet render IDs are sometimes absent from the collection
Pet images come from a `creature_display` ID, which isn't always present in the
account response — so pets silently resolved to no image while mounts worked.
**Fix:** added a fallback that resolves the display ID from the pet-species
game-data endpoint, and changed the media cache to key on **image presence** (an
empty result is retried, a found image is cached forever) so stale/empty rows
self-heal.

### 3D renders have baked-in transparent padding
Large/winged mounts (e.g. Algarian Stormrider) render small inside a big
transparent canvas, so a bigger tile didn't help — the creature-to-tile ratio
never changed.
**Fix:** the thumbnail is a clipping frame with the render scaled up (`1.4×`) to
crop the empty margins; the hover preview shows the full, uncropped art.

### Hundreds of game-data lookups per sync
Resolving names/media for large collections means many API calls.
**Fix:** a small concurrency-capped worker pool, and a global (shared-across-
users) cache so each collectible is resolved at most once, ever.

### The user access token lasts ~24h with no refresh token
**Fix:** the token is encrypted at rest (AES-256-GCM, key derived from
`TOKEN_ENCRYPTION_KEY`) so re-syncs work until expiry, after which the UI guides
the user to reconnect.

---

## 3. Collections media pipeline

### Serving collectible art without hundreds of eager calls or leaking auth
**Fix:** a **public** `/api/collections/media/:type/:refId` endpoint resolves the
image (via the global cache) and 302-redirects to Blizzard's render/icon CDN.
The client uses `<img loading="lazy">`, so only rows actually on screen trigger a
resolve. The endpoint is public because the image is a non-sensitive public asset
and `<img>` can't carry an auth cookie cross-origin.

---

## 4. Deployment (Render)

### Login failed in production with "Failed to fetch"
Two stacked causes surfaced via the browser console:
- **CORS:** the API's `CLIENT_URL` didn't match the client origin, so no
  `Access-Control-Allow-Origin` header → the browser blocked the request.
  **Fix:** set `CLIENT_URL` to the exact client origin.
- **Database disconnected:** `/api/health` reported `db: disconnected`.
  **Fix:** Atlas **Network Access** must allow `0.0.0.0/0` (Render's free tier
  has no fixed egress IP), plus a correct `MONGO_URI`.

### `VITE_API_URL` is baked in at build time
Setting it after the first client build had no effect (the old value was already
compiled into the bundle).
**Fix:** documented that changing it requires a rebuild — and ultimately removed
the need for it entirely (see single-origin, below).

### `NODE_ENV=production` skips devDependencies at build
Vite is a devDependency, so `npm install` under production omitted it and the
client build failed.
**Fix:** build command uses `npm install --include=dev`.

### "It's not deploying" — uncommitted work
Background rotation "didn't work" in production simply because the code was still
in the working tree, never committed/pushed.
**Fix:** commit + push; verified with `git log origin/main..HEAD`.

---

## 5. Auth, OAuth & cookies (the hardest one)

### The Battle.net OAuth redirect was blocked (`ERR_BLOCKED_BY_RESPONSE`)
`helmet()`'s default cross-origin isolation headers (`Cross-Origin-Opener-Policy`
and `Cross-Origin-Resource-Policy: same-origin`) blocked the cross-origin OAuth
callback in the browser.
**Fix:** disabled COOP and set CORP to `cross-origin` on the API.

### The dashboard falsely reported "server not configured"
The connect card showed "not configured" whenever the Blizzard status request was
merely `null` (e.g. a cold-starting free-tier API), masquerading as missing
credentials.
**Fix:** only show that message when the server **explicitly** reports
`configured: false`; show a "couldn't reach the server" hint otherwise. Also
exposed a `blizzard` boolean on `/api/health` so server config can be verified
from any browser without leaking secrets.

### The session cookie was blocked on Safari / iOS (the big one)
The app was split across two Render subdomains
(`…-api.onrender.com` and `…-client.onrender.com`). Because `onrender.com` is a
public suffix, those subdomains are **separate sites**, so the auth cookie was a
**third-party cookie** (`SameSite=None`). It worked in Chrome/Edge but Safari and
iOS block third-party cookies by default — so logins silently failed for a large
share of real users (anyone on an Apple device). It presented, confusingly, as
"server not configured" because the unauthenticated status call failed.
**Fix:** went **single-origin** — the Express API now serves the built SPA, so
the app and API share one origin. The auth cookie is first-party (`SameSite=Lax`)
and works in every browser. This also retired the CORS and COOP/CORP workarounds
and the `VITE_API_URL` requirement.

### CSRF on the OAuth handshake
**Fix:** the OAuth `state` is a signed JWT bound to the user, cross-checked
against a short-lived nonce cookie on the callback.

---

## 6. PWA

### The install button did nothing
Installability requires a web manifest **and** a service worker with a fetch
handler over HTTPS — none existed.
**Fix:** added a manifest, an app icon, and a service worker, registered in
production builds only (so it doesn't interfere with Vite HMR in dev). The
`beforeinstallprompt` button now activates.

### A naive service worker would serve stale pages after deploys
**Fix:** the SW uses **network-first for navigations** (fresh HTML picks up new
hashed assets across deploys), **stale-while-revalidate** for those hashed
assets, and deliberately **ignores `/api/` and cross-origin** so it never
interferes with the backend.

---

## 7. Mobile & UX

### No responsiveness at all
The layout had zero media queries, so the long nav and wide tables broke on
phones.
**Fix:** added a mobile stylesheet — a hamburger menu when logged in (centered,
auto-closing), a wrapped/centered logged-out header, and tighter tables.

### Column overflow and unreadable lists on small screens
**Fix:** a per-column `hideMobile` flag hides low-priority columns (pet
nickname/quality/favorite); reduced cell padding + smaller thumbnails keep tables
within the viewport (toys' "Favorite" no longer scrolls off).

### Background art vs. list readability
Full-screen art bled through the transparent table rows and made lists hard to
read.
**Fix:** a darkening overlay on the fixed background plus a translucent panel
behind the data tables, so the art shows in the margins while list text stays
legible. Backgrounds rotate per screen and never repeat back-to-back.
