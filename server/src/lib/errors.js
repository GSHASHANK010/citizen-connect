// A small error type that carries an HTTP status code to the error handler.
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function notFound(message = 'Not found') {
  return new HttpError(404, message)
}

export function badRequest(message, details) {
  return new HttpError(400, message, details)
}

export function unauthorized(message = 'A session token is required') {
  return new HttpError(401, message)
}

// Express recognises a 4-argument function as an error handler.
export function errorHandler(error, request, response, next) {
  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Photo is too large. Please retake it.' })
    return
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: error.message,
      details: error.details,
    })
    return
  }

  console.error(error)
  response.status(500).json({ error: 'Something went wrong on the server.' })
}

// Wraps an async route so thrown errors reach the error handler.
export function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}
