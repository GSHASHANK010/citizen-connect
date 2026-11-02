# Citizen Connect — Beginner Handover and Teaching Guide

This guide is for someone who already understands basic HTML, CSS, and JavaScript but has never worked with React, Tailwind CSS, Vite, browser location/camera APIs, interactive maps, a REST API, or a database.

Do not try to memorize everything. The goal is to understand how the pieces connect, run the project safely, make small changes, and know what must be added before a public launch.

---

## 1. What Citizen Connect does

Citizen Connect is a Bengaluru-only civic issue reporting app. It has a React frontend and a small Express + PostgreSQL backend.

A resident can:

1. View public-infrastructure issues on a map.
2. Search and filter those issues.
3. Open a report and see its details.
4. Say that an issue affects them (one vote per neighbour, and a second click removes it).
5. Confirm that an issue has been fixed.
6. Start a new report using a fresh live location and a live-camera photo.
7. See which public authority or elected representative handles the area.

Reports, votes, and photos are stored by the API in a PostgreSQL database, so every visitor sees the same data. Each browser gets an anonymous identity ("Neighbour #1001") and the database enforces one vote per neighbour per report. Neighbours can flag a report, a moderator with a secret token can hide it or mark it acknowledged, and the API has basic rate limits. It does **not** yet have verified user accounts (phone or email), automatic face or number-plate blurring, or official government boundary data.

---

## 2. Translate the technology into things you already know

If you know HTML, CSS, and JavaScript, you already know the foundation.

| New tool | Think of it as | What it does here |
| --- | --- | --- |
| React | JavaScript functions that return HTML-like markup | Breaks the screen into reusable components and refreshes the UI when data changes |
| JSX | HTML written inside JavaScript | Lets a component describe what should appear on screen |
| Tailwind CSS | Small predefined CSS utility classes | Styles elements using classes such as `flex`, `rounded-xl`, and `text-sm` |
| Vite | Development server and production bundler | Starts the local app and packages it for deployment |
| Leaflet | JavaScript map library | Displays and controls the OpenStreetMap layer |
| OpenStreetMap | Open geographic map data | Supplies the default Bengaluru map tiles |
| Google Maps JavaScript API | Optional proprietary map provider | Supplies an alternative map after a key is configured |
| Express | A small Node.js web-server library | Receives HTTP requests from the browser and answers with JSON (the API in `server/`) |
| PostgreSQL | A real database, like a set of spreadsheets with strict rules | Stores users, reports, votes, flags, and photo bytes so everyone sees the same data |
| Docker / docker-compose | A way to run software in a sealed box | Runs PostgreSQL 16 on your laptop without installing it by hand; the root `Dockerfile` packs the whole app into one container for hosting |
| `localStorage` | A tiny browser-only key/value store | Remembers this browser's session token and preferred map provider |

The browser still receives normal HTML, CSS, and JavaScript. Vite and React simply help us organize and build them. The backend is also plain JavaScript, run by Node.js instead of a browser.

---

## 3. Install and run the project

### What must be installed

- Node.js 22 or newer.
- Docker Desktop (it runs the PostgreSQL database).
- A code editor such as Visual Studio Code.
- A modern browser such as Chrome, Edge, Firefox, or Safari.
- A terminal.

Check Node.js and npm:

```bash
node --version
npm --version
```

### First run

Open the project folder in a terminal:

```bash
cd /Users/shyam-gururaja/Documents/projects/project-learning
npm run setup      # installs frontend and server packages, creates .env and server/.env
npm run db:up      # starts PostgreSQL 16 in Docker
npm run dev:all    # starts the API and the web app together
```

Two addresses are printed:

```text
http://localhost:4000   the API (try http://localhost:4000/health)
http://localhost:5173   the web app
```

Open the second address in the browser. On every start the API creates the database tables and refreshes the locality list. When the `issues` table is empty it also inserts five demo reports (unless `SEED_DEMO_DATA=false`).

Stop both servers with `Ctrl+C` in the terminal. The database keeps running in Docker until you run `npm run db:down`; your data survives.

### Useful commands

```bash
npm run dev:all
```

Starts the API and the web app. Both restart when their code changes. Use `npm run dev` for only the web app or `npm run dev:api` for only the API.

```bash
npm run db:up
npm run db:down
npm run db:reset
```

Start the database, stop it (data kept), or delete all data and start fresh with the demo reports.

```bash
npm run db:shell
```

Opens `psql`, a terminal inside the database, so you can look at tables directly.

```bash
npm test
```

Runs the frontend rule tests (`test/issues.test.js`) and the server logic tests (`server/test/logic.test.js`) with Node's built-in `node --test`.

```bash
npm run lint
```

Checks JavaScript and React code for common errors in both the frontend and the server.

```bash
npm run build
```

Creates an optimized production build in `dist/`.

```bash
npm run preview
```

Previews the production build locally after `npm run build`.

```bash
npm start
```

Builds the web app and starts the API as one service. The API serves the built `dist/` folder and the `/v1` endpoints from the same address, which is how the hosted version runs. `npm run docker:build` builds the same thing as a Docker image using the root `Dockerfile`.

Run lint, tests, and build before handing work to another developer:

```bash
npm run lint && npm test && npm run build
```

---

## 4. Project map

```text
project-learning/
├── index.html                 Browser entry page
├── package.json               Frontend dependencies and all npm commands
├── docker-compose.yml         Runs PostgreSQL 16 (and optionally the API) in Docker
├── Dockerfile                 Builds the web app and API into one container for hosting
├── .dockerignore              Files left out of the Docker image
├── vite.config.js             Vite configuration
├── tailwind.config.js         Tailwind theme and file scanning
├── postcss.config.js          CSS processing configuration
├── .env.example               Frontend environment-variable template
├── .env.production            Production build: VITE_API_URL is empty (same origin)
├── README.md                  Short project overview
├── docs/
│   ├── BEGINNER_HANDOVER_GUIDE.md
│   ├── COLLEGE_VIVA_QNA.md
│   ├── CIVIC_DATA_PLAN.md
│   └── HOSTING_GUIDE.md       Step by step: Neon database + Render web service
├── test/
│   └── issues.test.js         Frontend rule tests (node --test)
├── server/                    The backend: Express REST API
│   ├── package.json           Server dependencies (express, pg, cors, helmet, express-rate-limit)
│   ├── .env.example           Server environment-variable template
│   ├── Dockerfile             Lets the API alone run in Docker
│   ├── sql/
│   │   ├── schema.sql         Creates the tables (safe to run every start)
│   │   ├── seed-localities.sql  Locality rows; runs every start (ON CONFLICT keeps it idempotent)
│   │   └── seed-demo.sql      Five demo reports; only when `issues` is empty
│   ├── src/
│   │   ├── index.js           Boot: wait for DB, migrate, seed localities, seed demo, listen
│   │   ├── app.js             Express setup, helmet, rate limits, CORS, routes, serves dist/
│   │   ├── db.js              pg Pool, runMigrations, seedLocalities, seedDemoDataIfEmpty, withTransaction
│   │   ├── lib/
│   │   │   ├── auth.js        Session tokens, SHA-256 hashing, requireAdmin
│   │   │   ├── errors.js      Consistent { error, details } responses
│   │   │   ├── geo.js         Bengaluru bounds and nearest-locality maths
│   │   │   ├── issues.js      Validation, SQL select, resolution threshold
│   │   │   └── photos.js      Decodes photo data URLs into the photos table (or files)
│   │   └── routes/
│   │       ├── session.js     POST /v1/session
│   │       ├── issues.js      GET/POST /v1/issues, the vote endpoints, POST /v1/issues/:id/flags
│   │       ├── photos.js      GET /v1/photos/:id (photo bytes from the database)
│   │       ├── admin.js       Moderator endpoints under /v1/admin (need X-Admin-Token)
│   │       └── civic.js       GET /v1/civic-area
│   ├── test/logic.test.js     Server logic tests
│   └── uploads/               Report photos, only when PHOTO_STORAGE=disk
└── src/                       The frontend: React app
    ├── main.jsx               Mounts React into index.html, wrapped in ErrorBoundary
    ├── App.jsx                Main state, API calls, and screen composition
    ├── styles.css             Tailwind imports and custom CSS
    ├── components/            Reusable interface pieces
    │   ├── AppHeader.jsx      Brand, "How it works" button, and report button
    │   ├── HowItWorksModal.jsx  Short explanation of the app, opened from the header
    │   ├── ErrorBoundary.jsx  Shows a friendly message if React crashes
    │   ├── IssueSidebar.jsx   Search, filters, and issue list; overlay mode on mobile
    │   ├── IssueCard.jsx      One report in the list (filled vote button when voted)
    │   ├── IssueDetail.jsx    Selected report, vote buttons, Share, "Flag this report"
    │   ├── MapOverlays.jsx    Controls over the map, mobile List/filter buttons, load-error banner
    │   ├── MapView.jsx        Chooses the active map provider
    │   ├── ReportModal.jsx    Two-step report flow; awaits the API
    │   └── report/
    │       ├── ReportEvidenceStep.jsx
    │       └── ReportDetailsStep.jsx
    ├── data/issues.js         Categories and fallback representative contacts
    └── lib/                   Plain rules, browser APIs, and adapters
        ├── api.js             Every call to the backend (fetch + JSON); picks the API address
        ├── issues.js          Filtering, replaceIssue, formatRelativeTime, threshold fallback
        ├── location.js        Fresh browser location and bounds check
        ├── civicDirectory.js  Civic lookup adapter with sample fallback
        └── storage.js         Session token in localStorage
```

Start reading in this order:

1. `src/main.jsx`
2. `src/App.jsx`
3. `src/lib/api.js`
4. `src/lib/issues.js`
5. `src/components/IssueSidebar.jsx`
6. `src/components/IssueCard.jsx`
7. `src/components/MapView.jsx`
8. `src/components/ReportModal.jsx`
9. `src/components/report/ReportEvidenceStep.jsx`
10. `server/sql/schema.sql`
11. `server/src/routes/issues.js`
12. The other files inside `src/lib/` and `server/src/`

That order moves from the big picture into individual features.

---

## 5. How the app starts

The browser loads `index.html`. That file contains this empty element:

```html
<div id="root"></div>
```

It also loads `src/main.jsx`. React finds `#root` and renders the `App` component inside it:

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
```

`ErrorBoundary` (`src/components/ErrorBoundary.jsx`) catches a crash inside `App` and shows a friendly message instead of a blank page.

The final browser page can be pictured as:

```text
index.html
└── #root
    └── ErrorBoundary
        └── App
            ├── Header and brand
            ├── Issue list (a sliding overlay on small screens)
            ├── MapView
            ├── IssueDetail
            ├── HowItWorksModal (only when opened)
            └── ReportModal (only while reporting)
```

React components begin with capital letters. `<App />` means “run the `App` function and display the JSX it returns.”

---

## 6. A five-minute React lesson using Citizen Connect

### A component is a function

```jsx
function Greeting() {
  return <h1>Hello Bengaluru</h1>
}
```

Citizen Connect uses the same idea. Large screens are divided into named pieces such as `AppHeader`, `IssueSidebar`, `MapOverlays`, and `IssueCard`. Each component has one main job.

### Props are function arguments

Parent components pass information to child components:

```jsx
<IssueCard issue={issue} onVote={vote} />
```

The child receives it:

```jsx
function IssueCard({ issue, onVote }) {
  // issue contains the report
  // onVote is a function supplied by the parent
}
```

Think of props as HTML attributes that can carry any JavaScript value.

### State is information that can change the screen

`App.jsx` contains state such as:

```jsx
const [issues, setIssues] = useState(...)
const [selectedId, setSelectedId] = useState(null)
const [reportOpen, setReportOpen] = useState(false)
```

- `issues` is the current value.
- `setIssues` changes it.
- React redraws the affected UI after the change.

Never change React state directly:

```js
// Wrong
issues.push(newIssue)

// Correct
setIssues((current) => [newIssue, ...current])
```

### Events look similar to normal JavaScript

```jsx
<button onClick={() => setReportOpen(true)}>
  Report an issue
</button>
```

This is the React version of adding a click event listener.

### Lists need stable keys

```jsx
visibleIssues.map((issue) => (
  <IssueCard key={issue.id} issue={issue} />
))
```

The `key` helps React identify which item changed. Use a stable report ID, not a random number.

### Effects synchronize with something outside React

`useEffect` is used when React must synchronize with a browser API, map library, network request, or storage.

Examples in this project:

- Load every report from the API when the app opens.
- Create and destroy a Leaflet map.
- Add markers when issues change.
- Look up civic-directory data when a report is selected.

---

## 7. Styling with Tailwind CSS

This JSX:

```jsx
<button className="rounded-xl bg-moss px-4 py-2 text-white">
  Report
</button>
```

roughly means:

```css
button {
  border-radius: 0.75rem;
  background: #315c45;
  padding: 0.5rem 1rem;
  color: white;
}
```

Common classes in the project:

| Tailwind class | Meaning |
| --- | --- |
| `flex` | `display: flex` |
| `grid` | `display: grid` |
| `items-center` | Vertically align flex/grid children |
| `justify-between` | Put free space between children |
| `gap-2` | Add a small gap between children |
| `p-4` | Padding on every side |
| `px-4` | Horizontal padding |
| `py-2` | Vertical padding |
| `rounded-xl` | Large rounded corners |
| `bg-white` | White background |
| `text-sm` | Small text |
| `font-extrabold` | Heavy font weight |
| `hidden md:flex` | Hidden on small screens; flex at the `md` breakpoint |

Project-specific colors such as `moss`, `paper`, `ink`, and `alert` are declared in `tailwind.config.js`.

Custom map-marker styles and animations live in `src/styles.css` because they are easier to express as ordinary CSS.

---

## 8. The main data model

Reports come from the API (`GET /v1/issues`). The five demo reports are inserted by `server/sql/seed-demo.sql` when the `issues` table is empty. A report in React state looks like:

```js
{
  id: 'BLR-1042',
  title: 'Deep pothole near 12th Main',
  description: 'Large pothole in the left lane...',
  category: 'pothole',
  status: 'open',
  votes: 38,
  resolvedVotes: 2,
  resolutionThreshold: 20,
  createdAt: '2026-10-07T06:15:00.000Z',
  address: '12th Main Rd, Indiranagar',
  locality: 'Indiranagar',
  position: { lat: 12.9718, lng: 77.6412, accuracy: 12 },
  photo: 'http://localhost:4000/v1/photos/3f2c...',
  reporter: 'Neighbour #1001',
  isMine: false,
  viewerHasVoted: true,
  viewerHasConfirmed: false,
  viewerHasFlagged: false
}
```

Important fields:

- `id`: unique report identifier, generated by a database sequence (`BLR-1100`, `BLR-1101`, ...).
- `category`: must match an ID in `CATEGORIES` (frontend) and `CATEGORY_IDS` (server).
- `status`: `open`, `in-progress` (shown as "Acknowledged"; set by a moderator), or `resolved`.
- `votes`: neighbours who say the issue affects them. Counted from the `issue_votes` table.
- `resolvedVotes`: neighbours who confirm it is fixed. Counted from `resolution_votes`.
- `resolutionThreshold`: how many confirmations are needed. Calculated on the server.
- `createdAt`: an ISO timestamp. `formatRelativeTime` in `src/lib/issues.js` turns it into "Just now" or "18 min ago".
- `position`: latitude and longitude used by every map provider.
- `photo`: URL of the photo served by the API. By default it is `/v1/photos/<id>`, read from the `photos` table. With `PHOTO_STORAGE=disk` it is `/uploads/<uuid>.jpeg`. `src/lib/api.js` prefixes it with the API address.
- `reporter`: the anonymous display name of whoever reported it.
- `viewerHasVoted`, `viewerHasConfirmed`, `viewerHasFlagged`, `isMine`: tell the UI what *this* browser has already done. The server fills them in from the session token.

The frontend never invents these values. It displays what the server returns.

Keeping a provider-neutral `{ lat, lng }` position is important. It lets the same issue data work with OpenStreetMap, Google Maps, or a future map provider.

---

## 9. How the screen data flows

`App.jsx` owns the important shared state. Child components receive data and send events back through functions.

```mermaid
flowchart TD
    A["App.jsx owns issues, filters, selection and user position"]
    A --> B["IssueCard receives one issue"]
    A --> C["MapView receives visible issues"]
    A --> D["IssueDetail receives selected issue"]
    A --> E["ReportModal creates a report"]
    B -->|"onVote / onSelect"| A
    C -->|"marker selected / locate"| A
    D -->|"vote / resolution vote / flag / close"| A
    E -->|"fresh location / completed report"| A
    A <-->|"fetch + JSON (src/lib/api.js)"| S["Express API + PostgreSQL"]
```

This design is called “lifting state up.” Shared information stays in the nearest common parent instead of being duplicated in several components.

`App.jsx` is also the only place that talks to the backend. It calls the helpers in `src/lib/api.js`, waits for the JSON reply, and then updates state. Child components never call `fetch` themselves.

---

## 10. How filtering works

`App.jsx` stores:

- `activeCategory`
- `activeStatus`
- `search`

It derives `visibleIssues` with `useMemo`. Each report must pass the category, status, and search checks.

This is an important pattern:

```text
all issues + current filters = visible issues
```

We do not store `visibleIssues` as separate state because it can always be calculated from existing state. This avoids two copies becoming inconsistent.

---

## 11. How the map providers work

`src/components/MapView.jsx` is the map switchboard.

It chooses one of:

- `OpenStreetMap.jsx`: default working provider.
- `GoogleMap.jsx`: enabled when a Google key exists.
- `MockMap.jsx`: offline visual preview.

All three receive the same props:

```jsx
{
  issues,
  selectedId,
  onSelect,
  onLocate,
  userPosition
}
```

That common contract makes providers replaceable.

### OpenStreetMap and Leaflet

`OpenStreetMap.jsx`:

1. Creates a Leaflet map after the component appears.
2. Loads map tiles from the configured tile URL.
3. Restricts navigation to the Bengaluru region.
4. Creates an issue marker for each visible issue.
5. Creates a blue live-location marker when `userPosition` exists.
6. Uses `flyTo` to center the map on a new live location.
7. Removes the map when the component disappears.

OpenStreetMap data requires visible attribution. Do not remove the attribution control.

The public `tile.openstreetmap.org` service is suitable for normal development and modest interactive traffic. It is not an unlimited production tile host. A serious deployment should configure a suitable hosted OSM-derived provider or self-hosted service using `VITE_OSM_TILE_URL`.

### Google Maps

`GoogleMap.jsx` uses `src/lib/googleMaps.js` to load Google’s script only when needed.

It requires:

- A Google Cloud project.
- Billing configured in Google Cloud.
- Maps JavaScript API enabled.
- A browser-restricted API key.
- A JavaScript map ID for Advanced Markers.

The app still runs without these values because OpenStreetMap is the default.

---

## 12. The mandatory live-location flow

The location helper is in `src/lib/location.js`.

```mermaid
sequenceDiagram
    actor Resident
    participant Modal as ReportModal
    participant Browser as Browser Geolocation
    participant App
    participant Map

    Resident->>Modal: Starts a new report
    Resident->>Modal: Selects Allow location
    Modal->>Browser: Requests a fresh high-accuracy position
    Browser-->>Modal: Latitude, longitude, accuracy, timestamp
    Modal->>Modal: Checks Bengaluru bounds
    alt Inside Bengaluru
        Modal->>App: onLocationCaptured(position)
        App->>Map: userPosition prop changes
        Map->>Map: Show blue marker and recenter
        Modal->>Modal: Enable progress after photo is captured
    else Outside Bengaluru or unavailable
        Modal->>Resident: Show error and keep progress disabled
    end
```

Important behavior:

- Every new report begins without a location.
- The location used elsewhere on the map is never silently reused for a report.
- `maximumAge: 0` tells the browser not to return an intentionally cached reading.
- A fresh location is pushed to `App` immediately, so the blue map marker appears.
- Reports outside the current Bengaluru bounding box are rejected.
- The report cannot continue until it has both a photo and a valid location.

Browsers may remember that the user already granted permission. The application cannot force the browser to show the permission popup every time, but it still requests a fresh reading for every report.

Location and camera generally require `https://` in production. Browsers allow them on `localhost` during development.

---

## 13. The live-camera flow

The camera code is in `src/components/report/ReportEvidenceStep.jsx`. `ReportModal.jsx` only coordinates the current step, form data, photo, and position.

It requests:

```js
navigator.mediaDevices.getUserMedia({
  video: { facingMode: { ideal: 'environment' } },
  audio: false,
})
```

This means:

- Request a camera video stream.
- Prefer the outward-facing phone camera.
- Never request microphone audio.

When the resident presses the shutter:

1. A temporary `<canvas>` is created.
2. The current video frame is drawn onto it.
3. The image is resized to a maximum width of 960 pixels.
4. It is converted to a compressed JPEG data URL.
5. Camera tracks are stopped immediately.

There is deliberately no file-picker or gallery upload. The evidence must come from the live camera.

Always stop camera tracks when the modal closes. Otherwise, the browser may keep the camera active.

For a public launch, add automatic face and vehicle-number-plate blurring before making photos public.

---

## 14. Creating a report

The report modal has two stages.

### Stage 1: evidence

- Capture a live photo.
- Request a fresh live position.
- Confirm that the position is inside Bengaluru.

### Stage 2: details

- Choose a category.
- Enter a short title.
- Enter a description.
- Publish the report.

`ReportModal` awaits `onSubmit(report)`. `App.jsx` handles it in `handleCreateIssue`:

1. Calls `createIssue` in `src/lib/api.js`, which sends `POST /v1/issues` with the title, description, category, position, and photo data URL.
2. The server validates everything again, stores the photo (in the `photos` table by default), inserts a row in PostgreSQL, and replies with the finished report (ID, status, timestamps, reporter name).
3. Adds the server's copy to the front of the issues array.
4. Updates the map's live-location marker.
5. Selects the new report so its details open.

If the server rejects the report (for example, a title that is too short), `createIssue` throws an `ApiError` whose `details` names each bad field. `ReportModal` catches it and shows those messages under the fields. The browser state is never treated as authoritative.

---

## 15. Voting and community resolution

There are two different votes, and both are stored on the server:

- “This affects me” calls `POST /v1/issues/:id/votes`. It **toggles**: the first click adds a row to `issue_votes`, a second click removes it. The button shows filled when `viewerHasVoted` is true.
- “I can confirm it is fixed” calls `POST /v1/issues/:id/resolution-votes`. It is **one-way**: it inserts a row in `resolution_votes`, and repeating the call changes nothing (`ON CONFLICT DO NOTHING`).

Both tables have `PRIMARY KEY (issue_id, user_id)`. That single rule is what makes one vote per neighbour per report impossible to break, even if two requests arrive at the same instant. The reporter automatically receives the first affected vote when a report is created.

The resolution threshold is calculated on the server (`getResolutionThreshold` in `server/src/lib/issues.js`):

```js
Math.max(3, Math.floor(votes / 2) + 1)
```

This means a report needs:

- At least three fix confirmations.
- More than half of its affected-user votes.

Example: an issue with 38 affected votes needs 20 fix confirmations.

After each confirmation, the server counts both tables inside a transaction. When confirmations reach the threshold, it sets `status = 'resolved'` and records `resolved_at`. The response carries the updated issue, and `App.jsx` swaps it into state with `replaceIssue`. The frontend keeps a copy of the formula only as a display fallback; it prefers the `resolutionThreshold` the server sends.

While a vote request is in flight, `App.jsx` keeps the issue ID in `pendingIssueIds` and the button is disabled. That stops a fast double-click from sending two requests.

What the backend enforces today:

- One vote of each type per neighbour per report (database primary key).
- Status changes only on the server.
- No vote counts accepted from the browser; they are always counted from the tables.

What is still missing for a public launch:

- Verified identity (phone or email). Today identity is one anonymous token per browser.
- Stronger bot protection. Today there are only per-IP rate limits (see the backend section).
- An audit trail.
- Rules for reopening incorrectly resolved reports.

Never trust a vote count sent directly by the browser. The server does not; it counts rows.

---

## 16. Browser storage

Reports no longer live in the browser. `src/lib/storage.js` now has only two functions, `loadSessionToken` and `saveSessionToken`, which keep the session token under the `localStorage` key `citizen-connect-session-v1`. `MapView.jsx` also remembers the preferred map provider in `localStorage`.

`localStorage`:

- Exists only inside one browser profile on one device.
- Is not shared with other residents.
- Can be cleared by the user.
- Has a small storage limit.
- Is not a database.

That is exactly why it is a good fit for the session token and nothing more. The token is this browser's identity. If the user clears site data, the browser simply asks the API for a new identity on the next visit and becomes a new "Neighbour #N".

Anything that other residents must see (reports, votes, photos) belongs in PostgreSQL. See the backend section near the end of this guide.

---

## 17. Civic directory: ward, MLA, MP, and GBA contacts

`src/lib/civicDirectory.js` is the frontend adapter. It calls `fetchCivicArea` in `src/lib/api.js`, which asks the same Express API:

```text
GET /v1/civic-area?lat=...&lng=...
```

The server (`server/src/routes/civic.js`) finds the nearest row in the `localities` table and returns that neighbourhood's corporation, Assembly constituency, Parliamentary constituency, and the verified GBA helpline. It also returns a `verificationNote` explaining that this is a nearest-centre match, not an official boundary. `IssueDetail` shows that note.

If the API cannot be reached, the adapter falls back to `SAMPLE_REPRESENTATIVES` from `src/data/issues.js`, clearly labelled as sample data.

Why coordinates instead of a locality text box?

Neighbourhood names are informal and overlap. Administrative boundaries are polygons. The correct question is:

```text
Which official polygons contain this latitude and longitude?
```

The current lookup is approximate. A later version should perform point-in-polygon checks for:

- GBA ward and city corporation.
- Karnataka Assembly Constituency for the MLA.
- Parliamentary Constituency for the MP.
- Department responsibility based on issue category.

The complete database and source plan is in `docs/CIVIC_DATA_PLAN.md`.

Only publish phone numbers that an official government source explicitly makes available for public contact. Store a source URL and verification date with every contact.

---

## 18. Environment variables and API keys

Environment variables keep deployment-specific values outside source code.

There are two `.env` files. `npm run setup` creates both from their `.env.example` templates. You can also copy them by hand:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Frontend values (`.env`):

```env
VITE_GOOGLE_MAPS_API_KEY=
VITE_GOOGLE_MAP_ID=DEMO_MAP_ID
VITE_OSM_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_API_URL=http://localhost:4000
```

Server values (`server/.env`):

```env
PORT=4000
DATABASE_URL=postgres://citizen:citizen_dev_password@localhost:5432/citizen_connect
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=./uploads
PHOTO_STORAGE=database
SEED_DEMO_DATA=true
ADMIN_TOKEN=
TRUST_PROXY=
WEB_DIST=
```

`VITE_API_URL` must point at the port in `PORT`, and `CORS_ORIGIN` must be the address the web app is opened from. Otherwise the browser will refuse to talk to the API.

`VITE_API_URL` has sensible defaults in `src/lib/api.js`: `http://localhost:4000` during `npm run dev`, and empty (same origin) in a production build. `.env.production` sets it empty on purpose, because the API serves the built web app itself.

The five production settings:

- `PHOTO_STORAGE`: `database` (default) keeps photo bytes in the `photos` table; `disk` writes files under `UPLOAD_DIR`.
- `SEED_DEMO_DATA`: set to `false` in production so the five demo reports are never inserted.
- `ADMIN_TOKEN`: the secret for the `/v1/admin` moderation endpoints. Empty means they answer `503`.
- `TRUST_PROXY`: set to `1` behind a hosting proxy (such as Render) so rate limits see real visitor IPs.
- `WEB_DIST`: folder with the built web app; defaults to `../dist`.

Restart `npm run dev:all` after changing either file.

### Important key rule

A Google Maps browser key will be visible in the browser. That is normal for this API. Security comes from restricting it in Google Cloud:

- Restrict it to the Maps JavaScript API.
- Restrict HTTP referrers to localhost and approved production domains.
- Do not use the same key for unrestricted server APIs.
- Configure billing alerts and quotas.

Never commit `.env`; it is already ignored by Git. `ADMIN_TOKEN` is a real secret: it lives only in `server/.env` or the hosting provider's settings.

---

## 19. Safe beginner changes

### Change the application subtitle

Open `src/components/Brand.jsx` and edit:

```jsx
Bengaluru, together
```

### Change a theme color

Open `tailwind.config.js` and change a color under `colors`:

```js
moss: '#315c45'
```

Because many components use `bg-moss` and `text-moss`, the change updates the design consistently.

### Add a new issue category

Open `src/data/issues.js` and add an item to `CATEGORIES`:

```js
{
  id: 'water-leak',
  label: 'Water leak',
  icon: 'droplets',
  color: '#347da3'
}
```

The ID must be unique. Existing category buttons and report choices are generated from this array.

The server checks categories too. Add the same ID to `CATEGORY_IDS` in `server/src/lib/issues.js`, or the API will reject reports in the new category with "Unknown category."

### Add a demo issue

Add a row to the `issues` insert in `server/sql/seed-demo.sql` with a unique ID and a valid Bengaluru coordinate. The seed only runs when the `issues` table is empty, so run `npm run db:reset` to see it.

### Change Bengaluru bounds

Update `BENGALURU_BOUNDS` in `src/lib/location.js`. Also update map restrictions in `OpenStreetMap.jsx` and `GoogleMap.jsx` so validation and navigation remain consistent.

For production, replace the rough rectangle with an official GBA polygon check on the backend.

### Change the resolution rule

The rule that matters is `getResolutionThreshold` in `server/src/lib/issues.js`. The server uses it to decide when a report becomes resolved and sends the result to the browser as `resolutionThreshold`. The frontend's copy in `src/lib/issues.js` is only a fallback for display, so change the server first and keep the two in step. The tests in `server/test/logic.test.js` and `test/issues.test.js` will tell you if they disagree.

---

## 20. Debugging checklist

### The app does not start

Run:

```bash
npm run setup
npm run db:up
npm run dev:all
```

Read the first terminal error. It often names the exact file and line. Lines from the API are prefixed `api`, lines from Vite are prefixed `web`.

### The page says "Cannot reach the Citizen Connect API"

- Is the API running? Open `http://localhost:4000/health`; it should answer `{"ok":true,"database":"up","photoStorage":"database"}`. The health check runs `SELECT 1`, so `"database":"down"` means the API is up but cannot reach PostgreSQL.
- Is Docker Desktop running and the database up? Run `npm run db:up`.
- Does `VITE_API_URL` in `.env` match `PORT` in `server/.env`?
- Does `CORS_ORIGIN` in `server/.env` match the address in the browser (normally `http://localhost:5173`)?
- Press **Retry** in the banner after fixing the cause.

### The API fails to start with a database error

- Start Docker Desktop, then `npm run db:up`.
- Check `DATABASE_URL` in `server/.env`.
- If the schema looks broken, `npm run db:reset` deletes everything and re-seeds the demo reports.

### Votes stopped working after a database reset

The browser's old session token is unknown to the fresh database. The API answers `401`, `src/lib/api.js` forgets the token, and the next request creates a new neighbour. Reload the page once.

### A blank page appears

Open the browser developer tools and check the Console. Common causes:

- A missing import.
- A misspelled component name.
- Invalid JSX, such as a missing closing tag.
- Calling a function or reading a property that does not exist.

### Styles do not update

- Confirm the class exists and is spelled correctly.
- Confirm the file is inside a path scanned by `tailwind.config.js`.
- Restart the development server after editing configuration files.

### Location does not work

- Test on `localhost` or HTTPS.
- Check browser site permissions.
- Confirm device location services are enabled.
- Confirm the location is inside the current Bengaluru bounds.
- Wait outdoors or near a window for better mobile GPS accuracy.
- Confirm `onLocationCaptured` updates `userPosition` in `App.jsx`.

### Location is captured but no blue marker appears

Trace this path:

```text
ReportEvidenceStep.requestFreshLocation
→ onLocationCaptured(freshPosition)
→ App.setUserPosition
→ MapView userPosition prop
→ OpenStreetMap / GoogleMap marker effect
```

Use React Developer Tools or temporary `console.log` statements to see where the value stops.

### Camera does not work

- Use `localhost` or HTTPS.
- Check camera permission.
- Close other apps using the camera.
- Confirm the browser supports `navigator.mediaDevices.getUserMedia`.
- On a desktop without a rear camera, the normal webcam may be selected.

### OpenStreetMap is blank

- Check the internet connection.
- Look for blocked tile requests in the browser Network tab.
- Confirm `VITE_OSM_TILE_URL` is a valid template.
- Keep the attribution visible.

### Google Maps is disabled

- Add the key to `.env`.
- Enable Maps JavaScript API.
- Add a map ID.
- Check HTTP-referrer restrictions.
- Restart Vite after changing `.env`.

### Always finish with

```bash
npm run lint && npm test && npm run build
```

Fix errors before considering the change finished.

---

## 21. What the frontend must never be trusted to enforce

Anything running in a user’s browser can be modified by that user. The frontend must not be the final authority for:

- Identity.
- Votes.
- Resolution status.
- Report ownership.
- Image safety.
- Bengaluru boundary enforcement.
- Official contact information.
- Rate limits.
- Moderation decisions.

The frontend is responsible for a helpful interface and early validation. The backend in `server/` independently validates every important action: it re-checks title and description lengths, the category, and the Bengaluru bounds; counts votes from its own tables; applies rate limits; hides flagged reports only when a moderator says so; and decides status changes itself.

---

## 22. Production architecture

The current code already has the first slice of this picture: a React frontend, an Express API, PostgreSQL (which also holds the photos), and a small moderation API (flags, hide, status). The boxes below that do not exist yet are PostGIS polygons, private object storage, automatic redaction, and notifications.

```mermaid
flowchart LR
    U["Resident browser"] --> F["Citizen Connect React frontend"]
    F --> API["Authenticated backend API"]
    API --> DB["PostgreSQL + PostGIS"]
    API --> IMG["Private image storage"]
    API --> MOD["Moderation and redaction pipeline"]
    API --> NOTIFY["Notifications"]
    ETL["Reviewed government-data importer"] --> DB
    DB --> API
```

Recommended production responsibilities:

### Frontend

- Interface and accessibility.
- Camera and live-location permission flow.
- Client-side previews and early validation.
- Map display.
- Authentication screens.

### Backend API

- Authentication and authorization (today: anonymous session tokens; later: verified accounts).
- Report creation and validation (done).
- Unique voting (done, via the database primary key).
- Resolution state transitions (done).
- Rate limits (done, basic per-IP limits with `express-rate-limit`); stronger bot protection (not yet).
- Flagging and moderation (done, first version: `issue_flags` plus token-protected `/v1/admin` endpoints).
- Civic-area lookup (done, approximate nearest-locality version).
- Audit logging (not yet).

### PostgreSQL with PostGIS

- Reports, vote, and flag records (done).
- Photo bytes in the `photos` table (done, default mode).
- User/report relationships (done).
- Ward, Assembly, and Parliamentary polygons (not yet; the `localities` table holds approximate centres).
- Spatial queries (not yet).
- Versioned civic contacts (not yet).

### Object storage

- Today photos are rows in the `photos` table, served at `/v1/photos/<id>` (or files under `UPLOAD_DIR` when `PHOTO_STORAGE=disk`). That keeps the API stateless, which is enough for a pilot; a large deployment would move the bytes to object storage.
- Original evidence images kept private.
- Moderated/redacted public images.
- Signed upload and download URLs.

### Moderation pipeline

- Face and number-plate detection/redaction.
- Duplicate report detection.
- Unsafe-content checks.
- Human review queue (first version done: neighbours flag, a moderator lists flagged reports and hides them with `curl`; a proper review screen is not built).

---

## 23. Privacy, safety, and abuse checklist

Before public launch:

- Explain why location and camera access are needed before requesting them.
- Collect the minimum required data.
- Do not publish a reporter’s precise identity.
- Strip unnecessary photo metadata.
- Blur faces and vehicle plates.
- Provide block, appeal, and correction tools (flagging a report already exists).
- Add a retention and deletion policy.
- Prevent automated votes (duplicate votes are already blocked by the database).
- Rate-limit report creation (done: 12 new reports per hour per IP).
- Keep administrator actions in an audit log.
- Clearly label community-submitted information.
- Show source and verification dates for government contacts.
- Obtain legal/privacy review appropriate for India and the intended organization.

---

## 24. Suggested teaching session

Use this order when explaining the project to a beginner.

### Part 1 — Run and explore, 15 minutes

1. Start the database and both servers with `npm run db:up` and `npm run dev:all`.
2. Open the app.
3. Filter issues.
4. Open an issue.
5. Switch map providers.
6. Open the report flow without granting real permissions if demonstrating on someone else’s device.

Goal: understand the product before reading code.

### Part 2 — Connect React to familiar concepts, 20 minutes

1. Show `index.html` and `#root`.
2. Show `main.jsx` mounting `<App />`.
3. Compare a React component with an HTML section.
4. Explain props with `IssueCard`.
5. Explain state with `reportOpen`.
6. Change one piece of visible text and watch Vite update the page.

Goal: remove the mystery around React.

### Part 3 — Follow one issue through the app, 20 minutes

1. Find the demo issue in `server/sql/seed-demo.sql`, then see it arrive as JSON in the browser's Network tab (`GET /v1/issues`).
2. See it rendered by `IssueCard`.
3. See it passed to `MapView`.
4. Click it and see `selectedId` change.
5. See `IssueDetail` receive the selected issue.

Goal: understand one-way data flow.

### Part 4 — Follow location and camera, 20 minutes

1. Start at the Allow location button.
2. Follow `findLocation` into `getCurrentPosition`.
3. Follow `onLocationCaptured` back to `App`.
4. Follow `userPosition` into `OpenStreetMap`.
5. Read the camera request and canvas capture.
6. Explain why permissions need localhost or HTTPS.

Goal: understand React interacting with browser APIs.

### Part 5 — Follow one vote to the database, 20 minutes

1. Click “This affects me” and watch `POST /v1/issues/:id/votes` in the Network tab.
2. Open `server/src/routes/issues.js` and read the toggle (delete, else insert).
3. Open `server/sql/schema.sql` and point at `PRIMARY KEY (issue_id, user_id)`.
4. Run `npm run db:shell` and `SELECT * FROM issue_votes;` to see the row appear and disappear.
5. Show the session token in DevTools → Application → Local Storage, and explain that the database only stores its hash.

Goal: understand that the database, not React, enforces the rule.

### Part 6 — Explain pilot versus production, 10 minutes

1. Explain why one token per browser is not a verified person.
2. Open `CIVIC_DATA_PLAN.md`.
3. Draw the production architecture.
4. Identify what is still missing: verification, automatic photo redaction, a moderation screen, PostGIS polygons.

Goal: teach responsible system boundaries.

---

## 25. Beginner exercises

Do these in order. Run lint and build after each exercise.

### Exercise 1: text change

Change the brand subtitle and page title.

You learn: components and `index.html` metadata.

### Exercise 2: theme change

Change the `moss` theme color.

You learn: Tailwind configuration and reusable design tokens.

### Exercise 3: new category

Add “Water leak” to `CATEGORIES` in `src/data/issues.js` and to `CATEGORY_IDS` in `server/src/lib/issues.js`. Then add one demo report in that category to `server/sql/seed-demo.sql` and run `npm run db:reset`.

You learn: arrays, `.map()`, shared data, and why the frontend and server must agree.

### Exercise 4: new filter

Add a filter that shows only issues with at least 25 affected votes.

You learn: state and derived data.

### Exercise 5: reusable map-color helper

The three map providers each decide that resolved issues are green. Move that decision into a `getIssueMarkerColor(issue)` function in `src/lib/issues.js`, then use the helper from all three map components.

You learn: modules, exports, imports, and avoiding duplicated logic across providers.

### Exercise 6: talk to the API without the browser

With the servers running, call the API from the terminal and read the JSON:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/v1/issues
curl "http://localhost:4000/v1/civic-area?lat=12.9718&lng=77.6412"
```

Then try `curl -X POST http://localhost:4000/v1/issues/BLR-1042/votes` and read the `401` error it returns without a token.

You learn: HTTP methods, JSON responses, and why the `Authorization` header matters.

More backend exercises are at the end of the backend section below.

---

## 26. Part: The backend and database

This section is for someone who has never written server code. Read it after you are comfortable with the frontend.

### What an API is

An API (Application Programming Interface) is a set of addresses that a program can call instead of a person. Our API lives in `server/` and listens on `http://localhost:4000`. The browser calls it with `fetch`; `curl` or any other program can call it too.

Ours is a **REST** API: each address names a thing (a *resource*) and the HTTP method says what to do with it.

| Method and path | Meaning |
| --- | --- |
| `POST /v1/session` | Create (or confirm) this browser's anonymous neighbour; returns `{ token, user }` |
| `GET /v1/issues` | Read every report, newest first |
| `GET /v1/issues/:id` | Read one report |
| `POST /v1/issues` | Create a report |
| `POST /v1/issues/:id/votes` | Toggle “This affects me” on one report |
| `POST /v1/issues/:id/resolution-votes` | Confirm one report is fixed |
| `POST /v1/issues/:id/flags` | Flag one report for a moderator (one flag per neighbour) |
| `GET /v1/photos/:id` | Read a photo from the `photos` table |
| `GET /v1/civic-area?lat=…&lng=…` | Read the nearest locality and its constituencies |
| `GET /v1/admin/issues?flagged=true` | Moderator: list flagged reports, hidden ones included |
| `POST /v1/admin/issues/:id/hide` | Moderator: hide or unhide a report |
| `POST /v1/admin/issues/:id/status` | Moderator: set `open`, `in-progress`, or `resolved` |
| `GET /uploads/<file>` | Read a photo file (only when `PHOTO_STORAGE=disk`) |
| `GET /health` | Check that the API and its database are alive |

`GET` reads and never changes anything. `POST` changes something. The `/v1/admin` rows need the `X-Admin-Token` header; everything else works with the neighbour's session token or no token at all.

### What a request and a response are

A **request** is one message from the browser to the server. It has a method, a path, headers (small key/value notes such as `Authorization`), and sometimes a JSON body.

A **response** is the server's one answer. It has a status code and usually a JSON body.

- `200` OK, `201` Created.
- `400` Bad request: you sent something invalid. The body is `{ "error": "...", "details": { "title": "Title must be between 3 and 70 characters." } }`.
- `401` Unauthorized: no valid session token.
- `403` Forbidden: a wrong `X-Admin-Token` on a moderator endpoint.
- `404` Not found (hidden reports also answer `404` on the public endpoints).
- `429` Too many requests: a rate limit was hit.
- `503` Service unavailable: the database is down, or `ADMIN_TOKEN` is not configured.

`src/lib/api.js` has one private `request()` helper that adds the headers, sends the request, and turns a non-OK response into an `ApiError`. Every exported function (`fetchIssues`, `createIssue`, `toggleAffectedVote`, `confirmResolved`, `flagIssue`, `fetchCivicArea`) is a thin wrapper around it. Open the browser's Network tab while clicking around and you will see every request listed.

### How the session token works

The server needs to know *which* neighbour is voting, but we have no login screen. So:

1. On first visit, `ensureSession` in `src/lib/api.js` calls `POST /v1/session`.
2. The server inserts a row in `users` and generates a random 32-byte token (64 hex characters). It stores only the SHA-256 **hash** of the token (`server/src/lib/auth.js`) and returns the raw token once.
3. The browser saves the raw token in `localStorage` under `citizen-connect-session-v1` (`src/lib/storage.js`).
4. Every later request carries the header `Authorization: Bearer <token>`. The server hashes what it receives and looks for a matching `token_hash`. If found, `request.user` is set.

Why hash it? If someone copied the database, they would have hashes, not tokens, so they could not pretend to be any neighbour. The same idea is used for passwords.

The `users.number` column is a simple counter, so the public name is "Neighbour #1001", "Neighbour #1002", and so on. No personal data is stored.

This identity is per browser, not per human. A new device, a private window, or cleared site data means a new neighbour. That is acceptable for a pilot. A public launch should add phone or email verification on top of the same `users` table.

### Why the primary key enforces one vote per person

A **primary key** is the column (or columns) that must be unique in a table. The database refuses any row that would repeat an existing key. In `server/sql/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS issue_votes (
  issue_id    text NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);
```

The key is the *pair* `(issue_id, user_id)`. A neighbour can vote on many issues, and an issue can have many voters, but the same neighbour and the same issue can appear together only once. This is enforced by PostgreSQL itself, so it holds even if two requests arrive at the same instant, and even if someone bypasses the frontend and calls the API directly.

The toggle in `server/src/routes/issues.js` builds on that rule:

1. Try to `DELETE` the row for this issue and this user.
2. If nothing was deleted, `INSERT` it (with `ON CONFLICT DO NOTHING` as a belt-and-braces guard).
3. Re-read the issue and return it.

All three steps run inside one **transaction** (`withTransaction` in `server/src/db.js`). A transaction is "all of these steps or none of them": if one fails, the database rolls back the others, so the data can never be left half-changed.

`resolution_votes` has the same primary key but no delete step. Once you have confirmed a fix, you have confirmed it. After the insert, the server counts both tables and, if confirmations reach `max(3, floor(votes / 2) + 1)`, updates the issue to `resolved`.

### How a report is published end to end

```text
Camera frame on a <canvas>
→ compressed JPEG data URL (text) in ReportModal state
→ createIssue() in src/lib/api.js builds JSON { title, description, category, position, photo }
→ POST /v1/issues with Authorization: Bearer <token>
→ express.json() (limit 4 MB) parses the body; attachUser finds the neighbour
→ validateNewIssue() checks lengths, category, and Bengaluru bounds (server/src/lib/issues.js)
→ savePhotoFromDataUrl() decodes the base64 text into a row of the `photos` table (or a file when PHOTO_STORAGE=disk) and returns its URL (server/src/lib/photos.js)
→ findLocalityName() picks the nearest row in `localities`
→ one transaction: INSERT INTO issues ... RETURNING id, then INSERT the reporter's own issue_votes row
→ 201 response with the complete issue JSON (id from the sequence, createdAt, reporter, photo URL)
→ App.jsx puts the server's copy at the front of `issues`, selects it, and the map shows it
```

Nothing about the report is final until the row exists in PostgreSQL. If any step fails, the transaction rolls back and the browser shows the error.

### How the server starts

`server/src/index.js` runs these steps in order:

1. `waitForDatabase()` retries until PostgreSQL accepts connections.
2. `runMigrations()` executes `server/sql/schema.sql`. Every statement is `CREATE ... IF NOT EXISTS`, so it is safe on every start.
3. `seedLocalities()` executes `server/sql/seed-localities.sql` on every start. It uses `ON CONFLICT`, so running it again changes nothing.
4. `seedDemoDataIfEmpty()` executes `server/sql/seed-demo.sql` only when `issues` has no rows and `SEED_DEMO_DATA` is not `false`.
5. `ensureUploadDirectory()` makes sure the upload folder exists (only matters in disk mode).
6. `createApp()` in `server/src/app.js` wires `helmet`, the rate limiters, CORS, JSON parsing, the routers, the built web app, and the error handler.
7. `app.listen(PORT)`.

### Photos live in the database

By default (`PHOTO_STORAGE=database`) the photo bytes are not written to disk. `savePhotoFromDataUrl` inserts a row into the `photos` table (`id uuid`, `content_type`, `bytes bytea`) and the issue's `photo_url` becomes `/v1/photos/<id>`. `server/src/routes/photos.js` reads the row and sends the bytes with a 7-day cache header. The reason is simple: a stateless API can run on hosts that wipe the disk on every deploy, and everything it needs is already in PostgreSQL. `PHOTO_STORAGE=disk` keeps the old behaviour (files under `UPLOAD_DIR`, served at `/uploads/...`).

### Flags and moderation

Any neighbour can flag a report with `POST /v1/issues/:id/flags` and a body `{ "reason": "..." }`. Flags go into `issue_flags` with `PRIMARY KEY (issue_id, user_id)`, so it is one flag per neighbour, like votes. The response carries `viewerHasFlagged`, and `IssueDetail` then shows "Flagged for review".

A moderator acts through `server/src/routes/admin.js`. Every request there must carry the header `X-Admin-Token` equal to the `ADMIN_TOKEN` environment variable. `requireAdmin` in `auth.js` compares the two with `timingSafeEqual`; it answers `503` when `ADMIN_TOKEN` is unset and `403` when the token is wrong. `GET /v1/admin/issues?flagged=true` lists flagged reports (hidden ones included, with `flagCount` and `hiddenAt`). `POST /v1/admin/issues/:id/hide` with `{ "hidden": true }` sets `issues.hidden_at`; hidden reports vanish from every public endpoint and answer `404`. `POST /v1/admin/issues/:id/status` with `{ "status": "in-progress" }` is how a report becomes "Acknowledged". The exact `curl` commands are in `docs/HOSTING_GUIDE.md`.

### Rate limits and security headers

`app.js` uses `helmet` for standard security headers (the Content-Security-Policy part is turned off because map tiles and fonts come from other domains). `express-rate-limit` allows 600 requests per 15 minutes per IP on `/v1`, 30 new sessions per hour, and 12 new reports per hour. Set `TRUST_PROXY=1` behind a hosting proxy so the limiter sees the visitor's real IP instead of the proxy's.

### One container serves both

If the Vite build folder `../dist` exists (or `WEB_DIST` points at one), `app.js` serves the web app from the same Express process with an SPA fallback, so any unknown path returns `index.html` and React handles the route. That is why `.env.production` sets `VITE_API_URL` empty: in a production build the browser calls the API on the same origin, so there is no CORS to configure. `npm start` builds the web app and starts the API; the root `Dockerfile` does the same inside a container. `docs/HOSTING_GUIDE.md` walks through hosting that container on Render with a Neon PostgreSQL database.

### How to run it

```bash
npm run db:up      # PostgreSQL 16 in Docker (docker-compose.yml)
npm run dev:all    # API on :4000 and web app on :5173
npm test           # frontend + server unit tests
npm run lint
```

`docker-compose.yml` defines a `db` service (image `postgres:16-alpine`, database `citizen_connect`, user `citizen`) with a named volume so data survives restarts. There is also an optional `api` service behind `--profile full` if you want the API inside Docker too.

### How to look at the data

```bash
npm run db:shell
```

You are now inside `psql`. Useful commands (each ends with a semicolon):

```sql
\dt                                      -- list tables
SELECT id, title, status FROM issues;
SELECT * FROM issue_votes;
SELECT * FROM resolution_votes WHERE issue_id = 'BLR-1042';
SELECT number, created_at FROM users ORDER BY number DESC LIMIT 5;
SELECT name, corporation FROM localities;
SELECT issue_id, reason FROM issue_flags;
SELECT id, content_type, length(bytes) FROM photos;
SELECT id, title FROM issues WHERE hidden_at IS NOT NULL;
\q                                       -- leave psql
```

Try this: click “This affects me” in the browser, then run `SELECT * FROM issue_votes;` and watch the row appear. Click again and watch it disappear.

`npm run db:reset` deletes the Docker volume and starts a clean database with the five demo reports. Your browser will get a fresh neighbour identity on its next request.

### Backend exercises

Do these after the frontend exercises. Run `npm test` and `npm run lint` after each.

#### Exercise 7: a read-only endpoint

Add `GET /v1/issues/:id/votes` to `server/src/routes/issues.js`. It should return `{ votes: <number>, viewerHasVoted: <boolean> }` for one report, or `404` if the report does not exist. Test it with `curl`.

You learn: Express routing, `request.params`, SQL `count(*)`, and reusing `issueExists`.

#### Exercise 8: a new table

Create a `comments` table in `server/sql/schema.sql` with `id`, `issue_id`, `user_id`, `body`, and `created_at`, using `REFERENCES` like the vote tables. Restart the API and confirm with `\dt` in `npm run db:shell` that it exists. Then add `GET /v1/issues/:id/comments` and `POST /v1/issues/:id/comments` (require a user; limit `body` to 300 characters).

You learn: idempotent schema changes, foreign keys, and validation on the server.

#### Exercise 9: a server-side rule

Change `getResolutionThreshold` in `server/src/lib/issues.js` to require at least five confirmations. Update the test in `server/test/logic.test.js` and the frontend fallback in `src/lib/issues.js`. Watch the progress bar in `IssueDetail` change without editing any component.

You learn: why the server owns the rule and the frontend displays the server's answer.

#### Exercise 10: see the primary key work

In `npm run db:shell`, pick a real `issue_id` and `user_id` from `issue_votes` and run the same `INSERT INTO issue_votes (issue_id, user_id) VALUES (...)` twice. Read the error PostgreSQL returns the second time.

You learn: the database, not the API, is the last line of defence.

---

## 27. Handover checklist

The person taking over should be able to answer these questions:

- How does `index.html` reach `App.jsx`?
- What is the difference between props and state?
- Where do the demo reports come from, and where do new reports go?
- Which component chooses the map provider?
- How does a location captured in the modal reach the blue map marker?
- Why must every report request a fresh location?
- What does the browser still keep in `localStorage`, and why is that enough?
- Which database rule enforces one vote per neighbour, and how does the toggle use it?
- How does a report travel from the camera to a row in PostgreSQL, and where do the photo bytes go?
- How does a report get flagged, hidden, or marked "Acknowledged"?
- How does one hosted service serve both the web app and the API?
- Why does civic lookup require geographic polygons?
- Where are the two environment files configured?
- How do they run lint, tests, and a production build?
- Which privacy controls are required before launch?

If they cannot answer one, revisit the matching section instead of moving forward blindly.

---

## 28. Key rule for future development

Keep the current separation:

```text
components = what the user sees and interacts with
data       = categories and fallback contacts
lib        = browser APIs, the API client, and external-service adapters
App.jsx    = shared state, API calls, and feature coordination
server/    = identity, validation, votes, photos, moderation, persistence, and (later) spatial truth
```

When adding a feature, first decide which layer owns it. That one decision prevents many beginner codebases from turning into one enormous, difficult-to-debug component.
