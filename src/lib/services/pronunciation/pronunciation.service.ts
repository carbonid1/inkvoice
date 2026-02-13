import fs from 'fs/promises'
import path from 'path'
import { applyPronunciations } from './applyPronunciations/applyPronunciations'
import type { PronunciationMap } from './pronunciation.types'

const PRONUNCIATIONS_FILE = path.join(process.cwd(), 'data', 'pronunciations.json')

const getMap = async (): Promise<PronunciationMap> => {
  try {
    const data = await fs.readFile(PRONUNCIATIONS_FILE, 'utf-8')
    return JSON.parse(data) as PronunciationMap
  } catch {
    return {}
  }
}

const writeMap = async (map: PronunciationMap): Promise<void> => {
  await fs.writeFile(PRONUNCIATIONS_FILE, JSON.stringify(map, null, 2))
}

const apply = async (text: string): Promise<string> => {
  const map = await getMap()
  return applyPronunciations(text, map)
}

export const pronunciationService = {
  getMap,
  writeMap,
  apply,
}
