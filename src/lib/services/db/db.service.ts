import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { PrismaClient } from '../../../../generated/prisma'
import { env } from '../../config/env'

declare global {
  var prisma: PrismaClient | undefined
}

const adapter = new PrismaBetterSqlite3({ url: `file:${env.dbPath}` })

export const prisma = globalThis.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
