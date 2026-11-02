import { loadSessionToken, saveSessionToken } from './storage'

// Where the Express API lives. In development it is the separate dev server
// on port 4000. In a production build the API serves the web app itself, so
// an empty value means "same origin". VITE_API_URL overrides both.
const CONFIGURED_API_URL = import.meta.env.VITE_API_URL

export const API_URL = (
  CONFIGURED_API_URL === undefined
    ? (import.meta.env.DEV ? 'http://localhost:4000' : '')
    : CONFIGURED_API_URL
).replace(/\/$/, '')

let sessionToken = loadSessionToken()
let sessionPromise = null

/**
 * Makes sure this browser has an anonymous neighbour identity on the server.
 * The server hands out a secret token; we keep it in localStorage and send it
 * with every request. That token is what makes "one vote per person" work.
 */
export function ensureSession() {
  if (!sessionPromise) {
    sessionPromise = requestSession().catch((error) => {
      // Allow a retry on the next call instead of caching the failure.
      sessionPromise = null
      throw error
    })
  }

  return sessionPromise
}

async function requestSession() {
  const data = await request('/v1/session', { method: 'POST' })

  sessionToken = data.token
  saveSessionToken(sessionToken)

  return data.user
}

export async function fetchIssues() {
  await ensureSession()
  const data = await request('/v1/issues')
  return data.issues.map(normalizeIssue)
}

export async function createIssue(report) {
  await ensureSession()
  const data = await request('/v1/issues', {
    method: 'POST',
    body: report,
  })
  return normalizeIssue(data.issue)
}

// Toggles "This affects me". The server adds the vote if the neighbour has
// not voted yet, or removes it if they have.
export async function toggleAffectedVote(issueId) {
  await ensureSession()
  const data = await request(`/v1/issues/${issueId}/votes`, { method: 'POST' })
  return normalizeIssue(data.issue)
}

export async function confirmResolved(issueId) {
  await ensureSession()
  const data = await request(`/v1/issues/${issueId}/resolution-votes`, {
    method: 'POST',
  })
  return normalizeIssue(data.issue)
}

// Marks a report as inappropriate or fake for a moderator to review.
export async function flagIssue(issueId, reason = '') {
  await ensureSession()
  const data = await request(`/v1/issues/${issueId}/flags`, {
    method: 'POST',
    body: { reason },
  })
  return normalizeIssue(data.issue)
}

export async function fetchCivicArea(position) {
  const params = new URLSearchParams({
    lat: String(position.lat),
    lng: String(position.lng),
  })

  return request(`/v1/civic-area?${params}`)
}

// Photos are stored on the API server, so relative paths need its origin.
function normalizeIssue(issue) {
  return {
    ...issue,
    photo: issue.photo ? `${API_URL}${issue.photo}` : null,
  }
}

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, options = {}) {
  const headers = { Accept: 'application/json' }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`
  }

  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(
      0,
      'Cannot reach the Citizen Connect API. Is the server running?',
    )
  }

  const data = await response.json().catch(() => ({}))

  if (response.status === 401) {
    // The stored token is unknown to the server (e.g. database was reset).
    sessionToken = null
    sessionPromise = null
    saveSessionToken(null)
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error || `Request failed (${response.status})`,
      data.details,
    )
  }

  return data
}
