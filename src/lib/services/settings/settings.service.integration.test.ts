import { describe, expect, it } from 'vitest'
import { settingsService } from './settings.service'

describe('settingsService (integration)', () => {
  it('roundtrips strings, numbers, booleans, and objects through JSON', async () => {
    await settingsService.set('display.fontSize', 'large')
    await settingsService.set('prefetch.enabled', false)
    await settingsService.set('cache.maxMB', 5120)
    await settingsService.set('layout.padding', { top: 10, bottom: 20 })

    const all = await settingsService.getAll()

    expect(all).toEqual({
      'display.fontSize': 'large',
      'prefetch.enabled': false,
      'cache.maxMB': 5120,
      'layout.padding': { top: 10, bottom: 20 },
    })
  })

  it('get returns the parsed value for a known key, null for unknown', async () => {
    await settingsService.set('display.fontSize', 'medium')

    expect(await settingsService.get('display.fontSize')).toBe('medium')
    expect(await settingsService.get('unknown.key')).toBeNull()
  })

  it('set overwrites an existing value', async () => {
    await settingsService.set('prefetch.enabled', true)
    await settingsService.set('prefetch.enabled', false)

    expect(await settingsService.get('prefetch.enabled')).toBe(false)
  })

  it('returns false when removing a setting that does not exist', async () => {
    expect(await settingsService.remove('unknown')).toBe(false)
  })
})
