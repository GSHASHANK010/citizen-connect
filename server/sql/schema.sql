-- Citizen Connect database schema.
-- Every statement is idempotent so the API can run this file on every start.

-- One row per anonymous participant. The browser keeps a secret token; we
-- store only its SHA-256 hash. "number" gives the public name "Neighbour #N".
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number        serial NOT NULL UNIQUE,
  token_hash    text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

-- Human-friendly report IDs such as BLR-1100, BLR-1101, …
CREATE SEQUENCE IF NOT EXISTS issue_number_seq START WITH 1100;

CREATE TABLE IF NOT EXISTS issues (
  id            text PRIMARY KEY,
  title         text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 70),
  description   text NOT NULL CHECK (char_length(description) BETWEEN 3 AND 300),
  category      text NOT NULL,
  status        text NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in-progress', 'resolved')),
  lat           double precision NOT NULL,
  lng           double precision NOT NULL,
  accuracy      double precision,
  address       text NOT NULL,
  locality      text NOT NULL,
  photo_url     text,
  reporter_id   uuid NOT NULL REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE INDEX IF NOT EXISTS issues_created_at_idx ON issues (created_at DESC);

-- "This affects me". The PRIMARY KEY is what enforces one vote per person
-- per issue: the database rejects a second row with the same pair.
CREATE TABLE IF NOT EXISTS issue_votes (
  issue_id    text NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);

-- "I can confirm it is fixed". Same one-per-person rule.
CREATE TABLE IF NOT EXISTS resolution_votes (
  issue_id    text NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);

-- Approximate locality centroids used for nearest-neighbourhood naming and
-- the civic-directory lookup. Constituency columns are approximate and must
-- be replaced by official PostGIS polygons before any public launch
-- (see docs/CIVIC_DATA_PLAN.md).
CREATE TABLE IF NOT EXISTS localities (
  id                          serial PRIMARY KEY,
  name                        text UNIQUE NOT NULL,
  lat                         double precision NOT NULL,
  lng                         double precision NOT NULL,
  corporation                 text NOT NULL,
  assembly_constituency       text NOT NULL,
  parliamentary_constituency  text NOT NULL
);

-- Moderation: a hidden report stays in the database for audit but is no
-- longer shown to the public.
ALTER TABLE issues ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

-- Photos stored in the database keep the API stateless, so it can run on
-- hosts whose disks are wiped on every deploy. PHOTO_STORAGE=disk switches
-- back to files under UPLOAD_DIR.
CREATE TABLE IF NOT EXISTS photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  text NOT NULL,
  bytes         bytea NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- "Flag this report". One flag per neighbour per report.
CREATE TABLE IF NOT EXISTS issue_flags (
  issue_id    text NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id),
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (issue_id, user_id)
);

-- Official GBA wards (369, delimitation 2025). Seeded on every start from
-- data/gba-wards.geojson. The min/max columns are the ward's bounding box so
-- SQL can cheaply pick a few candidates before the exact polygon test in JS.
CREATE TABLE IF NOT EXISTS wards (
  ward_number                 integer PRIMARY KEY,
  slug                        text NOT NULL,
  name                        text NOT NULL,
  name_kn                     text,
  corporation                 text NOT NULL,
  corporation_ward_number     integer,
  zone                        text,
  assembly_constituency       text NOT NULL,
  ac_number                   integer NOT NULL,
  parliamentary_constituency  text NOT NULL,
  ro_division                 text,
  aro_subdivision             text,
  population                  integer,
  center_lat                  double precision NOT NULL,
  center_lng                  double precision NOT NULL,
  min_lat                     double precision NOT NULL,
  max_lat                     double precision NOT NULL,
  min_lng                     double precision NOT NULL,
  max_lng                     double precision NOT NULL,
  boundary                    jsonb NOT NULL,
  health_inspector_phone      text,
  engineer_phone              text
);

CREATE INDEX IF NOT EXISTS wards_bbox_idx ON wards (min_lat, max_lat, min_lng, max_lng);

-- Current MLA (per Assembly constituency) and MP (per Parliamentary
-- constituency). "constituency" uses the same spelling as the wards table.
CREATE TABLE IF NOT EXISTS representatives (
  role          text NOT NULL CHECK (role IN ('mla', 'mp')),
  constituency  text NOT NULL,
  name          text NOT NULL,
  party         text,
  term          text NOT NULL,
  note          text,
  source_url    text,
  verified_at   date,
  PRIMARY KEY (role, constituency)
);
