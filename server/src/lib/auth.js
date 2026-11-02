import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { query } from '../db.js'
import { HttpError, unauthorized } from './errors.js'

// The browser holds a random secret. We only ever store its hash, so a copy
// of the database does not let anyone impersonate a neighbour.
export function createRawToken() {
  return randomBytes(32).toString('hex')
}

export function hashToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex')
}

export function readBearerToken(request) {
  const header = request.get('authorization') || ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

export async function findUserByToken(rawToken) {
  if (!rawToken) {
    return null
  }

  const { rows } = await query(
    `UPDATE users
        SET last_seen_at = now()
      WHERE token_hash = $1
  RETURNING id, number, created_at`,
    [hashToken(rawToken)],
  )

  return rows[0] || null
}

export async function createUser() {
  const rawToken = createRawToken()

  const { rows } = await query(
    `INSERT INTO users (token_hash)
     VALUES ($1)
  RETURNING id, number, created_at`,
    [hashToken(rawToken)],
  )

  return { user: rows[0], token: rawToken }
}

export function serializeUser(user) {
  return {
    id: user.id,
    displayName: `Neighbour #${user.number}`,
    createdAt: user.created_at,
  }
}

// Attaches request.user when a valid token is present, otherwise leaves it
// null. Public endpoints use this so they can personalise responses.
export async function attachUser(request, response, next) {
  try {
    request.user = await findUserByToken(readBearerToken(request))
    next()
  } catch (error) {
    next(error)
  }
}

// Rejects the request when no valid session was attached.
export function requireUser(request, response, next) {
  if (!request.user) {
    next(unauthorized())
    return
  }

  next()
}

// Moderation endpoints need the ADMIN_TOKEN from the environment, sent as an
// X-Admin-Token header. Without the variable the endpoints stay switched off.
export function requireAdmin(request, response, next) {
  const expected = process.env.ADMIN_TOKEN

  if (!expected) {
    next(new HttpError(503, 'Moderation is not configured (set ADMIN_TOKEN).'))
    return
  }

  const provided = request.get('x-admin-token') || ''
  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  const matches =
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)

  if (!matches) {
    next(new HttpError(403, 'Invalid admin token'))
    return
  }

  next()
}
