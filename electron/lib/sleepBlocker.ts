import { spawn, type ChildProcess } from 'child_process'
import { powerSaveBlocker } from 'electron'

type SleepBlocker = {
  start: () => void
  stop: () => void
}

const createMacBlocker = (): SleepBlocker => {
  let process: ChildProcess | null = null

  return {
    start: () => {
      if (process) return
      process = spawn('caffeinate', ['-di'], { stdio: 'ignore' })
      process.on('error', err => {
        console.error(`[sleep-blocker] caffeinate failed: ${err.message}`)
        process = null
      })
      console.log(`[sleep-blocker] caffeinate started (pid: ${process.pid})`)
    },
    stop: () => {
      if (!process) return
      console.log(`[sleep-blocker] caffeinate stopped (pid: ${process.pid})`)
      process.kill()
      process = null
    },
  }
}

const createWindowsBlocker = (): SleepBlocker => {
  let blockerId: number | null = null

  return {
    start: () => {
      if (blockerId !== null) return
      blockerId = powerSaveBlocker.start('prevent-display-sleep')
      console.log(`[sleep-blocker] powerSaveBlocker started (id: ${blockerId})`)
    },
    stop: () => {
      if (blockerId === null) return
      if (powerSaveBlocker.isStarted(blockerId)) {
        powerSaveBlocker.stop(blockerId)
        console.log(`[sleep-blocker] powerSaveBlocker stopped (id: ${blockerId})`)
      }
      blockerId = null
    },
  }
}

export const createSleepBlocker = (): SleepBlocker =>
  process.platform === 'darwin' ? createMacBlocker() : createWindowsBlocker()
