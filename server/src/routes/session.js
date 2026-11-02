import { Router } from 'express'
import {
  createUser,
  findUserByToken,
  readBearerToken,
  serializeUser,
} from '../lib/auth.js'
import { asyncRoute } from '../lib/errors.js'

const router = Router()

// POST /v1/session
// If the browser already sends a valid token, we return that same neighbour.
// Otherwise we create a new anonymous neighbour and hand back a fresh token.
router.post(
  '/',
  asyncRoute(async (request, response) => {
    const existingToken = readBearerToken(request)
    const existingUser = await findUserByToken(existingToken)

    if (existingUser) {
      response.json({ token: existingToken, user: serializeUser(existingUser), isNew: false })
      return
    }

    const { user, token } = await createUser()
    response.status(201).json({ token, user: serializeUser(user), isNew: true })
  }),
)

export default router
