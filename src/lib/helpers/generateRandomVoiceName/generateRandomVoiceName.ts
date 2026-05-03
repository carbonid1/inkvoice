import { ADJECTIVES, NOUNS } from './generateRandomVoiceName.consts'

const pick = <T>(items: ReadonlyArray<T>): T => {
  const value = items[Math.floor(Math.random() * items.length)]

  if (value === undefined) throw new Error('Cannot pick from an empty list')
  return value
}

export const generateRandomVoiceName = (): string => `${pick(ADJECTIVES)}-${pick(NOUNS)}`
