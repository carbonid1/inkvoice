'use client'

import { Button, Tooltip, toast } from '@carbonid1/design-system'
import { Info, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs/Tabs'
import { Textarea } from '@/components/ui/Textarea/Textarea'
import { useTTSLifecycleStore } from '@/lib/hooks/useTTSLifecycle/useTTSLifecycle'

const MAX_TRANSCRIPTION_CHARS = 600
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

const SOURCE_OPTIONS: ReadonlyArray<{ value: TextSource; label: string }> = [
  { value: 'transcription', label: 'Transcription' },
  { value: 'preset', label: 'Preset' },
  { value: 'custom', label: 'Custom' },
]

const isTextSource = (value: string): value is TextSource =>
  SOURCE_OPTIONS.some(option => option.value === value)

interface TranscriptionReviewProps {
  voiceName: string
  language: string
  languageWasAutoDetected: boolean
  initialTranscription: string
  onClose: () => void
}

export const TranscriptionReview = ({
  voiceName,
  language,
  languageWasAutoDetected,
  initialTranscription,
  onClose,
}: TranscriptionReviewProps) => {
  const [transcription, setTranscription] = useState(initialTranscription)
  const [customText, setCustomText] = useState('')
  const [textSource, setTextSource] = useState<TextSource>('transcription')
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const lifecycleState = useTTSLifecycleStore(s => s.state)

  const sourceAudioUrl = `/api/voices/${voiceName}/source?v=1`

  const isEdited = transcription.trim() !== initialTranscription.trim()

  const activePreviewLabel =
    lifecycleState === 'starting' || lifecycleState === 'stopped'
      ? 'Starting voice engine…'
      : 'Generating…'
  const previewLabel = !previewing ? 'Try it' : activePreviewLabel

  // Revoke any pending blob URL if the form closes without Save
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [],
  )

  const presetText = isPresetLanguage(language) ? PRESET_TEXTS[language] : PRESET_TEXTS.en

  const activeText: string = (() => {
    if (textSource === 'transcription') return transcription
    if (textSource === 'preset') return presetText
    return customText
  })()

  const handlePreview = async () => {
    if (!activeText.trim()) return
    setPreviewing(true)
    setPreviewError(null)

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

      if (previewAudioRef.current) {
        previewAudioRef.current.src = url
        previewAudioRef.current.play()
      }
    } catch {
      setPreviewError('Preview failed. The voice engine may still be warming up — try again.')
      toast('Preview failed', { description: 'Could not generate audio preview' })
    } finally {
      setPreviewing(false)
    }
  }

  const handleSave = () => {
    // OmniVoice reads source.txt as the reference text for cloning, so persist only the
    // edited transcription — never the preset/custom text used for previews.
    fetch(`/api/voices/${voiceName}/transcript`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: transcription }),
    }).catch(() => {
      // Non-fatal — OmniVoice will re-transcribe on first use if source.txt is missing
    })

    onClose()
  }

  const handleDiscardClick = () => {
    const confirmed = window.confirm(
      'Discard your transcription edits? The auto-transcription will be kept.',
    )

    if (!confirmed) return
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  const charCount = textSource === 'custom' ? customText.length : transcription.length
  const charLimit = textSource === 'custom' ? MAX_CUSTOM_CHARS : MAX_TRANSCRIPTION_CHARS

  return (
    <div className="space-y-4">
      <div className="border-border bg-background space-y-2 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Source audio
        </p>
        <audio
          src={sourceAudioUrl}
          controls
          preload="metadata"
          className="w-full"
          aria-label="Source recording for this voice"
        />
        {languageWasAutoDetected && (
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
            <Info className="mt-0.5 size-3 shrink-0" />
            Auto-detected — listen and confirm the transcription matches what you hear. If it&apos;s
            badly wrong, cancel and re-upload with the right language picked.
          </p>
        )}
      </div>

      <audio ref={previewAudioRef} className="hidden" />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Tabs
            value={textSource}
            onValueChange={value => {
              if (isTextSource(value)) setTextSource(value)
            }}
            aria-label="Preview text source"
          >
            <TabsList>
              {SOURCE_OPTIONS.map(option => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span
            className={`text-xs ${
              charCount > charLimit ? 'text-destructive' : 'text-muted-foreground'
            }`}
            aria-live="polite"
          >
            {charCount}/{charLimit}
          </span>
        </div>

        {textSource === 'transcription' && (
          <Textarea
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter the spoken text from your voice sample"
            rows={3}
            aria-label="Voice transcription"
          />
        )}

        {textSource === 'preset' && (
          <p className="text-muted-foreground border-border bg-muted/40 rounded-md border p-3 text-sm leading-relaxed">
            {presetText}
          </p>
        )}

        {textSource === 'custom' && (
          <Textarea
            value={customText}
            onChange={e => {
              if (e.target.value.length <= MAX_CUSTOM_CHARS) setCustomText(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type any text to preview the new voice"
            rows={3}
            aria-label="Custom preview text"
          />
        )}
      </div>

      {previewError && (
        <p className="text-destructive text-sm" role="alert">
          {previewError}
        </p>
      )}

      <div className="flex items-center gap-2">
        {isEdited ? (
          <Button variant="primary" size="default" onClick={handleSave}>
            Save voice
          </Button>
        ) : (
          <Button variant="primary" size="default" onClick={onClose}>
            Done
          </Button>
        )}
        <Tooltip
          label="Hear this voice read the text above. Switch tabs to use the auto-transcription, a literary preset, or your own line."
          maxWidth={300}
        >
          <Button
            variant="outline"
            size="default"
            onClick={handlePreview}
            disabled={!activeText.trim() || previewing}
            loading={previewing}
          >
            {!previewing && <Play />}
            {previewLabel}
          </Button>
        </Tooltip>
        {isEdited && (
          <Tooltip label="Discard your edits and keep the auto-transcription">
            <Button variant="ghost" size="default" onClick={handleDiscardClick}>
              Discard
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
