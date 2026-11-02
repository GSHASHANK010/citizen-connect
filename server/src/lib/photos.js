import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { query } from '../db.js'
import { badRequest } from './errors.js'

// 'database' (default) keeps the API stateless so it can run on hosts that
// wipe their disk on every deploy. 'disk' writes files under UPLOAD_DIR.
export const PHOTO_STORAGE = process.env.PHOTO_STORAGE === 'disk' ? 'disk' : 'database'
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads')

const DATA_URL_PATTERN = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024

export async function ensureUploadDirectory() {
  if (PHOTO_STORAGE === 'disk') {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// The camera step sends a base64 data URL. We decode it to real bytes and
// keep only its public path in the issues table.
export async function savePhotoFromDataUrl(dataUrl) {
  const match = DATA_URL_PATTERN.exec(dataUrl || '')

  if (!match) {
    throw badRequest('A live camera photo is required.')
  }

  const extension = match[1] === 'jpg' ? 'jpeg' : match[1]
  const bytes = Buffer.from(match[2], 'base64')

  if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) {
    throw badRequest('Photo must be between 1 byte and 2.5 MB.')
  }

  if (PHOTO_STORAGE === 'disk') {
    const fileName = `${randomUUID()}.${extension}`
    await writeFile(path.join(UPLOAD_DIR, fileName), bytes)
    return `/uploads/${fileName}`
  }

  const { rows } = await query(
    `INSERT INTO photos (content_type, bytes)
     VALUES ($1, $2)
  RETURNING id`,
    [`image/${extension}`, bytes],
  )

  return `/v1/photos/${rows[0].id}`
}

export async function findPhoto(photoId) {
  const { rows } = await query(
    'SELECT content_type, bytes FROM photos WHERE id = $1',
    [photoId],
  )

  return rows[0] || null
}
