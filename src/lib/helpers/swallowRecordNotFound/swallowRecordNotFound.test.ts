import { describe, expect, it } from 'vitest'

import { Prisma } from '../../../../generated/prisma'

import { swallowRecordNotFound } from './swallowRecordNotFound'

const recordNotFound = (): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  })

describe('swallowRecordNotFound', () => {
  it('returns the value when the callback resolves', async () => {
    const result = await swallowRecordNotFound(async () => ({ id: 'x' }))

    expect(result).toEqual({ id: 'x' })
  })

  it('returns null when the callback throws P2025', async () => {
    const result = await swallowRecordNotFound(async () => {
      throw recordNotFound()
    })

    expect(result).toBeNull()
  })

  it('rethrows non-P2025 Prisma errors', async () => {
    const fail = swallowRecordNotFound(async () => {
      throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      })
    })

    await expect(fail).rejects.toMatchObject({ code: 'P2002' })
  })

  it('rethrows non-Prisma errors', async () => {
    const fail = swallowRecordNotFound(async () => {
      throw new Error('database is locked')
    })

    await expect(fail).rejects.toThrow('database is locked')
  })
})
