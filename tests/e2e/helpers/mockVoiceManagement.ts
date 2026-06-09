import fs from 'fs'
import path from 'path'
import type { Page } from '@playwright/test'
import { slugifyVoiceName } from '@/lib/services/voice/helpers/slugifyVoiceName/slugifyVoiceName'
import type { VoiceSampleEvent } from '@/lib/services/voiceSampleEvents/voiceSampleEvents.types'

interface Voice {
  name: string
  displayName: string
  type: 'app' | 'custom'
  hasSample: boolean
  tags: string[]
}

const MOCK_VOICES: Voice[] = [
  {
    name: 'clara',
    displayName: 'Clara',
    type: 'app',
    hasSample: true,
    tags: ['female', 'american'],
  },
  {
    name: 'tony',
    displayName: 'Tony',
    type: 'app',
    hasSample: true,
    tags: ['male', 'american'],
  },
  {
    name: 'test-voice',
    displayName: 'Test Voice',
    type: 'custom',
    hasSample: false,
    tags: [],
  },
]

const silencePath = path.resolve(__dirname, '../../fixtures/silence.wav')

export const mockVoiceManagement = async (page: Page) => {
  const uploadedVoices: Voice[] = []
  const designedVoices: Voice[] = []
  const deletedNames = new Set<string>()
  const samplesReady = new Set<string>()
  const sampleEvents: VoiceSampleEvent[] = []
  const silenceBuffer = fs.readFileSync(silencePath)
  const allVoices = () => [...MOCK_VOICES, ...uploadedVoices, ...designedVoices]
  const findVoice = (name: string) => allVoices().find(v => v.name === name)

  await page.route('**/api/voices', (route, request) => {
    const method = request.method()

    if (method === 'GET') {
      const visible = allVoices()
        .filter(v => !deletedNames.has(v.name))
        .map(v => ({ ...v, hasSample: v.hasSample || samplesReady.has(v.name) }))

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(visible),
      })
      return
    }

    if (method === 'POST') {
      const postData = request.postData() ?? ''
      const nameMatch = postData.match(/name="name"\r?\n\r?\n([^\r\n]+)/)
      const displayName = nameMatch?.[1]?.trim() ?? 'Unknown'
      const name = slugifyVoiceName(displayName)

      const existing = findVoice(name)

      if (existing && !deletedNames.has(name)) {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Voice name already taken', code: 'NAME_TAKEN' }),
        })
        return
      }

      const voice: Voice = {
        name,
        displayName,
        type: 'custom',
        hasSample: false,
        tags: [],
      }

      uploadedVoices.push(voice)

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name,
          displayName,
          durationSeconds: 10,
          transcription: null,
          tags: [],
        }),
      })
      return
    }

    route.fallback()
  })

  await page.route('**/api/voices/design', (route, request) => {
    if (request.method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        body: silenceBuffer,
      })
      return
    }
    route.fallback()
  })

  await page.route('**/api/voices/design/save', (route, request) => {
    if (request.method() === 'POST') {
      const postData = request.postData() ?? ''
      const nameMatch = postData.match(/name="name"\r?\n\r?\n([^\r\n]+)/)
      const displayName = nameMatch?.[1]?.trim() ?? 'Designed Voice'
      const name = slugifyVoiceName(displayName)

      const existing = findVoice(name)

      if (existing && !deletedNames.has(name)) {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Voice name already taken', code: 'NAME_TAKEN' }),
        })
        return
      }

      designedVoices.push({
        name,
        displayName,
        type: 'custom',
        hasSample: false,
        tags: [],
      })

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name, displayName }),
      })
      return
    }
    route.fallback()
  })

  // Mock PUT /api/voices/{name}/transcript — accepts and acknowledges the saved transcription
  await page.route('**/api/voices/*/transcript', (route, request) => {
    if (request.method() === 'PUT') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      })
      return
    }
    route.fallback()
  })

  // Mock POST /api/voices/{name}/preview — returns silence audio
  await page.route('**/api/voices/*/preview', (route, request) => {
    if (request.method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'audio/ogg',
        body: silenceBuffer,
      })
      return
    }
    route.fallback()
  })

  // Mock DELETE and PATCH /api/voices/{name}
  await page.route('**/api/voices/*', (route, request) => {
    const method = request.method()
    const url = new URL(request.url())
    const segments = url.pathname.split('/')
    const name = segments[segments.length - 1] ?? ''

    // Skip sub-routes (source, sample, tags)
    if (['source', 'sample', 'tags'].includes(name)) {
      route.fallback()
      return
    }

    if (method === 'DELETE') {
      deletedNames.add(name)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    if (method === 'PATCH') {
      deletedNames.delete(name)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    route.fallback()
  })

  // route.fulfill can't hold a stream open, so the EventSource sees a complete
  // body and reconnects after `retry`. Each connect replays every event so far
  // (the real endpoint replays recent outcomes too); the client dedupes.
  await page.route('**/api/voices/sample-events', route => {
    const frames = sampleEvents
      .map(event => `event: sample\ndata: ${JSON.stringify(event)}\n\n`)
      .join('')

    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: `retry: 100\n\n${frames}`,
    })
  })

  // Mock voice audio routes
  await page.route('**/api/voices/*/source', route => {
    route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      body: silenceBuffer,
    })
  })

  await page.route('**/api/voices/*/sample', (route, request) => {
    const url = new URL(request.url())
    const segments = url.pathname.split('/')
    const voiceName = segments[segments.length - 2] ?? ''
    const method = request.method()

    const voice = findVoice(voiceName)
    const hasSample = voice?.hasSample || samplesReady.has(voiceName)

    if (method === 'HEAD') {
      route.fulfill({ status: hasSample ? 200 : 404 })
      return
    }

    if (hasSample) {
      route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        body: silenceBuffer,
      })
    } else {
      route.fulfill({ status: 404 })
    }
  })

  // Mock tags endpoint
  await page.route('**/api/voices/*/tags', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    })
  })

  return {
    getUploadedVoices: () => [...uploadedVoices],
    getDesignedVoices: () => [...designedVoices],
    getDeletedNames: () => new Set(deletedNames),
    markSampleReady: (voiceName: string) => {
      samplesReady.add(voiceName)
      sampleEvents.push({ type: 'sample', voiceName, status: 'ready' })
    },
  }
}
