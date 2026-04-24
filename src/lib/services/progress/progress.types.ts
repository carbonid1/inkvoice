import { z } from 'zod'

export const progressSchema = z.object({
  chapter: z.number().int().nonnegative(),
  paragraph: z.number().int().nonnegative(),
  paragraphsPerChapter: z.array(z.number()).optional(),
  wordsPerChapter: z.array(z.number()).optional(),
  lastReadAt: z.number().optional(),
  finishedAt: z.number().nullable().optional(),
  chapterPositions: z.record(z.string(), z.number()).optional(),
})

export type Progress = z.infer<typeof progressSchema>
