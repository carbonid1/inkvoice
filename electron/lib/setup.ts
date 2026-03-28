import fs from 'fs'
import path from 'path'
import { ensureDirectories, paths } from './paths'

const copyDirRecursive = (src: string, dest: string): void => {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    } else {
      // Don't overwrite existing files (user may have modified them)
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }
}

const copyStarterBooks = (): void => {
  const src = paths.bundledStarterBooks
  if (!fs.existsSync(src)) return

  const files = fs.readdirSync(src).filter(f => f.endsWith('.epub'))
  let copied = 0

  for (const file of files) {
    const destPath = path.join(paths.booksDir, file)
    const deletedPath = `${destPath}_deleted`

    // Skip if already present or user previously deleted it
    if (fs.existsSync(destPath) || fs.existsSync(deletedPath)) continue

    fs.copyFileSync(path.join(src, file), destPath)
    copied++
  }

  if (copied > 0) {
    console.log(`[setup] Copied ${copied} starter book(s).`)
  }
}

export const runFirstLaunchSetup = (): void => {
  // Create data directories
  ensureDirectories()

  // Copy bundled voices to user data on first launch
  if (fs.readdirSync(paths.voicesDir).length === 0) {
    console.log('[setup] First launch — copying bundled voices...')
    copyDirRecursive(paths.bundledVoices, paths.voicesDir)
    console.log('[setup] Voices copied.')
  }

  // Copy starter books (skips existing and previously deleted)
  copyStarterBooks()
}
