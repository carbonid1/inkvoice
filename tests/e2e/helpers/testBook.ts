import type { APIRequestContext } from '@playwright/test'
import { copyFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { E2E_DATA_DIR } from '../e2e.consts'

const FIXTURE_PATH = resolve('tests/fixtures/test-book.epub')
const DEST_PATH = resolve(E2E_DATA_DIR, 'books/test-book.epub')

export const TEST_BOOK_ID = 'test-book'

export const installTestBook = () => {
  copyFileSync(FIXTURE_PATH, DEST_PATH)
}

export const removeTestBook = async (request: APIRequestContext) => {
  await request.delete(`/api/pregenerate/${TEST_BOOK_ID}`).catch(() => {})

  try {
    unlinkSync(DEST_PATH)
  } catch {
    // File already removed
  }
}
