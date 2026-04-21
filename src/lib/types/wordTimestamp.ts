import { z } from 'zod'

export const wordTimestampSchema = z.object({
  w: z.string(),
  s: z.number(),
  e: z.number(),
})

export const wordTimestampArraySchema = z.array(wordTimestampSchema)

export type WordTimestamp = z.infer<typeof wordTimestampSchema>
