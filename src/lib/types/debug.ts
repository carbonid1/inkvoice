export type PlaybackMetrics = {
  isGenerating: boolean
  ahead: number
  cacheUsedMB: number
  cacheMaxMB: number
}

export type PositionMetrics = {
  currentParagraph: number
  totalParagraphs: number
  currentChapter: number
  totalChapters: number
}

export type DebugMetrics = PlaybackMetrics & PositionMetrics
