import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const isDev = !app.isPackaged

const getResourcePath = (...segments: string[]): string =>
  isDev ? path.join(app.getAppPath(), ...segments) : path.join(process.resourcesPath, ...segments)

const getUserDataPath = (...segments: string[]): string => {
  if (isDev) {
    return path.join(app.getAppPath(), 'data', ...segments)
  }
  return path.join(app.getPath('userData'), ...segments)
}

export const paths = {
  isDev,

  // Bundled resources (read-only in production)
  bundledNode: getResourcePath('bin', 'node'),
  bundledNextJs: getResourcePath('nextjs'),
  bundledPython: getResourcePath('python', 'bin', 'python3.11'),
  bundledApi: getResourcePath('api'),
  bundledVoices: getResourcePath('voices'),
  bundledStarterBooks: getResourcePath('starter-books'),
  bundledMigrations: getResourcePath('migrations'),
  bundledMigrateScript: getResourcePath('migrate.py'),
  nextJsServer: getResourcePath('nextjs', 'server.js'),

  // User data (read-write, persists across installs)
  userData: getUserDataPath(),
  booksDir: getUserDataPath('books'),
  voicesDir: getUserDataPath('voices'),
  cacheDir: getUserDataPath('cache', 'tts'),
  dbPath: getUserDataPath('inkvoice.db'),

  // Loading screen (inside ASAR at /electron/loading.html)
  loadingHtml: path.join(app.getAppPath(), 'electron', 'loading.html'),
}

export const ensureDirectories = (): void => {
  const dirs = [paths.booksDir, paths.voicesDir, paths.cacheDir]
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
