'use client'

import { Button } from '@carbonid1/design-system'
import { Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const MAX_CUSTOM_CHARS = 500

type PresetLanguage = 'en' | 'ru' | 'uk'

const PRESET_TEXTS: Record<PresetLanguage, string> = {
  // Treasure Island — Robert Louis Stevenson, 1883
  en:
    'I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest ' +
    'following behind him in a hand-barrow — a tall, strong, heavy, nut-brown man, his tarry ' +
    'pigtail falling over the shoulder of his soiled blue coat, his hands ragged and scarred, ' +
    'with black, broken nails, and the sabre cut across one cheek, a dirty, livid white.',
  // Степь — Антон Чехов, 1888
  ru:
    'Из-за холмов неожиданно показалось пепельно-серое кудрявое облако. Оно переглянулось ' +
    'со степью — я, мол, готово — и нахмурилось. Вдруг в стоячем воздухе что-то порвалось, ' +
    'сильно рванул ветер и с шумом, со свистом закружился по степи. Тотчас же трава и прошлогодний ' +
    'бурьян подняли ропот, на дороге спирально закружилась пыль, побежала по степи и, увлекая ' +
    'за собой солому, стрекоз и перья, чёрным вертящимся столбом поднялась к небу и затуманила солнце.',
  // Тіні забутих предків — Михайло Коцюбинський, 1912
  uk:
    'Вони жили в глибокому, як криниця, селі, засипаному білим снігом. Воно було таке ' +
    'маленьке те село, що навіть чорти його не завжди знаходили. Не було де розгорнутись. ' +
    'Гори стояли навколо нього, неприступні, вкриті лісом. Вони підпирали небо, і тільки ' +
    'над самим селом воно було відкрите, щоб міг Бог заглянути в цю дивну долину.',
}

const isPresetLanguage = (language: string): language is PresetLanguage => language in PRESET_TEXTS

type TextSource = 'transcription' | 'preset' | 'custom'

const SOURCE_OPTIONS: Array<{ value: TextSource; label: string }> = [
  { value: 'transcription', label: 'Transcription' },
  { value: 'preset', label: 'Preset' },
  { value: 'custom', label: 'Custom' },
]

type TranscriptionReviewProps = {
  voiceName: string
  language: string
  initialTranscription: string
  onDone: () => void
}

export const TranscriptionReview = ({
  voiceName,
  language,
  initialTranscription,
  onDone,
}: TranscriptionReviewProps) => {
  const [transcription, setTranscription] = useState(initialTranscription)
  const [customText, setCustomText] = useState('')
  const [textSource, setTextSource] = useState<TextSource>('transcription')
  const [previewing, setPreviewing] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Revoke any pending blob URL if the form closes without Save
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  const presetText = isPresetLanguage(language) ? PRESET_TEXTS[language] : PRESET_TEXTS.en

  const activeText: string =
    textSource === 'transcription'
      ? transcription
      : textSource === 'preset'
        ? presetText
        : customText

  const handlePreview = async () => {
    if (!activeText.trim()) return
    setPreviewing(true)

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    try {
      const response = await fetch(`/api/voices/${voiceName}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: activeText.trim() }),
        cache: 'no-store',
      })

      if (!response.ok) throw new Error('Preview failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      previewUrlRef.current = url

      if (audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
    } catch {
      toast('Preview failed', { description: 'Could not generate audio preview' })
    } finally {
      setPreviewing(false)
    }
  }

  const handleSave = () => {
    // Persist the edited transcription — only what the user typed, never the preview/custom text,
    // since OmniVoice uses this as the reference text for the voice sample
    fetch(`/api/voices/${voiceName}/transcript`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcription }),
    }).catch(() => {
      // Non-fatal — OmniVoice will re-transcribe on first use if source.txt is missing
    })

    onDone()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <audio ref={audioRef} className="hidden" />

      <div className="flex items-center gap-1">
        {SOURCE_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            variant={textSource === value ? 'primary' : 'ghost'}
            size="small"
            onClick={() => setTextSource(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {textSource === 'transcription' && (
        <textarea
          value={transcription}
          onChange={e => setTranscription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter the spoken text from your voice sample"
          rows={3}
          className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-2 text-sm focus:border-transparent focus:ring-2"
        />
      )}

      {textSource === 'preset' && (
        <p className="text-muted-foreground border-border bg-accent/50 rounded-lg border p-2 text-sm">
          {presetText}
        </p>
      )}

      {textSource === 'custom' && (
        <div>
          <textarea
            value={customText}
            onChange={e => {
              if (e.target.value.length <= MAX_CUSTOM_CHARS) setCustomText(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type any text to preview"
            rows={3}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-2 text-sm focus:border-transparent focus:ring-2"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {customText.length}/{MAX_CUSTOM_CHARS}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" size="small" onClick={handleSave}>
          Save
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={handlePreview}
          disabled={!activeText.trim()}
          loading={previewing}
        >
          <Play className="size-3" />
          {previewing ? 'Generating...' : 'Preview'}
        </Button>
      </div>
    </div>
  )
}
