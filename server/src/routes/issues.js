import { Router } from 'express'
import { query, withTransaction } from '../db.js'
import { requireUser } from '../lib/auth.js'
import { asyncRoute, notFound } from '../lib/errors.js'
import { findNearest } from '../lib/geo.js'
import { findWard } from '../lib/wards.js'
import {
  getIssue,
  getResolutionThreshold,
  issueExists,
  listIssues,
  validateNewIssue,
} from '../lib/issues.js'
import { savePhotoFromDataUrl } from '../lib/photos.js'

const router = Router()

// GET /v1/issues — every report, newest first.
router.get(
  '/',
  asyncRoute(async (request, response) => {
    const issues = await listIssues(request.user?.id ?? null)
    response.json({ issues })
  }),
)

// GET /v1/issues/:id
router.get(
  '/:id',
  asyncRoute(async (request, response) => {
    const issue = await getIssue(request.params.id, request.user?.id ?? null)
    response.json({ issue })
  }),
)

// POST /v1/issues — publish a new report. The reporter automatically counts
// as the first affected neighbour.
router.post(
  '/',
  requireUser,
  asyncRoute(async (request, response) => {
    const report = validateNewIssue(request.body)
    const photoUrl = await savePhotoFromDataUrl(report.photo)
    const locality = await findLocalityName(report.position)

    const issue = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO issues
           (id, title, description, category, lat, lng, accuracy, address, locality, photo_url, reporter_id)
         VALUES
           ('BLR-' || nextval('issue_number_seq'),
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          report.title,
          report.description,
          report.category,
          report.position.lat,
          report.position.lng,
          report.position.accuracy,
          report.address,
          locality,
          photoUrl,
          request.user.id,
        ],
      )

      const issueId = rows[0].id

      await client.query(
        'INSERT INTO issue_votes (issue_id, user_id) VALUES ($1, $2)',
        [issueId, request.user.id],
      )

      return getIssue(issueId, request.user.id, client)
    })

    response.status(201).json({ issue })
  }),
)

// POST /v1/issues/:id/votes — toggle "This affects me".
// The (issue_id, user_id) primary key means a neighbour can never hold more
// than one vote. Clicking again removes it.
router.post(
  '/:id/votes',
  requireUser,
  asyncRoute(async (request, response) => {
    const issueId = request.params.id

    const issue = await withTransaction(async (client) => {
      if (!(await issueExists(issueId, client))) {
        throw notFound('Report not found')
      }

      const removed = await client.query(
        'DELETE FROM issue_votes WHERE issue_id = $1 AND user_id = $2',
        [issueId, request.user.id],
      )

      if (removed.rowCount === 0) {
        await client.query(
          `INSERT INTO issue_votes (issue_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [issueId, request.user.id],
        )
      }

      return getIssue(issueId, request.user.id, client)
    })

    response.json({ issue })
  }),
)

// POST /v1/issues/:id/resolution-votes — confirm the problem is fixed.
// One confirmation per neighbour; repeated calls are harmless.
router.post(
  '/:id/resolution-votes',
  requireUser,
  asyncRoute(async (request, response) => {
    const issueId = request.params.id

    const issue = await withTransaction(async (client) => {
      if (!(await issueExists(issueId, client))) {
        throw notFound('Report not found')
      }

      await client.query(
        `INSERT INTO resolution_votes (issue_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [issueId, request.user.id],
      )

      const counts = await client.query(
        `SELECT
           (SELECT count(*) FROM issue_votes WHERE issue_id = $1)::int AS votes,
           (SELECT count(*) FROM resolution_votes WHERE issue_id = $1)::int AS confirmations`,
        [issueId],
      )

      const { votes, confirmations } = counts.rows[0]

      if (confirmations >= getResolutionThreshold(votes)) {
        await client.query(
          `UPDATE issues
              SET status = 'resolved',
                  resolved_at = COALESCE(resolved_at, now()),
                  updated_at = now()
            WHERE id = $1 AND status <> 'resolved'`,
          [issueId],
        )
      }

      return getIssue(issueId, request.user.id, client)
    })

    response.json({ issue })
  }),
)

// POST /v1/issues/:id/flags — "this report is inappropriate or fake".
// One flag per neighbour. Moderators review flags via /v1/admin/issues.
router.post(
  '/:id/flags',
  requireUser,
  asyncRoute(async (request, response) => {
    const issueId = request.params.id
    const reason = String(request.body?.reason || '').trim().slice(0, 200) || null

    if (!(await issueExists(issueId))) {
      throw notFound('Report not found')
    }

    await query(
      `INSERT INTO issue_flags (issue_id, user_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [issueId, request.user.id, reason],
    )

    const issue = await getIssue(issueId, request.user.id)
    response.json({ issue })
  }),
)

async function findLocalityName(position) {
  const { rows } = await query('SELECT name, lat, lng FROM localities')
  const nearest = findNearest(position, rows)

  // Beyond ~3 km the nearest seed centroid is a poor label, so use the
  // official ward name instead.
  if (nearest && nearest.distanceMetres <= 3000) {
    return nearest.name
  }

  const ward = await findWard(position)
  return ward?.name ?? 'Bengaluru'
}

export default router
