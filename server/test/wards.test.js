import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { isInsideBoundary } from '../src/lib/geo.js'

const square = {
  type: 'Polygon',
  coordinates: [
    [[77, 12], [78, 12], [78, 13], [77, 13], [77, 12]],
    [[77.4, 12.4], [77.6, 12.4], [77.6, 12.6], [77.4, 12.6], [77.4, 12.4]],
  ],
}

test('isInsideBoundary handles outlines, holes and multipolygons', () => {
  assert.equal(isInsideBoundary({ lat: 12.2, lng: 77.2 }, square), true)
  assert.equal(isInsideBoundary({ lat: 12.5, lng: 77.5 }, square), false)
  assert.equal(isInsideBoundary({ lat: 14, lng: 77.5 }, square), false)

  const multi = { type: 'MultiPolygon', coordinates: [square.coordinates] }
  assert.equal(isInsideBoundary({ lat: 12.2, lng: 77.2 }, multi), true)
})

test('landmarks fall in the expected official GBA wards', async () => {
  const file = new URL('../data/gba-wards.geojson', import.meta.url)
  const { features } = JSON.parse(await readFile(file, 'utf8'))
  assert.equal(features.length, 369)

  const wardAt = (lat, lng) =>
    features.find((feature) => isInsideBoundary({ lat, lng }, feature.geometry))?.properties

  assert.equal(wardAt(12.9763, 77.5929).name, 'Sampangirama Nagar') // Cubbon Park
  assert.equal(wardAt(12.9756, 77.6066).assembly_constituency, 'Shantinagar') // MG Road
  assert.equal(wardAt(13.0358, 77.597).parliamentary_constituency, 'Bangalore North') // Hebbal
  assert.equal(wardAt(12.8452, 77.6602), undefined) // Electronic City is outside GBA
})
