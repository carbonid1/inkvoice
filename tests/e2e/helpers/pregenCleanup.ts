import type { APIRequestContext } from '@playwright/test'

export const cleanupPregenJobs = async (request: APIRequestContext) => {
  // Poll until no jobs remain (auto-recovery may be creating/processing jobs)
  for (let attempt = 0; attempt < 10; attempt++) {
    const res = await request.get('/api/pregenerate')
    if (!res.ok()) return

    const jobs = await res.json()
    if (jobs.length === 0) return

    for (const job of jobs) {
      await request.delete(`/api/pregenerate/${job.bookId}`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }
}
