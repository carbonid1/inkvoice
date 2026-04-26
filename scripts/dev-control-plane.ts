// Dev-mode standalone runner for the Python TTS lifecycle.
// Mirrors what electron/lib/servers.ts does in production, minus the
// Electron-specific paths (uses ./venv/bin/python3.11 and the source
// api/ dir directly). Spawn it from scripts/start.sh; export the URL
// it prints into INKVOICE_PYTHON_CONTROL_URL for the Next.js process.

import { type ChildProcess, spawn } from 'child_process'
import path from 'path'
import { startControlServer } from '../electron/lib/controlServer.ts'
import { findAvailablePort } from '../electron/lib/ports.ts'
import { createPythonLifecycle } from '../electron/lib/pythonLifecycle.ts'

// Resolved at runtime via INKVOICE_PROJECT_ROOT (set by scripts/start.sh) since
// the bundled CJS lands in dist-electron/ and __dirname would point there.
const projectRoot = process.env.INKVOICE_PROJECT_ROOT ?? process.cwd()
const pythonBin = path.join(projectRoot, 'venv/bin/python3.11')

const HEALTH_POLL_INTERVAL_MS = 2_000
const STARTUP_TIMEOUT_MS = 5 * 60 * 1_000
const SHUTDOWN_GRACE_MS = 60_000
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1_000

const getIdleTimeoutMs = (): number => {
  const raw = process.env.INKVOICE_PYTHON_IDLE_MS
  const n = raw ? parseInt(raw, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_IDLE_TIMEOUT_MS
}

const spawnPython = (port: number): ChildProcess => {
  console.log(`[control-plane] Spawning Python TTS on port ${port}...`)
  const proc = spawn(
    pythonBin,
    ['-m', 'uvicorn', 'api.app.main:app', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONWARNINGS: 'ignore::UserWarning:multiprocessing.resource_tracker',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
  proc.stdout?.on('data', d => process.stdout.write(`[python] ${d.toString()}`))
  proc.stderr?.on('data', d => process.stderr.write(`[python] ${d.toString()}`))
  proc.on('exit', code => console.log(`[python] Exited with code ${code}`))
  return proc
}

const pollHealth = async (url: string, signal: AbortSignal): Promise<boolean> => {
  try {
    const res = await fetch(url, { signal })
    return res.ok
  } catch {
    return false
  }
}

const parsePortArg = (): number | undefined => {
  const i = process.argv.indexOf('--control-port')
  if (i < 0) return undefined
  const raw = process.argv[i + 1]
  if (!raw) return undefined
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const main = async (): Promise<void> => {
  const controlPort = parsePortArg() ?? (await findAvailablePort())

  const lifecycle = createPythonLifecycle({
    spawn: spawnPython,
    findAvailablePort,
    pollHealth,
    idleTimeoutMs: getIdleTimeoutMs(),
    shutdownGraceMs: SHUTDOWN_GRACE_MS,
    startupTimeoutMs: STARTUP_TIMEOUT_MS,
    healthPollIntervalMs: HEALTH_POLL_INTERVAL_MS,
  })

  const server = await startControlServer(lifecycle, controlPort)
  console.log(`[control-plane] Listening at ${server.url}`)
  console.log(`INKVOICE_PYTHON_CONTROL_URL=${server.url}`)

  const cleanup = (): void => {
    console.log('[control-plane] Shutting down...')
    lifecycle.forceStop()
    server.close()
    setTimeout(() => process.exit(0), 200)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main().catch(err => {
  console.error('[control-plane] Failed to start:', err)
  process.exit(1)
})
