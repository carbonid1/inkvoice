import { powerSaveBlocker } from 'electron'

type SleepBlocker = {
  start: () => void
  stop: () => void
}

export const createSleepBlocker = (): SleepBlocker => {
  let blockerId: number | null = null

  return {
    start: () => {
      if (blockerId !== null) return
      blockerId = powerSaveBlocker.start('prevent-display-sleep')
      console.log(`[sleep-blocker] started (id: ${blockerId})`)
    },
    stop: () => {
      if (blockerId === null) return
      if (powerSaveBlocker.isStarted(blockerId)) {
        powerSaveBlocker.stop(blockerId)
        console.log(`[sleep-blocker] stopped (id: ${blockerId})`)
      }
      blockerId = null
    },
  }
}
