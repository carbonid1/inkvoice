import { DEFAULT_VOICE } from '@/lib/services/voice/voice.consts'
import { prisma } from '../db/db.service'

const GLOBAL_KEY = '__global__'

const getAll = async (): Promise<{ voice: string; bookVoices: Record<string, string> }> => {
  const rows = await prisma.voicePreference.findMany()

  let voice = DEFAULT_VOICE
  const bookVoices: Record<string, string> = {}

  for (const row of rows) {
    if (row.bookId === GLOBAL_KEY) {
      voice = row.voiceName
    } else {
      bookVoices[row.bookId] = row.voiceName
    }
  }

  return { voice, bookVoices }
}

const set = async (bookId: string, voiceName: string): Promise<void> => {
  await prisma.voicePreference.upsert({
    where: { bookId },
    create: { bookId, voiceName },
    update: { voiceName },
  })
}

const remove = async (bookId: string): Promise<boolean> => {
  const result = await prisma.voicePreference.deleteMany({ where: { bookId } })
  return result.count > 0
}

const removeByVoiceName = async (voiceName: string): Promise<number> => {
  const result = await prisma.voicePreference.deleteMany({ where: { voiceName } })
  return result.count
}

export const voicePreferenceService = { getAll, set, remove, removeByVoiceName }
