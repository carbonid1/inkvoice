import { describe, expect, it } from 'vitest'
import { endsWithAttribution, mergeDialogueChunks, startsWithQuote } from './mergeDialogueChunks'

describe('endsWithAttribution', () => {
  it('detects attribution after comma-quote', () => {
    expect(endsWithAttribution('"I\'m leaving," he said.')).toBe(true)
  })

  it('detects attribution after exclamation-quote', () => {
    expect(endsWithAttribution('"Watch out!" she screamed.')).toBe(true)
  })

  it('detects attribution after question-quote', () => {
    expect(endsWithAttribution('"Are you sure?" he asked.')).toBe(true)
  })

  it('detects attribution with adverb', () => {
    expect(endsWithAttribution('"Stop," she said quietly.')).toBe(true)
  })

  it('detects attribution with descriptive clause', () => {
    expect(
      endsWithAttribution('"I won\'t do it," she said, her voice barely above a whisper.'),
    ).toBe(true)
  })

  it('detects curly quotes', () => {
    expect(endsWithAttribution('\u201cHello,\u201d he said.')).toBe(true)
  })

  it('rejects sentence without quotes', () => {
    expect(endsWithAttribution('He walked away.')).toBe(false)
  })

  it('rejects action beat (no speech verb)', () => {
    expect(endsWithAttribution('"Stop!" He ran to the door.')).toBe(false)
  })

  it('rejects sentence ending in a quote with no tail', () => {
    expect(endsWithAttribution('"Hello."')).toBe(false)
  })

  it('ignores apostrophes in contractions', () => {
    expect(endsWithAttribution("It's his turn, he said.")).toBe(false)
  })
})

describe('startsWithQuote', () => {
  it('detects straight double quote', () => {
    expect(startsWithQuote('"Hello."')).toBe(true)
  })

  it('detects curly opening quote', () => {
    expect(startsWithQuote('\u201cHello.\u201d')).toBe(true)
  })

  it('detects single quote', () => {
    expect(startsWithQuote("'Hello.'")).toBe(true)
  })

  it('rejects non-quote start', () => {
    expect(startsWithQuote('He said hello.')).toBe(false)
  })

  it('handles leading whitespace', () => {
    expect(startsWithQuote('  "Hello."')).toBe(true)
  })
})

describe('mergeDialogueChunks', () => {
  it('merges attribution between two quoted segments', () => {
    expect(mergeDialogueChunks(['"I\'m leaving," he said.', '"Don\'t follow me."'])).toEqual([
      '"I\'m leaving," he said. "Don\'t follow me."',
    ])
  })

  it('merges with curly quotes', () => {
    expect(
      mergeDialogueChunks([
        '\u201cI\u2019m leaving,\u201d he said.',
        '\u201cDon\u2019t follow me.\u201d',
      ]),
    ).toEqual(['\u201cI\u2019m leaving,\u201d he said. \u201cDon\u2019t follow me.\u201d'])
  })

  it('does not merge when no speech verb in tail', () => {
    const input = ['"Stop!" He ran to the door.', '"Wait for me!"']
    expect(mergeDialogueChunks(input)).toEqual(input)
  })

  it('does not merge when next sentence has no opening quote', () => {
    const input = ['"I\'m leaving," he said.', 'She watched him go.']
    expect(mergeDialogueChunks(input)).toEqual(input)
  })

  it('merges chains of attributed dialogue', () => {
    expect(
      mergeDialogueChunks(['"First," he said.', '"Second," he continued.', '"Third."']),
    ).toEqual(['"First," he said. "Second," he continued. "Third."'])
  })

  it('handles various speech verbs', () => {
    const verbs = ['whispered', 'shouted', 'asked', 'replied', 'murmured']
    for (const verb of verbs) {
      expect(mergeDialogueChunks([`"Hello," she ${verb}.`, '"Goodbye."'])).toEqual([
        `"Hello," she ${verb}. "Goodbye."`,
      ])
    }
  })

  it('preserves non-dialogue sentences between dialogue groups', () => {
    expect(
      mergeDialogueChunks([
        '"I\'m leaving," he said.',
        '"Don\'t follow me."',
        'The door slammed shut.',
        '"Wait!" she called.',
        '"Please come back."',
      ]),
    ).toEqual([
      '"I\'m leaving," he said. "Don\'t follow me."',
      'The door slammed shut.',
      '"Wait!" she called. "Please come back."',
    ])
  })

  it('does not merge when result would exceed max length', () => {
    const longDialogue = '"' + 'A'.repeat(400) + '," he said.'
    const nextDialogue = '"' + 'B'.repeat(100) + '."'
    expect(mergeDialogueChunks([longDialogue, nextDialogue])).toEqual([longDialogue, nextDialogue])
  })

  it('does not merge action beats', () => {
    const input = ['"I can\'t believe it." She turned away.', '"Neither can I."']
    expect(mergeDialogueChunks(input)).toEqual(input)
  })

  it('returns empty array for empty input', () => {
    expect(mergeDialogueChunks([])).toEqual([])
  })

  it('returns single sentence unchanged', () => {
    expect(mergeDialogueChunks(['"Hello," he said.'])).toEqual(['"Hello," he said.'])
  })
})
