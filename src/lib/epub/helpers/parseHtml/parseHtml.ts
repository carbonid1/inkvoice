import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { JSDOM } from 'jsdom'
import { getPlainText } from './helpers/getPlainText/getPlainText'
import { isAttributionElement } from './helpers/isAttributionElement/isAttributionElement'
import { isChapterMarker } from './helpers/isChapterMarker/isChapterMarker'
import { isElement } from './helpers/isElement/isElement'
import { isEpigraphElement } from './helpers/isEpigraphElement/isEpigraphElement'
import { isSceneBreakParagraph } from './helpers/isSceneBreakParagraph/isSceneBreakParagraph'
import { splitNodeIntoChunks } from './helpers/splitNodeIntoChunks/splitNodeIntoChunks'

export { getInnerHtml } from './helpers/getInnerHtml/getInnerHtml'
export { getPlainText } from './helpers/getPlainText/getPlainText'

const isLinkListParagraph = (el: Element): boolean => {
  const children = Array.from(el.childNodes)
  let linkCount = 0
  for (const child of children) {
    if (child.nodeType === 3) {
      if (child.textContent?.trim()) return false
    } else if (isElement(child)) {
      if (child.tagName.toLowerCase() === 'a') linkCount++
      else return false
    }
  }
  return linkCount > 1
}

export const parseHtmlContent = (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; paragraphs: string[] }> => {
  return parseHtmlContentSync(html, getImage)
}

const parseHtmlContentSync = async (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; paragraphs: string[] }> => {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const body = doc.body

  const content: ContentBlock[] = []
  const paragraphs: string[] = []

  // Convert an element's text into chunk-aligned segments, registering each
  // chunk in the shared paragraphs array. Returns null if the element is empty.
  const toSegments = (node: Element): TextSegment[] | null => {
    const mappings = splitNodeIntoChunks(node)
    if (mappings.length === 0) return null
    return mappings.map(m => {
      const idx = paragraphs.length
      paragraphs.push(m.plainText)
      return { paragraphIndex: idx, html: m.html }
    })
  }

  const pushSceneBreak = (): void => {
    if (content.length === 0) return
    if (content[content.length - 1]?.type === 'scene-break') return
    content.push({ type: 'scene-break' })
  }

  const processList = (listEl: Element, depth: number): void => {
    const items: TextSegment[][] = []
    listEl.querySelectorAll(':scope > li').forEach(li => {
      const nestedList = li.querySelector(':scope > ul, :scope > ol')
      if (nestedList) {
        // Add the li's direct content (e.g. "BOOK ONE: RARAKU") as an item
        Array.from(li.childNodes).forEach(child => {
          if (!isElement(child)) return
          if (/^(ul|ol)$/i.test(child.tagName)) return
          if (getPlainText(child).trim()) {
            const segments = toSegments(child)
            if (segments) items.push(segments)
          }
        })
        // Emit current items before recursing into nested list
        if (items.length > 0) {
          content.push({ type: 'list', level: depth, items: items.splice(0) })
        }
        processList(nestedList, depth + 1)
      } else if (isLinkListParagraph(li)) {
        li.querySelectorAll(':scope > a').forEach(link => {
          const segments = toSegments(link)
          if (segments) items.push(segments)
        })
      } else {
        const segments = toSegments(li)
        if (segments) items.push(segments)
      }
    })
    if (items.length > 0) {
      content.push({ type: 'list', level: depth, items })
    }
  }

  const processElement = (el: Element): void => {
    const tag = el.tagName.toLowerCase()

    if (['script', 'style', 'nav', 'header', 'footer'].includes(tag)) return

    if (tag === 'hr') {
      pushSceneBreak()
      return
    }

    if (tag === 'img' || tag === 'image') {
      const src = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('xlink:href')
      const alt = el.getAttribute('alt') || ''
      if (src) content.push({ type: 'image', src, alt })
      return
    }

    if (tag.match(/^h[1-6]$/)) {
      if (isChapterMarker(getPlainText(el))) return
      const level = parseInt(tag[1] ?? '1', 10)
      const segments = toSegments(el)
      if (segments) content.push({ type: 'heading', level, segments })
      return
    }

    if (tag === 'blockquote') {
      const segments = toSegments(el)
      if (segments) content.push({ type: 'blockquote', segments })
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      processList(el, 0)
      return
    }

    if (tag === 'p') {
      if (isSceneBreakParagraph(el)) {
        pushSceneBreak()
        return
      }
      if (isChapterMarker(getPlainText(el))) return
      const img = el.querySelector('img, image')
      if (img && !getPlainText(el).trim()) {
        processElement(img)
        return
      }
      if (isLinkListParagraph(el)) {
        el.querySelectorAll(':scope > a').forEach(link => {
          const segments = toSegments(link)
          if (segments) content.push({ type: 'paragraph', segments })
        })
        return
      }
      const blockType: ContentBlock['type'] = isEpigraphElement(el)
        ? 'blockquote'
        : isAttributionElement(el)
          ? 'attribution'
          : 'paragraph'
      const segments = toSegments(el)
      if (segments) content.push({ type: blockType, segments })
      return
    }

    if (
      tag === 'div' ||
      tag === 'section' ||
      tag === 'article' ||
      tag === 'figure' ||
      tag === 'svg'
    ) {
      Array.from(el.children).forEach(child => processElement(child))
      return
    }

    if (getPlainText(el).trim()) {
      const segments = toSegments(el)
      if (segments) content.push({ type: 'paragraph', segments })
    }
  }

  Array.from(body.children).forEach(child => processElement(child))

  while (content[content.length - 1]?.type === 'scene-break') content.pop()

  if (content.length === 0 && body.textContent?.trim()) {
    const segments = toSegments(body)
    if (segments) content.push({ type: 'paragraph', segments })
  }

  // Debug: Verify sentence indices match array positions
  if (process.env.NODE_ENV === 'development') {
    let mismatchFound = false
    content.forEach(block => {
      const segments = block.segments || (block.items?.flat() ?? [])
      segments.forEach(seg => {
        if (paragraphs[seg.paragraphIndex] === undefined) {
          console.error(
            `[epub] Index mismatch: paragraphIndex ${seg.paragraphIndex} out of bounds (paragraphs.length: ${paragraphs.length})`,
          )
          mismatchFound = true
        }
      })
    })
    if (!mismatchFound && paragraphs.length > 0) {
      // Verification passed
    }
  }

  // Process images - convert src to base64 data URLs
  for (const block of content) {
    if (block.type === 'image' && block.src) {
      try {
        const imageData = await getImage(block.src)
        if (imageData) {
          block.src = imageData
        }
      } catch {
        // Leave original src if image loading fails
      }
    }
  }

  return { content, paragraphs }
}
