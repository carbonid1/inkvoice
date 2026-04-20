import { Prisma } from '../../../../generated/prisma'

// Turn Prisma P2025 ("record not found") into null; rethrow anything else.
export const swallowRecordNotFound = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return null
    }
    throw error
  }
}
