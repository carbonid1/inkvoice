import type { Page } from '@playwright/test'

export const mockVoicePreferences = async (page: Page) => {
  const GLOBAL_KEY = '__global__'
  const preferences = new Map<string, string>()

  await page.route('**/api/voice-preferences', (route, request) => {
    const method = request.method()

    if (method === 'GET') {
      let voice = 'narrator'
      const bookVoices: Record<string, string> = {}

      preferences.forEach((voiceName, bookId) => {
        if (bookId === GLOBAL_KEY) {
          voice = voiceName
        } else {
          bookVoices[bookId] = voiceName
        }
      })

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ voice, bookVoices }),
      })
      return
    }

    if (method === 'DELETE') {
      const url = new URL(request.url())
      const voiceName = url.searchParams.get('voiceName')
      if (voiceName) {
        const toDelete: string[] = []
        preferences.forEach((name, bookId) => {
          if (name === voiceName) toDelete.push(bookId)
        })
        toDelete.forEach(bookId => preferences.delete(bookId))
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deleted: 0 }),
      })
      return
    }

    route.continue()
  })

  await page.route('**/api/voice-preferences/**', async (route, request) => {
    const method = request.method()
    const url = new URL(request.url())
    const segments = url.pathname.split('/')
    const bookId = segments[segments.length - 1] ?? ''

    if (method === 'PUT') {
      const body = request.postDataJSON() as { voiceName: string }
      preferences.set(bookId, body.voiceName)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    if (method === 'DELETE') {
      preferences.delete(bookId)
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      })
      return
    }

    route.continue()
  })
}
