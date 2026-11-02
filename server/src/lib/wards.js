import { query } from '../db.js'
import { isInsideBoundary } from './geo.js'

// Returns the official GBA ward containing a coordinate, or null when the
// point is outside all 369 wards (e.g. Electronic City, which is run by
// ELCITA). SQL narrows the search by bounding box; JS does the exact test.
export async function findWard(position) {
  const { rows } = await query(
    `SELECT * FROM wards
     WHERE $1 BETWEEN min_lat AND max_lat
       AND $2 BETWEEN min_lng AND max_lng`,
    [position.lat, position.lng],
  )

  return rows.find((ward) => isInsideBoundary(position, ward.boundary)) ?? null
}

// The ward's MLA and MP, keyed by constituency name.
export async function findRepresentatives(ward) {
  const { rows } = await query(
    `SELECT * FROM representatives
     WHERE (role = 'mla' AND constituency = $1)
        OR (role = 'mp' AND constituency = $2)`,
    [ward.assembly_constituency, ward.parliamentary_constituency],
  )

  return {
    mla: rows.find((row) => row.role === 'mla') ?? null,
    mp: rows.find((row) => row.role === 'mp') ?? null,
  }
}
