import { createApp } from './app.js'
import {
  runMigrations,
  seedDemoDataIfEmpty,
  seedLocalities,
  seedWards,
  waitForDatabase,
} from './db.js'
import { ensureUploadDirectory } from './lib/photos.js'

const PORT = Number.parseInt(process.env.PORT || '4000', 10)

async function start() {
  await waitForDatabase()
  await runMigrations()
  await seedLocalities()
  await seedWards()

  const didSeed = await seedDemoDataIfEmpty()

  if (didSeed) {
    console.log('Seeded demo reports into the empty database.')
  }

  await ensureUploadDirectory()

  const app = createApp()

  app.listen(PORT, () => {
    console.log(`Citizen Connect API listening on http://localhost:${PORT}`)
  })
}

start().catch((error) => {
  console.error('Failed to start the API:', error)
  process.exit(1)
})
