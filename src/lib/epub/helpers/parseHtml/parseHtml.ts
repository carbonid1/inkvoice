import { JSDOM } from 'jsdom'
import { parseDocument } from './helpers/parseDocument/parseDocument'
import { translateNamedEntities } from './helpers/translateNamedEntities/translateNamedEntities'

export { getInnerHtml } from './helpers/getInnerHtml/getInnerHtml'
export { getPlainText } from './helpers/getPlainText/getPlainText'

const XHTML_NAMESPACES = [
  'xmlns="http://www.w3.org/1999/xhtml"',
  'xmlns:epub="http://www.idpf.org/2007/ops"',
  'xmlns:xlink="http://www.w3.org/1999/xlink"',
].join(' ')

// epub2's getChapter strips the chapter down to body-innerHTML, discarding the
// <html> element and its namespace declarations — so the fragment must be
// re-wrapped into a namespaced document before XML parsing.
const wrapAsXhtmlDocument = (html: string): string => {
  if (/<html[\s>]/i.test(html)) return html
  if (/<body[\s>]/i.test(html)) return `<html ${XHTML_NAMESPACES}>${html}</html>`
  return `<html ${XHTML_NAMESPACES}><body>${html}</body></html>`
}

// EPUB content documents are well-formed XHTML by spec, and parsing them as
// XML avoids a class of HTML5 error-recovery rewrites (adoption agency around
// self-closing anchors, raw-text mode after <style/>, table foster-parenting).
// jsdom throws a SyntaxError DOMException on any malformed input, so null
// means "let the lenient HTML5 parser handle it".
const parseAsXhtml = (html: string): Document | null => {
  try {
    const xml = wrapAsXhtmlDocument(translateNamedEntities(html))
    const doc = new JSDOM(xml, { contentType: 'application/xhtml+xml' }).window.document

    return doc.body ? doc : null
  } catch {
    return null
  }
}

// Parse an HTML string into the reader's ContentBlock model. This is the
// server-side entry point: it builds a DOM via jsdom (Node-only) and hands it to
// the pure `parseDocument` engine. The browser (Storybook fixtures) skips this
// wrapper and feeds `parseDocument` a `new DOMParser()` document directly, so
// jsdom never reaches the browser bundle.
export const parseHtmlContent = (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): ReturnType<typeof parseDocument> =>
  parseDocument(parseAsXhtml(html) ?? new JSDOM(html).window.document, getImage)
