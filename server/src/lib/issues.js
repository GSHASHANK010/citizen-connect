import { query } from '../db.js'
import { badRequest, notFound } from './errors.js'
import { isInsideBengaluru, isValidPosition } from './geo.js'

export const CATEGORY_IDS = [
  'pothole',
  'streetlight',
  'garbage',
  'footpath',
  'drainage',
  'other',
]

// A fix needs a majority of affected neighbours, and never fewer than three.
export function getResolutionThreshold(votes) {
  const majority = Math.floor(votes / 2) + 1
  return Math.max(3, majority)
}

// One SQL shape used by every endpoint that returns issues. $1 is the
// viewer's user id (or NULL) so the response can say "you already voted".
const ISSUE_SELECT = `
  SELECT i.id, i.title, i.description, i.category, i.status,
         i.lat, i.lng, i.accuracy, i.address, i.locality, i.photo_url,
         i.reporter_id, i.created_at, i.updated_at, i.resolved_at,
         u.number AS reporter_number,
         (SELECT count(*) FROM issue_votes v WHERE v.issue_id = i.id)::int AS votes,
         (SELECT count(*) FROM resolution_votes r WHERE r.issue_id = i.id)::int AS resolved_votes,
         EXISTS (
           SELECT 1 FROM issue_votes v
            WHERE v.issue_id = i.id AND v.user_id = $1
         ) AS viewer_has_voted,
         EXISTS (
           SELECT 1 FROM resolution_votes r
            WHERE r.issue_id = i.id AND r.user_id = $1
         ) AS viewer_has_confirmed,
         EXISTS (
           SELECT 1 FROM issue_flags f
            WHERE f.issue_id = i.id AND f.user_id = $1
         ) AS viewer_has_flagged,
         (SELECT count(*) FROM issue_flags f WHERE f.issue_id = i.id)::int AS flag_count,
         i.hidden_at
    FROM issues i
    JOIN users u ON u.id = i.reporter_id
`

// Public callers never see hidden reports. Moderators pass includeHidden.
export async function listIssues(viewerId, { includeHidden = false, flaggedOnly = false } = {}, db = { query }) {
  const conditions = []

  if (!includeHidden) {
    conditions.push('i.hidden_at IS NULL')
  }

  if (flaggedOnly) {
    conditions.push('EXISTS (SELECT 1 FROM issue_flags f WHERE f.issue_id = i.id)')
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await db.query(
    `${ISSUE_SELECT} ${where} ORDER BY i.created_at DESC`,
    [viewerId],
  )

  return rows.map((row) => serializeIssue(row, viewerId, { includeModeration: includeHidden }))
}

export async function getIssue(issueId, viewerId, db = { query }, { includeHidden = false } = {}) {
  const { rows } = await db.query(
    `${ISSUE_SELECT} WHERE i.id = $2`,
    [viewerId, issueId],
  )

  const row = rows[0]

  if (!row || (row.hidden_at && !includeHidden)) {
    throw notFound('Report not found')
  }

  return serializeIssue(row, viewerId, { includeModeration: includeHidden })
}

export async function issueExists(issueId, db = { query }) {
  const { rows } = await db.query(
    'SELECT 1 FROM issues WHERE id = $1 AND hidden_at IS NULL',
    [issueId],
  )
  return rows.length > 0
}

// Converts a database row (snake_case) into the JSON shape the frontend uses.
export function serializeIssue(row, viewerId, { includeModeration = false } = {}) {
  const moderation = includeModeration
    ? { flagCount: row.flag_count, hiddenAt: row.hidden_at }
    : {}

  return {
    ...moderation,
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    votes: row.votes,
    resolvedVotes: row.resolved_votes,
    resolutionThreshold: getResolutionThreshold(row.votes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
    address: row.address,
    locality: row.locality,
    position: { lat: row.lat, lng: row.lng, accuracy: row.accuracy },
    photo: row.photo_url,
    reporter: `Neighbour #${row.reporter_number}`,
    isMine: Boolean(viewerId) && row.reporter_id === viewerId,
    viewerHasVoted: row.viewer_has_voted,
    viewerHasConfirmed: row.viewer_has_confirmed,
    viewerHasFlagged: row.viewer_has_flagged,
  }
}

// Checks the body of POST /v1/issues and returns clean values.
export function validateNewIssue(body) {
  const problems = {}
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || '').trim()
  const position = body.position

  if (title.length < 3 || title.length > 70) {
    problems.title = 'Title must be between 3 and 70 characters.'
  }

  if (description.length < 3 || description.length > 300) {
    problems.description = 'Description must be between 3 and 300 characters.'
  }

  if (!CATEGORY_IDS.includes(category)) {
    problems.category = 'Unknown category.'
  }

  if (!isValidPosition(position)) {
    problems.position = 'A live location with lat and lng is required.'
  } else if (!isInsideBengaluru(position)) {
    problems.position = 'This location is outside Bengaluru coverage.'
  }

  if (!body.photo) {
    problems.photo = 'A live camera photo is required.'
  }

  if (Object.keys(problems).length > 0) {
    throw badRequest('Please fix the highlighted fields.', problems)
  }

  return {
    title,
    description,
    category,
    position: {
      lat: position.lat,
      lng: position.lng,
      accuracy: Number.isFinite(position.accuracy) ? position.accuracy : null,
    },
    photo: body.photo,
    address:
      String(body.address || '').trim() ||
      `Pinned at ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`,
  }
}
