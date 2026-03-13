import { prisma } from '../db/db.service'

const getAll = async (): Promise<Record<string, unknown>> => {
  const rows = await prisma.userSetting.findMany()
  const result: Record<string, unknown> = {}
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value)
  }
  return result
}

const get = async (key: string): Promise<unknown | null> => {
  const row = await prisma.userSetting.findUnique({ where: { key } })
  if (!row) return null
  return JSON.parse(row.value)
}

const set = async (key: string, value: unknown): Promise<void> => {
  const serialized = JSON.stringify(value)
  await prisma.userSetting.upsert({
    where: { key },
    create: { key, value: serialized },
    update: { value: serialized },
  })
}

const remove = async (key: string): Promise<boolean> => {
  const result = await prisma.userSetting.deleteMany({ where: { key } })
  return result.count > 0
}

export const settingsService = { getAll, get, set, remove }
