# Hosting guide: put Citizen Connect online

This guide takes the project from your laptop to a public HTTPS address that
anyone in Bengaluru can open on their phone. It assumes no hosting experience.

**What you will end up with**

| Piece | Service | Cost |
| --- | --- | --- |
| PostgreSQL database | [Neon](https://neon.tech) | Free tier |
| API + web app (one container) | [Render](https://render.com) web service | Free tier (or $7/month to avoid sleep) |
| Code hosting | [GitHub](https://github.com) | Free |

Total time: about 45 minutes the first time.

> **Why HTTPS matters.** Browsers only allow the camera and live location on
> secure pages. Render gives you HTTPS automatically, so the report flow works
> on phones. Plain `http://` on a server will not.

---

## Step 0: Check the project runs locally

Before hosting, make sure everything passes on your machine:

```bash
npm run setup
npm run db:up
npm run lint
npm test
npm run build
```

All four commands should finish without errors. Stop here and fix anything
that fails; hosting will not fix a broken build.

---

## Step 1: Put the code on GitHub

Render deploys from a Git repository. The project is not a Git repository yet.

1. Create an empty repository on GitHub (for example `citizen-connect`). Do not
   add a README or .gitignore there; the project already has them.
2. In the project folder run:

   ```bash
   git init
   git add .
   git commit -m "Citizen Connect: web app, API, and database"
   git branch -M main
   git remote add origin https://github.com/<your-username>/citizen-connect.git
   git push -u origin main
   ```

3. Check on GitHub that **`.env` and `server/.env` are NOT in the repository.**
   They are listed in `.gitignore`, so they should be missing. If you ever see
   them online, delete them from the repo and change every secret inside.

---

## Step 2: Create the database on Neon

1. Sign up at <https://neon.tech> and click **New project**.
2. Name it `citizen-connect`. For the region choose **AWS Asia Pacific
   (Singapore)**, the closest to Bengaluru. Postgres version 16 or newer.
3. After it is created, open **Connection details** (or the **Connect** button).
   Choose **Node.js**, and copy the connection string. It looks like:

   ```text
   postgresql://neondb_owner:AbC123...@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   Both the "pooled" and the direct connection string work. Keep the
   `?sslmode=require` part. Treat this string like a password.

4. Optional check from your laptop: paste the string into `server/.env` as
   `DATABASE_URL`, run `npm run dev:api`, and open <http://localhost:4000/health>.
   You should see `"database":"up"`. The API will have created the tables in
   Neon. Put the Docker string back afterwards if you want to keep using Docker
   locally.

You never need to create tables by hand. The API runs `server/sql/schema.sql`
on every start, so the schema is always up to date.

---

## Step 3: Create the web service on Render

1. Sign up at <https://render.com> with your GitHub account.
2. Click **New +** then **Web Service**, and connect the `citizen-connect`
   repository.
3. Fill in the form:

   | Field | Value |
   | --- | --- |
   | Name | `citizen-connect` (this becomes `https://citizen-connect.onrender.com`; pick another if taken) |
   | Region | **Singapore** |
   | Branch | `main` |
   | Runtime / Language | **Docker** (Render detects the `Dockerfile`) |
   | Instance type | Free to start |
   | Health check path | `/health` |

4. Open **Advanced** (or the **Environment** tab after creation) and add these
   environment variables:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon connection string from Step 2 |
   | `SEED_DEMO_DATA` | `false` |
   | `PHOTO_STORAGE` | `database` |
   | `TRUST_PROXY` | `1` |
   | `CORS_ORIGIN` | `https://citizen-connect.onrender.com` (use your actual service URL) |
   | `ADMIN_TOKEN` | a long random secret; generate one with `openssl rand -hex 32` |
   | `PORT` | `4000` |

   Optional, only if you want the Google Maps layer: `VITE_GOOGLE_MAPS_API_KEY`
   and `VITE_GOOGLE_MAP_ID`. These are baked into the web build, so add them
   before deploying (or redeploy with **Clear build cache** after adding them).
   Restrict the key to your Render URL in Google Cloud.

5. Click **Create Web Service**. The first build takes 3 to 6 minutes. Watch
   the **Logs** tab; the last line should be
   `Citizen Connect API listening on http://localhost:4000`.

6. Open your service URL. You should see the map with zero reports, because
   `SEED_DEMO_DATA` is `false`. Open the URL on your phone, tap **Report an
   issue**, and publish a real report to prove the camera, location, photo
   storage, and database all work end to end.

### What `SEED_DEMO_DATA=false` means

The five demo reports (Indiranagar pothole, etc.) only exist for teaching. A
real city map should start empty. If you want demo data on a staging copy, set
the variable to `true` on that copy only.

---

## Step 4: Give it a real address (optional)

1. Buy a domain (for example `citizenconnect.in`) from any registrar.
2. In Render open your service, go to **Settings** then **Custom Domains**, and
   add `citizenconnect.in` and `www.citizenconnect.in`.
3. Render shows DNS records to add at your registrar (a CNAME for `www` and an
   A or ALIAS record for the root). Add them and wait up to an hour.
4. Update `CORS_ORIGIN` on Render to include every address people use, comma
   separated:

   ```text
   https://citizenconnect.in,https://www.citizenconnect.in,https://citizen-connect.onrender.com
   ```

   Save; Render redeploys automatically.

---

## Step 5: Moderate reports

People can tap **Flag this report** on anything fake or inappropriate. As the
moderator you review flags and hide or update reports through the API using
the `ADMIN_TOKEN`. Replace the URL and token below with yours.

```bash
export CC_URL=https://citizen-connect.onrender.com
export CC_ADMIN=paste-your-admin-token

# Reports that at least one neighbour flagged (includes hidden ones)
curl -s -H "X-Admin-Token: $CC_ADMIN" "$CC_URL/v1/admin/issues?flagged=true"

# Hide a report from the public map (it stays in the database)
curl -s -X POST -H "X-Admin-Token: $CC_ADMIN" -H "Content-Type: application/json" \
  -d '{"hidden": true}' "$CC_URL/v1/admin/issues/BLR-1107/hide"

# Put it back
curl -s -X POST -H "X-Admin-Token: $CC_ADMIN" -H "Content-Type: application/json" \
  -d '{"hidden": false}' "$CC_URL/v1/admin/issues/BLR-1107/hide"

# Mark a report acknowledged by the authority (shows "Acknowledged" badge)
curl -s -X POST -H "X-Admin-Token: $CC_ADMIN" -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}' "$CC_URL/v1/admin/issues/BLR-1107/status"
```

Valid statuses are `open`, `in-progress`, and `resolved`. Neighbours can still
resolve reports themselves by majority confirmation.

---

## Step 6: Look at the data

Neon has a built-in **SQL Editor** in its dashboard. Useful queries:

```sql
-- Newest reports
SELECT id, title, status, locality, created_at FROM issues ORDER BY created_at DESC LIMIT 20;

-- Most affected neighbours
SELECT issue_id, count(*) AS affected FROM issue_votes GROUP BY issue_id ORDER BY affected DESC;

-- Flagged reports with reasons
SELECT f.issue_id, i.title, f.reason, f.created_at FROM issue_flags f JOIN issues i ON i.id = f.issue_id;

-- How many neighbours have ever used the app
SELECT count(*) FROM users WHERE token_hash IS NOT NULL;
```

Neon keeps automatic history, so you can restore the database to an earlier
point in time from its dashboard if something goes wrong.

---

## Step 7: Updating the app later

Every `git push` to `main` triggers a new Render build and deploy. Nothing
else is needed. Database changes are applied by `server/sql/schema.sql`,
which uses `IF NOT EXISTS` so it is safe to run again and again.

To change a secret (for example rotate `ADMIN_TOKEN`), edit it in Render's
**Environment** tab and save; the service restarts.

---

## Things to know about the free tiers

- **Render free services sleep** after 15 minutes without visitors. The next
  visitor waits 30 to 60 seconds while it wakes up. The $7/month Starter plan
  removes this. The sleeping is why the "Loading reports…" state can take a
  while on first open.
- **Neon free projects suspend** when idle and wake in under a second on the
  first query. The API already handles reconnects.
- **Storage**: photos live in Postgres. One report is roughly 100 to 250 KB.
  Neon's free tier (0.5 GB) holds a few thousand reports. When you outgrow it,
  upgrade Neon or move photos to object storage (S3, Cloudflare R2, Cloudinary)
  by replacing `server/src/lib/photos.js`.
- **OpenStreetMap tiles** come from the community server, which is fine for
  modest traffic. If the map gets popular, set `VITE_OSM_TILE_URL` to a hosted
  tile provider (for example MapTiler or Stadia Maps, both with free tiers).

---

## Other ways to host

The `Dockerfile` runs anywhere Docker runs. The same environment variables
apply.

- **Railway**: New Project, Deploy from GitHub, add the variables, generate a
  domain. Railway sets `PORT` itself; the API reads it.
- **Fly.io**: `fly launch` in the project folder, then `fly secrets set
  DATABASE_URL=... ADMIN_TOKEN=...` and `fly deploy`.
- **A VPS you control** (DigitalOcean, Hetzner): install Docker, copy the
  project, create `server/.env`, and run
  `docker compose --profile full up -d --build`. Put Caddy or nginx in front
  for HTTPS; the camera will not work without it.

---

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Build fails on Render | Open the build log. Most often `npm ci` failed because `package-lock.json` is out of date: run `npm install` locally, commit the lockfile, push. |
| Site loads but shows "Could not load reports" | `CORS_ORIGIN` does not match the address in the browser, or the API crashed. Check Render logs. The value must include `https://` and have no trailing slash. |
| `/health` returns `"database":"down"` | `DATABASE_URL` is wrong, or Neon is paused. Copy the string again from Neon. |
| Camera or location button does nothing on a phone | The page must be `https://`. Also check the phone has granted camera and location permission to the browser. |
| "Too many requests" | Rate limiting kicked in: 600 API calls per 15 minutes, 12 new reports and 30 sessions per hour per IP. Shared office networks can hit this. Adjust in `server/src/app.js`. |
| Map shows yellow "Access blocked / 403" tiles | OpenStreetMap's volunteer tile server refused the requests. The app sends the page origin as Referer (required by their policy); if you changed the security headers or your traffic grew, switch `VITE_OSM_TILE_URL` to a hosted provider such as MapTiler or Stadia Maps and redeploy. |
| Moderation calls return 503 | `ADMIN_TOKEN` is not set on Render. |
| Moderation calls return 403 | The `X-Admin-Token` header does not match exactly. |
| Reports from your laptop show "Neighbour #1001" but the live site starts again at #1 | Expected. Each database has its own numbering. |
| Demo reports appeared on the live site | `SEED_DEMO_DATA` was not `false` on first start. Delete them in the Neon SQL editor: `DELETE FROM issues WHERE id IN ('BLR-1042','BLR-1038','BLR-1021','BLR-1007','BLR-0998');` |

---

## Launch checklist

- [ ] `.env` files are not in Git
- [ ] `SEED_DEMO_DATA=false` on the live service
- [ ] `ADMIN_TOKEN` is long, random, and stored somewhere safe
- [ ] `CORS_ORIGIN` lists every public address
- [ ] Published one real report from a phone over HTTPS
- [ ] Voted from a second phone and saw the count rise by exactly one
- [ ] Flagged a report and found it with the admin flagged query
- [ ] Decided who moderates and how often they check flags
- [ ] Shared the "How it works" page and the GBA 1533 helpline note with early users
