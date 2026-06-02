import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { getPlainText } from '../getPlainText/getPlainText'
import { isAttributionElement } from '../isAttributionElement/isAttributionElement'
import { isChapterMarker } from '../isChapterMarker/isChapterMarker'
import { isElement } from '../isElement/isElement'
import { isEpigraphElement } from '../isEpigraphElement/isEpigraphElement'
import { isSceneBreakParagraph } from '../isSceneBreakParagraph/isSceneBreakParagraph'
import { processTable } from '../processTable/processTable'
import { splitNodeIntoChunks } from '../splitNodeIntoChunks/splitNodeIntoChunks'

const BLOCK_LEVEL_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'figure',
  'blockquote',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'hr',
  'pre',
])

const MEDIA_TAGS = new Set(['img', 'image', 'svg'])

const isBlockOrMedia = (node: Node): boolean => {
  if (!isElement(node)) return false
  const tag = node.tagName.toLowerCase()

  return BLOCK_LEVEL_TAGS.has(tag) || MEDIA_TAGS.has(tag)
}

// A self-closing landmark anchor like <a id="chap01"/> is valid XHTML, but when
// the file is parsed as HTML5 the <a> stays open; HTML5's adoption-agency
// algorithm then reconstructs it around every following block. Project Gutenberg
// "Ebookmaker" files use these anchors in headings, so a whole chapter ends up
// nested inside one stray <a>. Detect any inline wrapper that swallowed
// block-level or media children so we can walk into it (see processElement)
// instead of flattening the chapter into a single paragraph.
const hasBlockOrMediaChildren = (el: Element): boolean =>
  Array.from(el.children).some(isBlockOrMedia)

// An element worth descending into: a block/media element, or an inline element
// that (via the misnesting above) wraps block/media children. Everything else is
// inline/text content that should be flushed into a paragraph, not dropped.
const shouldDescend = (el: Element): boolean => isBlockOrMedia(el) || hasBlockOrMediaChildren(el)

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

// A blockquote that carries real internal structure — a title <header>/<h*>, a
// nested list or table, or several block-level children — rather than a single
// run of prose. Standard Ebooks wraps letters, inscriptions, and titled lists
// this way; flattening one to a single segment loses both the visual layout and
// the per-line TTS/highlighting boundaries. A plain-text or single-paragraph
// quote returns false and keeps the cheap leaf path.
const isStructuredBlockquote = (el: Element): boolean => {
  const children = Array.from(el.children)
  const hasStructuralChild = children.some(child => {
    const tag = child.tagName.toLowerCase()

    return (
      tag === 'ul' || tag === 'ol' || tag === 'table' || tag === 'header' || /^h[1-6]$/.test(tag)
    )
  })

  return hasStructuralChild || children.filter(isBlockOrMedia).length >= 2
}

// The EPUB parsing engine: walk a parsed DOM Document into the reader's
// ContentBlock model. Pure DOM — no jsdom — so the same logic runs server-side
// (parseHtml.ts feeds a jsdom document) and in the browser (Storybook fixtures
// feed a DOMParser document).
export const parseDocument = async (
  doc: Document,
  getImage: (id: string) => Promise<string | null>,
): Promise<{ content: ContentBlock[]; paragraphs: string[] }> => {
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

  // Clone a structured blockquote's interior into a plain container, unwrapping
  // any <header>/<footer> into its children. Inside a quote a <header> is the
  // quote's own title (Standard Ebooks marks it role="presentation"), not page
  // furniture — so it must survive the page-furniture skip in processElement.
  // Feeding the container back through processElement reuses the container walk,
  // so direct text, lists, and nested blocks are all handled the same way.
  const buildQuoteInterior = (quote: Element): Element => {
    const container = doc.createElement('div')

    Array.from(quote.childNodes).forEach(node => {
      const tag = isElement(node) ? node.tagName.toLowerCase() : ''

      if (tag === 'header' || tag === 'footer') {
        Array.from(node.childNodes).forEach(inner => container.appendChild(inner.cloneNode(true)))
      } else {
        container.appendChild(node.cloneNode(true))
      }
    })
    return container
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
      if (isStructuredBlockquote(el)) {
        // Walk the interior through the same engine, then lift the blocks it
        // produced out of `content` and into the quote's children — so the
        // header and each list item stay distinct spoken/highlight units inside
        // one quote frame instead of collapsing into a single segment.
        const start = content.length

        processElement(buildQuoteInterior(el))
        const children = content.splice(start)

        if (children.length > 0) {
          content.push({ type: 'blockquote', children })
          return
        }
      }

      const segments = toSegments(el)

      if (segments) content.push({ type: 'blockquote', segments })
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      processList(el, 0)
      return
    }

    if (tag === 'table') {
      const table = processTable(el, paragraphs.length)

      if (table) {
        paragraphs.push(...table.paragraphs)
        content.push(table.block)
      }
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
      const blockType: ContentBlock['type'] = (() => {
        if (isEpigraphElement(el)) return 'blockquote'
        if (isAttributionElement(el)) return 'attribution'
        return 'paragraph'
      })()
      const segments = toSegments(el)

      if (segments) content.push({ type: blockType, segments })
      return
    }

    // Containers (div/section/article/figure/svg are all block/media tags) and any
    // element that — validly, or via HTML5 parser misnesting — wraps block-level or
    // media children are walked node-by-node: block/media children recurse, while
    // runs of inline or text content (e.g. the <br>-separated lines of poetry
    // inside a <div class="pgmonospaced">) are flushed as their own paragraph.
    // Recursing only into element children would silently drop those direct text
    // nodes. (Earlier branches already claim p/blockquote/h*/ul/ol/hr/img.)
    if (shouldDescend(el)) {
      const inlineRun: Node[] = []
      const flushInlineRun = (): void => {
        if (inlineRun.length === 0) return
        const wrapper = doc.createElement('div')

        inlineRun.splice(0).forEach(node => wrapper.appendChild(node.cloneNode(true)))
        const segments = toSegments(wrapper)

        if (segments) content.push({ type: 'paragraph', segments })
      }

      Array.from(el.childNodes).forEach(node => {
        if (isElement(node) && shouldDescend(node)) {
          flushInlineRun()
          processElement(node)
        } else {
          inlineRun.push(node)
        }
      })
      flushInlineRun()
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

  // Debug: Verify sentence indices match array positions. Guarded on `process`
  // so the browser (Storybook) never trips over an undefined global.
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    const collectSegments = (block: ContentBlock): TextSegment[] => [
      ...(block.segments ?? []),
      ...(block.items?.flat() ?? []),
      ...(block.rows?.flatMap(row => row.segments) ?? []),
      ...(block.children?.flatMap(collectSegments) ?? []),
    ]

    content.forEach(block => {
      collectSegments(block).forEach(seg => {
        if (paragraphs[seg.paragraphIndex] === undefined) {
          console.error(
            `[epub] Index mismatch: paragraphIndex ${seg.paragraphIndex} out of bounds (paragraphs.length: ${paragraphs.length})`,
          )
        }
      })
    })
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
