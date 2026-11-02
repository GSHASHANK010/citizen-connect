// Same rectangle the frontend uses. A production service should replace this
// with an official boundary polygon.
export const BENGALURU_BOUNDS = {
  north: 13.18,
  south: 12.73,
  east: 77.86,
  west: 77.34,
}

export function isInsideBengaluru(position) {
  return (
    position.lat <= BENGALURU_BOUNDS.north &&
    position.lat >= BENGALURU_BOUNDS.south &&
    position.lng <= BENGALURU_BOUNDS.east &&
    position.lng >= BENGALURU_BOUNDS.west
  )
}

export function isValidPosition(position) {
  return (
    position &&
    typeof position.lat === 'number' &&
    typeof position.lng === 'number' &&
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lng)
  )
}

// Straight-line distance in metres between two coordinates.
export function distanceInMetres(a, b) {
  const earthRadius = 6371000
  const toRadians = (degrees) => (degrees * Math.PI) / 180

  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(deltaLng / 2) ** 2

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine))
}

// Ray casting: a point is inside a ring if a line from it crosses the ring's
// edges an odd number of times. Rings are GeoJSON [lng, lat] pairs.
function isInsideRing(position, ring) {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [lngI, latI] = ring[i]
    const [lngJ, latJ] = ring[j]

    const crosses =
      latI > position.lat !== latJ > position.lat &&
      position.lng < ((lngJ - lngI) * (position.lat - latI)) / (latJ - latI) + lngI

    if (crosses) {
      inside = !inside
    }
  }

  return inside
}

// Works for GeoJSON Polygon and MultiPolygon. The first ring of each polygon
// is its outline; any further rings are holes.
export function isInsideBoundary(position, geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  return polygons.some(
    ([outline, ...holes]) =>
      isInsideRing(position, outline) && !holes.some((hole) => isInsideRing(position, hole)),
  )
}

export function findNearest(position, places) {
  let nearest = null
  let nearestDistance = Infinity

  for (const place of places) {
    const distance = distanceInMetres(position, place)

    if (distance < nearestDistance) {
      nearest = place
      nearestDistance = distance
    }
  }

  return nearest ? { ...nearest, distanceMetres: Math.round(nearestDistance) } : null
}
