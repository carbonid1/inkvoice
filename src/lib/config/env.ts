import { join } from 'path'
import { z } from 'zod'

const envSchema = z.object({
  BOOKS_DIR: z.string().default(join(process.cwd(), 'data', 'books')),
  VOICES_DIR: z.string().default(join(process.cwd(), 'data', 'voices')),
  CACHE_DIR: z.string().default(join(process.cwd(), 'data', 'cache', 'tts')),
  DB_PATH: z.string().default(join(process.cwd(), 'data', 'inkvoice-dev.db')),
  MAX_CACHE_SIZE_MB: z.coerce.number().default(10240),
  TTS_API_URL: z.string().url().default('http://localhost:8000/tts'),
})

const loadEnv = () => {
  return envSchema.parse({
    BOOKS_DIR: process.env.INKVOICE_BOOKS_DIR,
    VOICES_DIR: process.env.INKVOICE_VOICES_DIR,
    CACHE_DIR: process.env.INKVOICE_CACHE_DIR,
    DB_PATH: process.env.INKVOICE_DB_PATH,
    MAX_CACHE_SIZE_MB: process.env.INKVOICE_MAX_CACHE_SIZE_MB,
    TTS_API_URL: process.env.INKVOICE_TTS_API_URL,
  })
}

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export const getEnv = (): Env => {
  if (!_env) {
    _env = loadEnv()
  }
  return _env
}

// Convenience exports for direct access
export const env = {
  get booksDir() {
    return getEnv().BOOKS_DIR
  },
  get voicesDir() {
    return getEnv().VOICES_DIR
  },
  get cacheDir() {
    return getEnv().CACHE_DIR
  },
  get maxCacheSizeBytes() {
    return getEnv().MAX_CACHE_SIZE_MB * 1024 * 1024
  },
  get dbPath() {
    return getEnv().DB_PATH
  },
  get ttsApiUrl() {
    return getEnv().TTS_API_URL
  },
}
