# Citizen Connect

A Bengaluru-only community map for reporting and tracking public-infrastructure issues. The app has two parts:

- **Frontend** (`src/`): React, JavaScript, Tailwind CSS, Leaflet/OpenStreetMap, and an optional Google Maps JavaScript API adapter.
- **Backend** (`server/`): an Express REST API backed by PostgreSQL running in Docker. It stores reports and photos, hands out anonymous neighbour identities, and enforces **one vote per neighbour per report**.

## Hosting it for real people

Follow [docs/HOSTING_GUIDE.md](docs/HOSTING_GUIDE.md). It walks step by step through a free Neon database and a Render web service, custom domains, moderation, and maintenance. The whole product ships as one container (`Dockerfile`): the API serves the built web app.

## Start here if you are new

Read [docs/BEGINNER_HANDOVER_GUIDE.md](docs/BEGINNER_HANDOVER_GUIDE.md). It explains the application using plain HTML/CSS/JavaScript concepts, walks through every core flow, and includes a suggested teaching session and beginner exercises. Its final section explains the backend.

For a college demonstration or viva, use [docs/COLLEGE_VIVA_QNA.md](docs/COLLEGE_VIVA_QNA.md). It contains simple answers to likely technical, architecture, privacy, testing, and future-scope questions, plus short opening and closing speeches.

## Run it

You need Node 22+ and Docker Desktop.

```bash
npm run setup      # installs frontend + server packages and creates both .env files



export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
npm run db:up



npm run dev:all    # starts the API (http://localhost:4000) and the web app (http://localhost:5173)
```

Open <http://localhost:5173>. The API creates its tables on first start and seeds five demo reports into an empty database.

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run dev:api` | Run only the web app, or only the API |
| `npm test` | Unit tests for the frontend rules and the server logic |
| `npm run lint` | ESLint for both the frontend and the server |
| `npm run db:shell` | Open `psql` inside the database container |
| `npm run db:reset` | Delete all data and start a fresh, re-seeded database |
| `npm run db:down` | Stop the database container (data is kept) |
| `docker compose --profile full up -d --build` | Run the API and web app inside Docker on port 4000 |
| `npm start` | Build the web app and serve it from the API (what hosting runs) |

### Maps

OpenStreetMap is the working no-key default. A styled offline preview is also included. To activate the optional Google Maps layer, add these values to `.env`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_browser_restricted_key
VITE_GOOGLE_MAP_ID=your_javascript_map_id
```

Enable **Maps JavaScript API** in the Google Cloud project. Restrict the key to your local and production HTTP referrers. `DEMO_MAP_ID` can be used during development.

## How "one vote per person" works

1. On first visit the web app calls `POST /v1/session`. The API creates an anonymous **neighbour** (shown as "Neighbour #1001") and returns a random secret token. The browser keeps the token in `localStorage` and sends it as `Authorization: Bearer …` on every request. The database stores only a SHA-256 hash of the token.
2. "This affects me" calls `POST /v1/issues/:id/votes`. The `issue_votes` table has a primary key on `(issue_id, user_id)`, so the database itself refuses a second vote from the same neighbour. The endpoint toggles: a second click removes the vote instead of adding another.
3. "I can confirm it is fixed" calls `POST /v1/issues/:id/resolution-votes`. Same rule, but it is one-way: once confirmed it stays confirmed. When confirmations reach the majority threshold (at least 3, and more than half of the affected count) the report becomes `resolved`.
4. The UI shows the neighbour's own state (`viewerHasVoted`, `viewerHasConfirmed`) and disables a button while its request is in flight, so even a fast double-click cannot send twice.

This identity is per browser, not per human: clearing site data or using another device creates a new neighbour. That is the right level for a pilot; a public launch should add phone or email verification on top of the same tables.

## API

| Method and path | Purpose |
| --- | --- |
| `POST /v1/session` | Create or confirm an anonymous neighbour; returns `{ token, user }` |
| `GET /v1/issues` | All reports, newest first, with the viewer's vote state |
| `GET /v1/issues/:id` | One report |
| `POST /v1/issues` | Publish a report (`title`, `description`, `category`, `position`, `photo` as a data URL). The reporter is counted as the first affected neighbour |
| `POST /v1/issues/:id/votes` | Toggle "This affects me" |
| `POST /v1/issues/:id/resolution-votes` | Confirm fixed (one per neighbour) |
| `POST /v1/issues/:id/flags` | Flag a report as fake or inappropriate (one per neighbour) |
| `GET /v1/civic-area?lat=…&lng=…` | Nearest locality, corporation, constituencies, and verified helpline |
| `GET /v1/photos/:id` | Report photos (stored in the database by default) |
| `GET /health` | Liveness check; also pings the database |
| `GET /v1/admin/issues?flagged=true` | Moderator: list reports with flag counts, including hidden ones |
| `POST /v1/admin/issues/:id/hide` | Moderator: `{ "hidden": true }` removes a report from public view |
| `POST /v1/admin/issues/:id/status` | Moderator: `{ "status": "in-progress" }` marks a report acknowledged |

Moderator endpoints need an `X-Admin-Token` header matching `ADMIN_TOKEN` in `server/.env`. Everything under `/v1` is rate limited per IP.

Errors are JSON: `{ "error": "message", "details": { field: "reason" } }`.

## Database

Any PostgreSQL 13+ works. Docker is just the zero-setup default. To use a hosted database such as **Neon** instead, set `DATABASE_URL` in `server/.env` to its connection string (keep `?sslmode=require`) and skip `npm run db:up`. The API creates the tables and seeds demo data on first start exactly as it does locally. Note that `npm run db:shell` and `npm run db:reset` only apply to the Docker database; for Neon use its SQL editor, or run `TRUNCATE issues, issue_votes, resolution_votes, users, localities RESTART IDENTITY CASCADE;` and restart the API to re-seed.

Tables are created by `server/sql/schema.sql` on every API start; neighbourhood reference data comes from `server/sql/seed-localities.sql` on every start, and the five demo reports come from `server/sql/seed-demo.sql` only when the `issues` table is empty and `SEED_DEMO_DATA` is not `false`.

- `users` — anonymous neighbours (`number` for the display name, `token_hash`)
- `issues` — reports with coordinates, address, locality, status, photo path, reporter
- `issue_votes` — one row per neighbour per report (primary key enforces it)
- `resolution_votes` — one row per neighbour per report
- `issue_flags` — one row per neighbour per flagged report
- `photos` — photo bytes (when `PHOTO_STORAGE=database`, the default)
- `localities` — approximate neighbourhood centres used for naming and the civic lookup

### Server environment variables (`server/.env`)

| Variable | Purpose |
| --- | --- |
| `PORT` | Port the API listens on (4000) |
| `DATABASE_URL` | PostgreSQL connection string (Docker or Neon) |
| `CORS_ORIGIN` | Browser origin(s) allowed to call the API, comma-separated. For Vite, include whichever port it selects (5173 or 5174). |
| `PHOTO_STORAGE` | `database` (default) or `disk` |
| `UPLOAD_DIR` | Folder for photos when using `disk` |
| `SEED_DEMO_DATA` | `false` in production so demo reports are never created |
| `ADMIN_TOKEN` | Secret for moderator endpoints; empty disables them |
| `TRUST_PROXY` | `1` behind a hosting proxy so rate limits see real IPs |
| `WEB_DIST` | Folder with the built web app (defaults to `../dist`) |

## What is wired

- Bengaluru-bounded map with issue markers, filters, search, selection, and geolocation
- Live-camera capture only (no gallery upload); photos are stored in the database
- Mandatory fresh browser geolocation for every report, validated on both client and server
- Reports persisted in PostgreSQL and visible to every visitor
- One vote and one resolution confirmation per neighbour, enforced by the database
- Majority-based resolution with live progress
- Shareable report links (`?issue=BLR-1042`) and a working share button
- Mobile report list and filter sheet, loading and offline states with retry
- "How it works" explainer, report flagging, and moderator hide/status endpoints
- One deployable container that serves both the API and the web app
- Responsive issue detail and area-authority contact panel
- Selectable OpenStreetMap, Google Maps, and offline preview layers

## Still required for a large public launch

Phone/email verification, a moderation UI (today moderators use the API with curl), notifications, audit history, automatic face/plate blurring, and authoritative ward/constituency polygons in PostGIS.

The civic-directory endpoint currently matches the **nearest known neighbourhood centre**, which is approximate. Only the GBA `1533` helpline is verified. Do not publish unverified personal numbers; prefer role-based official phone numbers and store source URL, retrieval date, and verification status with every contact. The full data model is in `docs/CIVIC_DATA_PLAN.md`.

OpenStreetMap data requires visible attribution. The default community tile service is appropriate for normal development and modest interactive use, but has no SLA and prohibits bulk download/offline prefetch. Configure `VITE_OSM_TILE_URL` with a suitable hosted OSM-derived provider or self-hosted tile service before significant production traffic.
