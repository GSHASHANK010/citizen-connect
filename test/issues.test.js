import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  filterIssues,
  formatRelativeTime,
  getResolutionThreshold,
  replaceIssue,
} from '../src/lib/issues.js'

const issues = [
  { id: 'A', title: 'Pothole', address: '12th Main', locality: 'Indiranagar', category: 'pothole', status: 'open' },
  { id: 'B', title: 'Lamp out', address: 'CMH Road', locality: 'Indiranagar', category: 'streetlight', status: 'resolved' },
  { id: 'C', title: 'Drain', address: '1st Cross', locality: 'Kodihalli', category: 'drainage', status: 'in-progress' },
]

test('filterIssues combines category, status, and search', () => {
  const active = filterIssues(issues, { category: 'all', status: 'active', search: '' })
  assert.deepEqual(active.map((i) => i.id), ['A', 'C'])

  const resolved = filterIssues(issues, { category: 'all', status: 'resolved', search: '' })
  assert.deepEqual(resolved.map((i) => i.id), ['B'])

  const bySearch = filterIssues(issues, { category: 'all', status: 'all', search: 'kodi' })
  assert.deepEqual(bySearch.map((i) => i.id), ['C'])

  const byId = filterIssues(issues, { category: 'all', status: 'all', search: 'b' })
  assert.ok(byId.some((i) => i.id === 'B'))

  const byCategory = filterIssues(issues, { category: 'pothole', status: 'all', search: '' })
  assert.deepEqual(byCategory.map((i) => i.id), ['A'])
})

test('getResolutionThreshold prefers the server value', () => {
  assert.equal(getResolutionThreshold({ votes: 38, resolutionThreshold: 20 }), 20)
  assert.equal(getResolutionThreshold({ votes: 38 }), 20)
  assert.equal(getResolutionThreshold({ votes: 1 }), 3)
})

test('replaceIssue swaps only the matching issue', () => {
  const updated = replaceIssue(issues, { id: 'B', title: 'Lamp fixed' })
  assert.equal(updated[1].title, 'Lamp fixed')
  assert.equal(updated[0], issues[0])
  assert.equal(updated.length, 3)
})

test('formatRelativeTime produces friendly labels', () => {
  const now = Date.parse('2026-10-07T12:00:00Z')
  const minutesAgo = (m) => new Date(now - m * 60_000).toISOString()

  assert.equal(formatRelativeTime(minutesAgo(0.5), now), 'Just now')
  assert.equal(formatRelativeTime(minutesAgo(18), now), '18 min ago')
  assert.equal(formatRelativeTime(minutesAgo(120), now), '2 hr ago')
  assert.equal(formatRelativeTime(minutesAgo(60 * 24), now), 'Yesterday')
  assert.equal(formatRelativeTime(minutesAgo(60 * 24 * 4), now), '4 days ago')
  assert.equal(formatRelativeTime('not a date', now), '')
})
