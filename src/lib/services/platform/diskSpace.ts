import fs from 'fs/promises'

import type { DiskSpaceInfo } from './diskSpace.types'

const getAvailableSpace = async (dir: string): Promise<DiskSpaceInfo> => {
  const stats = await fs.statfs(dir)
  const available = stats.bavail * stats.bsize
  const total = stats.blocks * stats.bsize

  return {
    available,
    total,
    percentFree: total === 0 ? 0 : Math.round((available / total) * 10000) / 100,
  }
}

export const diskSpaceService = {
  getAvailableSpace,
}
