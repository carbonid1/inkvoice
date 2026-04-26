import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { E2E_DATA_DIR } from './e2e.consts'

const globalSetup = () => {
  rmSync(E2E_DATA_DIR, { recursive: true, force: true })

  mkdirSync(resolve(E2E_DATA_DIR, 'books'), { recursive: true })
  mkdirSync(resolve(E2E_DATA_DIR, 'cache', 'tts'), { recursive: true })

  // Symlink instead of copy — tests only read voice files, never write
  const voicesLink = resolve(E2E_DATA_DIR, 'voices')

  symlinkSync(relative(E2E_DATA_DIR, resolve('data/voices')), voicesLink)

  copyFileSync(
    resolve('tests/fixtures/test-book.epub'),
    resolve(E2E_DATA_DIR, 'books/test-book.epub'),
  )

  const dbPath = resolve(E2E_DATA_DIR, 'test.db')

  execSync('pnpx prisma migrate deploy', {
    env: { ...process.env, INKVOICE_DB_PATH: dbPath },
    stdio: 'pipe',
  })
}

export default globalSetup
