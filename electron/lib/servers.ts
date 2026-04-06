import { ChildProcess, spawn, spawnSync } from 'child_process'
import path from 'path'
import { paths } from './paths'
import { Ports } from './ports'

const LOCALHOST = '127.0.0.1'
const HEALTH_POLL_INTERVAL_MS = 2_000
const STARTUP_TIMEOUT_MS = 5 * 60 * 1_000 // 5 minutes
const SHUTDOWN_GRACE_MS = 5_000

type ServerProcesses = {
  python: ChildProcess
  nextJs: ChildProcess
}

let processes: ServerProcesses | null = null

// macOS GUI apps get a minimal PATH that excludes Homebrew.
// Prepend common paths so spawned servers can find ffmpeg, etc.
const extendedPath = ['/opt/homebrew/bin', '/usr/local/bin', process.env.PATH].join(':')

const buildEnv = (ports: Ports): NodeJS.ProcessEnv => ({
  ...process.env,
  PATH: extendedPath,
  INKVOICE_BOOKS_DIR: paths.booksDir,
  INKVOICE_VOICES_DIR: paths.voicesDir,
  INKVOICE_CACHE_DIR: paths.cacheDir,
  INKVOICE_DB_PATH: paths.dbPath,
  INKVOICE_TTS_API_URL: `http://${LOCALHOST}:${ports.python}/tts`,
  INKVOICE_DEVICE: 'mps',
})

const pipeProcessLogs = (proc: ChildProcess, label: string): void => {
  proc.stdout?.on('data', (data: Buffer) => console.log(`[${label}] ${data.toString().trimEnd()}`))
  proc.stderr?.on('data', (data: Buffer) => console.log(`[${label}] ${data.toString().trimEnd()}`))
  proc.on('exit', code => console.log(`[${label}] Exited with code ${code}`))
}

const runMigrations = (env: NodeJS.ProcessEnv): void => {
  console.log('[servers] Running database migrations...')
  const result = spawnSync(
    paths.bundledPython,
    [paths.bundledMigrateScript, paths.dbPath, paths.bundledMigrations],
    {
      env,
      stdio: 'pipe',
      timeout: 30_000,
    },
  )

  if (result.status !== 0) {
    const stderr = result.stderr?.toString() || 'unknown error'
    throw new Error(`Migration failed: ${stderr}`)
  }
  console.log('[servers] Migrations complete.')
}

const spawnPython = (env: NodeJS.ProcessEnv, port: number): ChildProcess => {
  console.log(`[servers] Starting Python TTS on port ${port}...`)

  const proc = spawn(
    paths.bundledPython,
    ['-m', 'uvicorn', 'api.app.main:app', '--host', LOCALHOST, '--port', port.toString()],
    {
      env: { ...env, INKVOICE_PARENT_PID: process.pid.toString() },
      cwd: path.dirname(paths.bundledApi),
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )

  pipeProcessLogs(proc, 'python')
  return proc
}

const spawnNextJs = (env: NodeJS.ProcessEnv, port: number): ChildProcess => {
  console.log(`[servers] Starting Next.js on port ${port}...`)

  const proc = spawn(paths.bundledNode, [paths.nextJsServer], {
    env: { ...env, PORT: port.toString(), HOSTNAME: LOCALHOST },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  pipeProcessLogs(proc, 'nextjs')
  return proc
}

const pollHealth = async (url: string, label: string, timeoutMs: number): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3_000)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (res.ok) {
        console.log(`[servers] ${label} is ready.`)
        return true
      }
    } catch {
      // Not ready yet
    } finally {
      clearTimeout(timeout)
    }
    await new Promise(r => setTimeout(r, HEALTH_POLL_INTERVAL_MS))
  }

  return false
}

export type StartResult = { ok: true; appUrl: string } | { ok: false; error: string }

export const startServers = async (ports: Ports): Promise<StartResult> => {
  const env = buildEnv(ports)

  try {
    runMigrations(env)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Migration failed: ${message}` }
  }

  const python = spawnPython(env, ports.python)
  const nextJs = spawnNextJs(env, ports.nextJs)
  processes = { python, nextJs }

  const [pythonReady, nextReady] = await Promise.all([
    pollHealth(`http://${LOCALHOST}:${ports.python}/health`, 'Python TTS', STARTUP_TIMEOUT_MS),
    pollHealth(`http://${LOCALHOST}:${ports.nextJs}`, 'Next.js', STARTUP_TIMEOUT_MS),
  ])

  if (!pythonReady || !nextReady) {
    const failed = [
      !pythonReady && 'TTS server (may need internet for first-launch model download)',
      !nextReady && 'Next.js server',
    ].filter(Boolean)
    return { ok: false, error: `Failed to start: ${failed.join(', ')}` }
  }

  return { ok: true, appUrl: `http://${LOCALHOST}:${ports.nextJs}` }
}

export const stopServers = (): void => {
  if (!processes) return
  console.log('[servers] Shutting down...')

  const { python, nextJs } = processes

  for (const proc of [python, nextJs]) {
    if (proc.exitCode === null) {
      proc.kill('SIGTERM')
    }
  }

  const killTimer = setTimeout(() => {
    for (const proc of [python, nextJs]) {
      if (proc.exitCode === null) {
        console.log('[servers] Force killing remaining process...')
        proc.kill('SIGKILL')
      }
    }
  }, SHUTDOWN_GRACE_MS)
  killTimer.unref()

  processes = null
}
