import assert from 'node:assert/strict'
import { test } from 'node:test'
import { distanceInMetres, findNearest, isInsideBengaluru } from '../src/lib/geo.js'
import { getResolutionThreshold, validateNewIssue } from '../src/lib/issues.js'

test('resolution threshold is a majority with a floor of three', () => {
  assert.equal(getResolutionThreshold(1), 3)
  assert.equal(getResolutionThreshold(4), 3)
  assert.equal(getResolutionThreshold(5), 3)
  assert.equal(getResolutionThreshold(6), 4)
  assert.equal(getResolutionThreshold(38), 20)
})

test('bengaluru bounds accept the city centre and reject Mysuru', () => {
  assert.equal(isInsideBengaluru({ lat: 12.9716, lng: 77.5946 }), true)
  assert.equal(isInsideBengaluru({ lat: 12.2958, lng: 76.6394 }), false)
})

test('distance and nearest-locality helpers behave', () => {
  const indiranagar = { lat: 12.9719, lng: 77.6412, name: 'Indiranagar' }
  const koramangala = { lat: 12.9352, lng: 77.6245, name: 'Koramangala' }

  const distance = distanceInMetres(indiranagar, koramangala)
  assert.ok(distance > 4000 && distance < 5000, `unexpected distance ${distance}`)

  const nearest = findNearest({ lat: 12.9718, lng: 77.6412 }, [koramangala, indiranagar])
  assert.equal(nearest.name, 'Indiranagar')
  assert.ok(nearest.distanceMetres < 50)
})

test('validateNewIssue rejects bad input and cleans good input', () => {
  assert.throws(
    () => validateNewIssue({ title: 'x', description: '', category: 'nope', position: null }),
    (error) => {
      assert.equal(error.status, 400)
      assert.ok(error.details.title)
      assert.ok(error.details.description)
      assert.ok(error.details.category)
      assert.ok(error.details.position)
      assert.ok(error.details.photo)
      return true
    },
  )

  const clean = validateNewIssue({
    title: '  Deep pothole  ',
    description: 'Dangerous for two-wheelers',
    category: 'pothole',
    position: { lat: 12.9718, lng: 77.6412, accuracy: 12 },
    photo: 'data:image/jpeg;base64,/9j/',
  })

  assert.equal(clean.title, 'Deep pothole')
  assert.equal(clean.address, 'Pinned at 12.97180, 77.64120')
  assert.equal(clean.position.accuracy, 12)
})
