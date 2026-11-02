import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const SQL_DIRECTORY = path.join(currentDirectory, '..', 'sql')

// A pool keeps a few open connections and hands them out per query.
export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://citizen:citizen_dev_password@localhost:5432/citizen_connect',
  max: 10,
  // Hosted databases such as Neon suspend when idle and close connections.
  // A short idle timeout lets the pool drop stale clients before that.
  idleTimeoutMillis: 30_000,
})

// Without this handler an idle client losing its connection would crash the
// whole process. The pool simply opens a fresh connection on the next query.
pool.on('error', (error) => {
  console.error('Idle database connection error (will reconnect):', error.message)
})

export function query(text, params = []) {
  return pool.query(text, params)
}

// Runs a function with one dedicated connection inside a transaction so a
// group of statements either all succeed or all roll back.
export async function withTransaction(work) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function runMigrations() {
  const schemaSql = await readFile(path.join(SQL_DIRECTORY, 'schema.sql'), 'utf8')
  await pool.query(schemaSql)
}

// Neighbourhood centres are reference data and are always kept up to date.
export async function seedLocalities() {
  const sql = await readFile(path.join(SQL_DIRECTORY, 'seed-localities.sql'), 'utf8')
  await pool.query(sql)
}

// The 369 official GBA ward boundaries. The whole file goes to Postgres as one
// JSON parameter and is unpacked there, so this is a single round trip.
export async function seedWards() {
  const file = await readFile(path.join(currentDirectory, '..', 'data', 'gba-wards.geojson'), 'utf8')
  const rows = JSON.parse(file).features.map(({ properties, geometry }) => ({
    ...properties,
    ...boundingBox(geometry),
    boundary: geometry,
  }))

  await pool.query(
    `INSERT INTO wards
     SELECT * FROM jsonb_populate_recordset(NULL::wards, $1::jsonb)
     ON CONFLICT (ward_number) DO UPDATE SET
       slug = EXCLUDED.slug,
       name = EXCLUDED.name,
       name_kn = EXCLUDED.name_kn,
       corporation = EXCLUDED.corporation,
       corporation_ward_number = EXCLUDED.corporation_ward_number,
       zone = EXCLUDED.zone,
       assembly_constituency = EXCLUDED.assembly_constituency,
       ac_number = EXCLUDED.ac_number,
       parliamentary_constituency = EXCLUDED.parliamentary_constituency,
       ro_division = EXCLUDED.ro_division,
       aro_subdivision = EXCLUDED.aro_subdivision,
       population = EXCLUDED.population,
       center_lat = EXCLUDED.center_lat,
       center_lng = EXCLUDED.center_lng,
       min_lat = EXCLUDED.min_lat,
       max_lat = EXCLUDED.max_lat,
       min_lng = EXCLUDED.min_lng,
       max_lng = EXCLUDED.max_lng,
       boundary = EXCLUDED.boundary,
       health_inspector_phone = EXCLUDED.health_inspector_phone,
       engineer_phone = EXCLUDED.engineer_phone`,
    [JSON.stringify(rows)],
  )

  const sql = await readFile(path.join(SQL_DIRECTORY, 'seed-representatives.sql'), 'utf8')
  await pool.query(sql)
}

// GeoJSON coordinates are [lng, lat] pairs nested inside rings and polygons.
function boundingBox(geometry) {
  const points = geometry.coordinates.flat(geometry.type === 'MultiPolygon' ? 2 : 1)
  const lats = points.map(([, lat]) => lat)
  const lngs = points.map(([lng]) => lng)

  return {
    min_lat: Math.min(...lats),
    max_lat: Math.max(...lats),
    min_lng: Math.min(...lngs),
    max_lng: Math.max(...lngs),
  }
}

// Demo reports only go into an empty database, and never when
// SEED_DEMO_DATA=false (which production should set).
export async function seedDemoDataIfEmpty() {
  if (process.env.SEED_DEMO_DATA === 'false') {
    return false
  }

  const { rows } = await pool.query('SELECT count(*)::int AS count FROM issues')

  if (rows[0].count > 0) {
    return false
  }

  const sql = await readFile(path.join(SQL_DIRECTORY, 'seed-demo.sql'), 'utf8')
  await pool.query(sql)
  return true
}

export async function waitForDatabase(attempts = 20, delayMs = 1500) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query('SELECT 1')
      return
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }

      console.log(`Database not ready (attempt ${attempt}/${attempts}). Retrying…`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
