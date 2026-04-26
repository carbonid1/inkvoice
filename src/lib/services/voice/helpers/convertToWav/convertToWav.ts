import { execFile } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

interface ConvertSuccess {
  ok: true
  buffer: Buffer
}
interface ConvertError {
  ok: false
  code: 'UNSUPPORTED_FORMAT' | 'CONVERSION_FAILED'
  message: string
}
export type ConvertResult = ConvertSuccess | ConvertError

const SUPPORTED_EXTENSIONS = ['wav', 'mp3', 'm4a', 'ogg', 'flac'] as const

const getExtension = (filename: string): string =>
  path.extname(filename).toLowerCase().replace('.', '')

export const convertToWav = async (
  inputBuffer: Buffer,
  originalFilename: string,
): Promise<ConvertResult> => {
  const ext = getExtension(originalFilename)

  if (!SUPPORTED_EXTENSIONS.some(v => v === ext)) {
    return {
      ok: false,
      code: 'UNSUPPORTED_FORMAT',
      message: `Unsupported format ".${ext}". Accepted: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    }
  }

  const tmpDir = await mkdtemp(path.join(tmpdir(), 'inkvoice-convert-'))
  const inputPath = path.join(tmpDir, `input.${ext}`)
  const outputPath = path.join(tmpDir, 'output.wav')

  try {
    await writeFile(inputPath, inputBuffer)

    await new Promise<void>((resolve, reject) => {
      execFile(
        'ffmpeg',
        ['-i', inputPath, '-ar', '22050', '-ac', '1', '-sample_fmt', 's16', '-y', outputPath],
        { timeout: 30000 },
        error => {
          if (error) reject(error)
          else resolve()
        },
      )
    })

    const outputBuffer = await readFile(outputPath)

    return { ok: true, buffer: outputBuffer }
  } catch {
    return {
      ok: false,
      code: 'CONVERSION_FAILED',
      message: 'Failed to convert audio file. Ensure the file is a valid audio format.',
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}
