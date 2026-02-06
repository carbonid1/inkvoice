import { type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const silencePath = path.resolve(__dirname, '../../fixtures/silence.wav')

export const mockTTS = async (page: Page) => {
  const silenceBuffer = fs.readFileSync(silencePath)

  await page.route('**/api/tts/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      body: silenceBuffer,
      headers: {
        'X-Cache': 'MOCK',
        'X-Cache-Used': '1000000',
        'X-Cache-Max': '800000000',
      },
    })
  })
}
