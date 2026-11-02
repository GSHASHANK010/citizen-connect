import { Router } from 'express'
import { asyncRoute, notFound } from '../lib/errors.js'
import { findPhoto } from '../lib/photos.js'

const router = Router()
const UUID_PATTERN = /^[0-9a-f-]{36}$/i

// GET /v1/photos/:id — serves a photo stored in the database.
router.get(
  '/:id',
  asyncRoute(async (request, response) => {
    if (!UUID_PATTERN.test(request.params.id)) {
      throw notFound('Photo not found')
    }

    const photo = await findPhoto(request.params.id)

    if (!photo) {
      throw notFound('Photo not found')
    }

    response.set('Content-Type', photo.content_type)
    response.set('Cache-Control', 'public, max-age=604800, immutable')
    response.send(photo.bytes)
  }),
)

export default router
