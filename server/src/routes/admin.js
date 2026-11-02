import { Router } from 'express'
import { query } from '../db.js'
import { requireAdmin } from '../lib/auth.js'
import { asyncRoute, badRequest, notFound } from '../lib/errors.js'
import { getIssue, listIssues } from '../lib/issues.js'

const STATUSES = ['open', 'in-progress', 'resolved']

const router = Router()

router.use(requireAdmin)

// GET /v1/admin/issues?flagged=true — every report including hidden ones,
// with flag counts. Add flagged=true to see only flagged reports.
router.get(
  '/issues',
  asyncRoute(async (request, response) => {
    const issues = await listIssues(null, {
      includeHidden: true,
      flaggedOnly: request.query.flagged === 'true',
    })

    response.json({ issues })
  }),
)

// POST /v1/admin/issues/:id/hide   { "hidden": true | false }
router.post(
  '/issues/:id/hide',
  asyncRoute(async (request, response) => {
    const hidden = request.body?.hidden !== false

    const result = await query(
      `UPDATE issues
          SET hidden_at = CASE WHEN $2 THEN COALESCE(hidden_at, now()) ELSE NULL END,
              updated_at = now()
        WHERE id = $1`,
      [request.params.id, hidden],
    )

    if (result.rowCount === 0) {
      throw notFound('Report not found')
    }

    const issue = await getIssue(request.params.id, null, undefined, { includeHidden: true })
    response.json({ issue })
  }),
)

// POST /v1/admin/issues/:id/status   { "status": "in-progress" }
// Lets a moderator mark a report acknowledged by the authority, or reopen it.
router.post(
  '/issues/:id/status',
  asyncRoute(async (request, response) => {
    const status = request.body?.status

    if (!STATUSES.includes(status)) {
      throw badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }

    const result = await query(
      `UPDATE issues
          SET status = $2,
              resolved_at = CASE WHEN $2 = 'resolved' THEN COALESCE(resolved_at, now()) ELSE NULL END,
              updated_at = now()
        WHERE id = $1`,
      [request.params.id, status],
    )

    if (result.rowCount === 0) {
      throw notFound('Report not found')
    }

    const issue = await getIssue(request.params.id, null, undefined, { includeHidden: true })
    response.json({ issue })
  }),
)

export default router
