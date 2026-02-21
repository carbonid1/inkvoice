import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { JSDOM } from 'jsdom'
import { getPlainText } from './helpers/getPlainText/getPlainText'
import { isAttributionElement } from './helpers/isAttributionElement/isAttributionElement'
import { isEpigraphElement } from './helpers/isEpigraphElement/isEpigraphElement'
import { splitNodeIntoSentences } from './helpers/splitNodeIntoSentences/splitNodeIntoSentences'

export { getPlainText } from './helpers/getPlainText/getPlainText'
export { getInnerHtml } from './helpers/getInnerHtml/getInnerHtml'

const isLinkListParagraph = (el: Element): boolean => {
  const children = Array.from(el.childNodes)
  let linkCount = 0
  for (const child of children) {
    if (child.nodeType === 3) {
      if (child.textContent?.trim()) return false
    } else if (child.nodeType === 1) {
      if ((child as Element).tagName.toLowerCase() === 'a') linkCount++
      else return false
    }
  }
  return linkCount > 1
}

export const parseHtmlContent = (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; sentences: string[] }> => {
  return parseHtmlContentSync(html, getImage)
}

const parseHtmlContentSync = async (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; sentences: string[] }> => {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const body = doc.body

  const content: ContentBlock[] = []
  const sentences: string[] = []

  // Convert an element's text into sentence-aligned segments, registering each
  // sentence in the shared sentences array. Returns null if the element is empty.
  const toSegments = (node: Element): TextSegment[] | null => {
    const mappings = splitNodeIntoSentences(node)
    if (mappings.length === 0) return null
    return mappings.map(m => {
      const idx = sentences.length
      sentences.push(m.plainText)
      return { sentenceIndex: idx, html: m.html }
    })
  }

  const processList = (listEl: Element, depth: number): void => {
    const items: TextSegment[][] = []
    listEl.querySelectorAll(':scope > li').forEach(li => {
      const nestedList = li.querySelector(':scope > ul, :scope > ol')
      if (nestedList) {
        // Add the li's direct content (e.g. "BOOK ONE: RARAKU") as an item
        Array.from(li.childNodes).forEach(child => {
          if (child.nodeType === 1 && /^(ul|ol)$/i.test((child as Element).tagName)) return
          if (child.nodeType === 1 && getPlainText(child).trim()) {
            const segments = toSegments(child as Element)
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
          const segments = toSegments(link as Element)
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

    if (tag === 'img' || tag === 'image') {
      const src = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('xlink:href')
      const alt = el.getAttribute('alt') || ''
      if (src) content.push({ type: 'image', src, alt })
      return
    }

    if (tag.match(/^h[1-6]$/)) {
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
      const img = el.querySelector('img, image')
      if (img && !getPlainText(el).trim()) {
        processElement(img as Element)
        return
      }
      if (isLinkListParagraph(el)) {
        el.querySelectorAll(':scope > a').forEach(link => {
          const segments = toSegments(link as Element)
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

    if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'figure' || tag === 'svg') {
      Array.from(el.children).forEach(child => processElement(child as Element))
      return
    }

    if (getPlainText(el).trim()) {
      const segments = toSegments(el)
      if (segments) content.push({ type: 'paragraph', segments })
    }
  }

  Array.from(body.children).forEach(child => processElement(child as Element))

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
        if (sentences[seg.sentenceIndex] === undefined) {
          console.error(
            `[epub] Index mismatch: sentenceIndex ${seg.sentenceIndex} out of bounds (sentences.length: ${sentences.length})`,
          )
          mismatchFound = true
        }
      })
    })
    if (!mismatchFound && sentences.length > 0) {
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

  return { content, sentences }
}
