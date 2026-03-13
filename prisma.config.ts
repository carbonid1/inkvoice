import { defineConfig } from 'prisma/config'

// Default: data/inkvoice-dev.db (dev)
// Override: INKVOICE_DB_PATH=data/inkvoice.db (prod)
const dbFile = process.env.INKVOICE_DB_PATH || 'data/inkvoice-dev.db'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: `file:${dbFile}`,
  },
})
