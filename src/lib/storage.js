const SESSION_TOKEN_KEY = 'citizen-connect-session-v1'

// Reports now live in the database. The only thing the browser remembers is
// the anonymous session token that identifies this neighbour to the API.
export function loadSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveSessionToken(token) {
  try {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY)
    }
  } catch {
    // Private browsing or a full quota should never break the app.
  }
}
