import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { pool } from './db.js'
import { attachUser } from './lib/auth.js'
import { errorHandler } from './lib/errors.js'
import { PHOTO_STORAGE, UPLOAD_DIR } from './lib/photos.js'
import adminRouter from './routes/admin.js'
import civicRouter from './routes/civic.js'
import issuesRouter from './routes/issues.js'
import photosRouter from './routes/photos.js'
import sessionRouter from './routes/session.js'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

// When the web app has been built (npm run build), the API serves it too, so
// one hosted service is enough. WEB_DIST overrides the folder.
const WEB_DIST = path.resolve(
  process.env.WEB_DIST || path.join(currentDirectory, '..', '..', 'dist'),
)

export function createApp() {
  const app = express()
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.disable('x-powered-by')

  // Hosting providers put a proxy in front of the app. Trusting it lets rate
  // limiting see the visitor's real IP instead of the proxy's.
  if (process.env.TRUST_PROXY) {
    const hops = Number.parseInt(process.env.TRUST_PROXY, 10)
    app.set('trust proxy', Number.isFinite(hops) ? hops : true)
  }

  app.use(
    helmet({
      // The map loads tiles, fonts, and scripts from several origins, so a
      // strict CSP would break it. The other security headers still apply.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // Helmet's default "no-referrer" strips the Referer header from tile
      // requests, and OpenStreetMap's tile policy blocks anonymous apps with
      // "Access blocked" tiles. Sending the origin keeps the map working.
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  )

  app.use(cors({ origin: allowedOrigins }))

  // Camera photos arrive as base64 inside JSON, so the limit is generous.
  app.use(express.json({ limit: '4mb' }))

  app.get(
    '/health',
    asyncHealth(async () => {
      await pool.query('SELECT 1')
    }),
  )

  app.use('/v1', createRateLimiter({ windowMs: 15 * 60_000, limit: 600 }))
  app.use('/v1/session', createRateLimiter({ windowMs: 60 * 60_000, limit: 30 }))
  app.post('/v1/issues', createRateLimiter({ windowMs: 60 * 60_000, limit: 12 }))

  if (PHOTO_STORAGE === 'disk') {
    app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', immutable: true }))
  }

  app.use(attachUser)
  app.use('/v1/session', sessionRouter)
  app.use('/v1/issues', issuesRouter)
  app.use('/v1/photos', photosRouter)
  app.use('/v1/civic-area', civicRouter)
  app.use('/v1/admin', adminRouter)

  app.use('/v1', (request, response) => {
    response.status(404).json({ error: 'Not found' })
  })

  if (existsSync(path.join(WEB_DIST, 'index.html'))) {
    app.use(express.static(WEB_DIST, { maxAge: '1h', index: 'index.html' }))

    // Any other path is a client-side route: hand back the app shell.
    app.get('*', (request, response) => {
      response.sendFile(path.join(WEB_DIST, 'index.html'))
    })
  } else {
    app.use((request, response) => {
      response.status(404).json({ error: 'Not found' })
    })
  }

  app.use(errorHandler)

  return app
}

function createRateLimiter({ windowMs, limit }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down and try again shortly.' },
  })
}

function asyncHealth(check) {
  return async (request, response) => {
    try {
      await check()
      response.json({ ok: true, database: 'up', photoStorage: PHOTO_STORAGE })
    } catch {
      response.status(503).json({ ok: false, database: 'down' })
    }
  }
}
