export type PlaybackMetrics = {
  isGenerating: boolean
  ahead: number
  cacheUsedMB: number
  cacheMaxMB: number
}

export type PositionMetrics = {
  currentSentence: number
  totalSentences: number
  currentChapter: number
  totalChapters: number
}

export type DebugMetrics = PlaybackMetrics & PositionMetrics
