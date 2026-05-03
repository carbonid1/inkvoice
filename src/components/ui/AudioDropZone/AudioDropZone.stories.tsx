import { useState } from 'react'
import { expect, fn, userEvent } from 'storybook/test'
import preview from '#.storybook/preview'
import { AudioDropZone } from './AudioDropZone'

const ACCEPT = '.wav,.mp3,.m4a,.ogg,.flac'
const HINT = 'WAV, MP3, M4A, OGG, FLAC · 10–20 seconds'

const makeFile = (name = 'sample.wav') =>
  new File([new Uint8Array([0x52, 0x49, 0x46, 0x46])], name, { type: 'audio/wav' })

interface Args {
  initialFile: File | null
  durationSeconds: number | null
  durationError?: string | null
  disabled?: boolean
  onFileChange: (file: File | null) => void
}

const Controlled = ({
  initialFile,
  durationSeconds,
  durationError,
  disabled,
  onFileChange,
}: Args) => {
  const [file, setFile] = useState<File | null>(initialFile)

  return (
    <div className="w-[640px]">
      <AudioDropZone
        file={file}
        onFileChange={next => {
          setFile(next)
          onFileChange(next)
        }}
        accept={ACCEPT}
        acceptHint={HINT}
        durationSeconds={file ? durationSeconds : null}
        minSeconds={10}
        maxSeconds={20}
        durationError={durationError ?? null}
        disabled={disabled}
      />
    </div>
  )
}

const meta = preview.meta({
  component: Controlled,
  args: {
    initialFile: null,
    durationSeconds: null,
    onFileChange: fn(),
  },
})

/** Empty drop zone — the entry point users see before picking a file. */
export const Empty = meta.story({})

Empty.test('shows drop instructions and accepted-format hint', ({ canvas }) => {
  expect(canvas.getByText(/Drop audio here/i)).toBeInTheDocument()
  expect(canvas.getByText(HINT)).toBeInTheDocument()
})

/** A valid file is selected — file chip with duration, audio scrubber, replace + remove. */
export const ValidFile = meta.story({
  args: {
    initialFile: makeFile('marusia_r_ai.wav'),
    durationSeconds: 15,
  },
})

ValidFile.test('renders filename and duration badge', ({ canvas }) => {
  expect(canvas.getByText('marusia_r_ai.wav')).toBeInTheDocument()
  expect(canvas.getByText('15.0s')).toBeInTheDocument()
})

ValidFile.test('does not show a duration error', ({ canvas }) => {
  expect(canvas.queryByText(/Audio must be/)).not.toBeInTheDocument()
})

ValidFile.test('clicking remove clears the file', async ({ canvas, args }) => {
  await userEvent.click(canvas.getByLabelText('Remove file'))
  expect(args.onFileChange).toHaveBeenLastCalledWith(null)
  expect(canvas.getByText(/Drop audio here/i)).toBeInTheDocument()
})

/** Selected file is outside the 10–20 s range — chip turns destructive with an inline error. */
export const InvalidDuration = meta.story({
  args: {
    initialFile: makeFile('long-take.wav'),
    durationSeconds: 27.5,
  },
})

InvalidDuration.test('surfaces the range violation inline', ({ canvas }) => {
  expect(canvas.getByText(/Audio must be 10–20 seconds \(got 27.5s\)/)).toBeInTheDocument()
})

/** Decode failed — the browser cannot read the file (wrong format, corrupt). */
export const ReadError = meta.story({
  args: {
    initialFile: makeFile('broken.wav'),
    durationSeconds: null,
    durationError: 'Could not read this audio file. Try a WAV, MP3, M4A, OGG, or FLAC.',
  },
})

ReadError.test('shows the custom error message', ({ canvas }) => {
  expect(canvas.getByText(/Could not read this audio file/)).toBeInTheDocument()
})

/** Disabled while an upload is in flight — replace + remove are blocked. */
export const Disabled = meta.story({
  args: {
    initialFile: makeFile('uploading.wav'),
    durationSeconds: 15,
    disabled: true,
  },
})

Disabled.test('disables Replace and Remove', ({ canvas }) => {
  expect(canvas.getByLabelText('Replace file')).toBeDisabled()
  expect(canvas.getByLabelText('Remove file')).toBeDisabled()
})
