interface InkVoice {
  platform: string
  retry: () => void
  quit: () => void
  sleepBlockStart: () => void
  sleepBlockStop: () => void
}

interface Window {
  inkvoice?: InkVoice
}
