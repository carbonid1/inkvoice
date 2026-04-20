import { Prisma } from '../../../../generated/prisma'

// Wrap a Prisma mutation (update/delete) so racing deletes don't throw.
//
// Prisma raises P2025 when `where` matches no row. For mutations on
// user-deletable records, this is a legitimate outcome, not an error —
// e.g. the pregen worker's progress update can race with a cache-clear
// that deletes the job row. Wrap the call, treat P2025 as "already gone",
// and return null so callers can branch on the outcome.
//
// Any other error (connection failure, constraint violation) still throws.
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
