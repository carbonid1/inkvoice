import { describe, expect, it } from 'vitest'
import type { WordTimestamp } from '@/lib/types/wordTimestamp'
import { parseTimestampsHeader } from './parseTimestampsHeader'

const makeResponse = (headerValue: string | null): Response =>
  new Response(null, {
    headers: headerValue ? { 'X-Word-Timestamps': headerValue } : {},
  })

const asciiTimestamps: WordTimestamp[] = [
  { w: 'Hello', s: 0.18, e: 0.36 },
  { w: 'world,', s: 0.44, e: 0.64 },
  { w: 'test.', s: 0.92, e: 1.38 },
]

const unicodeTimestamps: WordTimestamp[] = [
  { w: 'delusions\u2014\u2019', s: 0.5, e: 1.0 },
  { w: '\u2018You', s: 1.1, e: 1.3 },
]

describe('parseTimestampsHeader', () => {
  it('returns null when header is missing', () => {
    expect(parseTimestampsHeader(makeResponse(null))).toBeNull()
  })

  it('parses plain JSON header (ASCII words)', () => {
    const json = JSON.stringify(asciiTimestamps)
    const result = parseTimestampsHeader(makeResponse(json))

    expect(result).toEqual(asciiTimestamps)
  })

  it('parses base64-encoded header', () => {
    const base64 = Buffer.from(JSON.stringify(asciiTimestamps)).toString('base64')
    const result = parseTimestampsHeader(makeResponse(base64))

    expect(result).toEqual(asciiTimestamps)
  })

  it('round-trips Unicode through base64 encoding', () => {
    const encoded = Buffer.from(JSON.stringify(unicodeTimestamps)).toString('base64')
    const result = parseTimestampsHeader(makeResponse(encoded))

    expect(result).toEqual(unicodeTimestamps)
  })

  it('returns null for malformed header', () => {
    expect(parseTimestampsHeader(makeResponse('not-json-or-base64{{{'))).toBeNull()
  })
})
