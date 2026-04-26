import type { ContentBlock } from '@/lib/types/book'

export interface TitleGroupResult {
  titleGroupStart: Set<number>
  titleGroupMember: Set<number>
}

const isSectionTitle = (block: ContentBlock): boolean => {
  if (block.type !== 'heading') return false
  const text = block.segments?.map(s => s.html.replace(/<[^>]+>/g, '')).join('') || ''

  return text.length > 0 && text.length < 50
}

const findNextSectionTitle = (content: ContentBlock[], start: number): number => {
  for (let j = start + 1; j < content.length; j++) {
    const b = content[j]

    if (!b) break
    if (b.type === 'image') continue
    return isSectionTitle(b) ? j : -1
  }
  return -1
}

export const findTitleGroupMembers = (
  content: ContentBlock[],
  duplicateTitleIndex: number,
): TitleGroupResult => {
  const titleGroupStart = new Set<number>()
  const titleGroupMember = new Set<number>()

  for (let i = 0; i < content.length; i++) {
    if (i === duplicateTitleIndex) continue
    const block = content[i]

    if (block && isSectionTitle(block)) {
      const nextTitle = findNextSectionTitle(content, i)

      if (nextTitle !== -1 && nextTitle !== duplicateTitleIndex) {
        titleGroupStart.add(i)
        titleGroupMember.add(i)
        titleGroupMember.add(nextTitle)
      } else if (titleGroupMember.has(i - 1) && !titleGroupStart.has(i)) {
        titleGroupMember.add(i)
      }
    }
  }

  // After removing a duplicate title heading, detect a subtitle that follows it
  // (possibly separated by an image block) — only if it's the sole heading at that level
  if (duplicateTitleIndex !== -1) {
    const subtitleIdx = findNextSectionTitle(content, duplicateTitleIndex)

    if (subtitleIdx !== -1 && !titleGroupMember.has(subtitleIdx)) {
      const subtitleBlock = content[subtitleIdx]

      if (subtitleBlock) {
        const subtitleLevel = subtitleBlock.level
        const othersAtSameLevel = content.some(
          (b, i) =>
            i !== duplicateTitleIndex &&
            i !== subtitleIdx &&
            isSectionTitle(b) &&
            b.level === subtitleLevel,
        )

        if (!othersAtSameLevel) {
          titleGroupMember.add(subtitleIdx)
        }
      }
    }
  }

  return { titleGroupStart, titleGroupMember }
}
