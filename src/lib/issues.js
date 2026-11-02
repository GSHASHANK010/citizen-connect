import { CATEGORIES } from '../data/issues.js'

// This file contains plain JavaScript rules for civic issues.
// Keeping these rules outside React makes them easier to read, reuse, and test.
// Vote counting itself happens on the server so that it cannot be bypassed.

export const STATUS_FILTERS = [
  'active',
  'open',
  'in-progress',
  'resolved',
  'all',
]

export function findIssueCategory(categoryId) {
  const matchingCategory = CATEGORIES.find(
    (category) => category.id === categoryId,
  )

  // The final "Other" category is a safe fallback for unknown old data.
  return matchingCategory || CATEGORIES.at(-1)
}

// The server sends resolutionThreshold. This mirrors its rule as a fallback.
export function getResolutionThreshold(issue) {
  if (Number.isFinite(issue.resolutionThreshold)) {
    return issue.resolutionThreshold
  }

  const majority = Math.floor(issue.votes / 2) + 1

  // Even a report with very few votes needs at least three confirmations.
  return Math.max(3, majority)
}

export function filterIssues(issues, filters) {
  const normalizedSearch = filters.search.trim().toLowerCase()

  return issues.filter((issue) => {
    const matchesCategory =
      filters.category === 'all' || issue.category === filters.category

    const matchesStatus = issueMatchesStatus(issue, filters.status)

    const searchableText = [
      issue.title,
      issue.address,
      issue.locality,
      issue.id,
    ].join(' ').toLowerCase()

    const matchesSearch =
      normalizedSearch === '' || searchableText.includes(normalizedSearch)

    return matchesCategory && matchesStatus && matchesSearch
  })
}

function issueMatchesStatus(issue, statusFilter) {
  if (statusFilter === 'all') {
    return true
  }

  if (statusFilter === 'active') {
    return issue.status !== 'resolved'
  }

  return issue.status === statusFilter
}

// Replaces one issue in a list with its fresh copy from the server.
export function replaceIssue(issues, updatedIssue) {
  return issues.map((issue) =>
    issue.id === updatedIssue.id ? updatedIssue : issue,
  )
}

// Turns an ISO timestamp into "Just now", "18 min ago", "Yesterday", …
export function formatRelativeTime(isoDate, now = Date.now()) {
  const time = new Date(isoDate).getTime()

  if (!Number.isFinite(time)) {
    return ''
  }

  const seconds = Math.max(0, Math.round((now - time) / 1000))
  const minutes = Math.round(seconds / 60)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hr ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`

  return new Date(time).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}
