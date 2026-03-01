import type { ContentBlock } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { findTitleGroupMembers } from './findTitleGroupMembers'

const heading = (text: string, level = 1): ContentBlock => ({
  type: 'heading',
  level,
  segments: [{ sentenceIndex: 0, html: text }],
})

const paragraph = (text: string): ContentBlock => ({
  type: 'paragraph',
  segments: [{ sentenceIndex: 0, html: text }],
})

const image = (): ContentBlock => ({
  type: 'image',
  src: 'data:image/png;base64,xxx',
  alt: 'divider',
})

describe('findTitleGroupMembers', () => {
  it('does not promote first h3 when many h3s follow removed h1 (DRAMATIS PERSONAE)', () => {
    // h1 (dup at 0), then 7 h3 section headings with paragraphs between
    const content: ContentBlock[] = [
      heading('DRAMATIS PERSONAE', 1),
      heading('ON THE PATH OF THE HAND', 3),
      paragraph('Kalam — assassin'),
      heading('THE MALAZANS', 3),
      paragraph('Whiskeyjack — sergeant'),
      heading('WICKANS', 3),
      paragraph('Coltaine — Fist'),
      heading('DARUJHISTAN', 3),
      paragraph('Kruppe — a man of parts'),
      heading('THE TISTE ANDII', 3),
      paragraph('Anomander Rake — Son of Darkness'),
      heading('THE BRIDGEBURNERS', 3),
      paragraph('Quick Ben — mage'),
      heading('OTHERS', 3),
      paragraph('Icarium — a wanderer'),
    ]
    const { titleGroupMember } = findTitleGroupMembers(content, 0)
    // First h3 (index 1) should NOT be a subtitle/member
    expect(titleGroupMember.has(1)).toBe(false)
  })

  it('promotes unique subtitle after removed title (book divider)', () => {
    // h1 (dup at 0), image, then a single h1 subtitle
    const content: ContentBlock[] = [heading('Book One', 1), image(), heading('Raraku', 1)]
    const { titleGroupMember, titleGroupStart } = findTitleGroupMembers(content, 0)
    expect(titleGroupMember.has(2)).toBe(true)
    expect(titleGroupStart.has(2)).toBe(false) // member but not start = subtitle
  })

  it('groups consecutive headings into a title group (no duplicate)', () => {
    const content: ContentBlock[] = [heading('Book Two', 2), heading('The Whirlwind', 3)]
    const { titleGroupMember, titleGroupStart } = findTitleGroupMembers(content, -1)
    expect(titleGroupMember.has(0)).toBe(true)
    expect(titleGroupMember.has(1)).toBe(true)
    expect(titleGroupStart.has(0)).toBe(true)
  })

  it('returns empty sets for paragraphs only', () => {
    const content: ContentBlock[] = [paragraph('Hello'), paragraph('World')]
    const { titleGroupStart, titleGroupMember } = findTitleGroupMembers(content, -1)
    expect(titleGroupStart.size).toBe(0)
    expect(titleGroupMember.size).toBe(0)
  })

  it('returns empty sets for single heading with no pair', () => {
    const content: ContentBlock[] = [heading('Chapter One', 2), paragraph('Some text')]
    const { titleGroupStart, titleGroupMember } = findTitleGroupMembers(content, -1)
    expect(titleGroupStart.size).toBe(0)
    expect(titleGroupMember.size).toBe(0)
  })
})
