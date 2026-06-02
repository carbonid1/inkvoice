import { JSDOM } from 'jsdom'
import { parseDocument } from './helpers/parseDocument/parseDocument'

export { getInnerHtml } from './helpers/getInnerHtml/getInnerHtml'
export { getPlainText } from './helpers/getPlainText/getPlainText'

// Parse an HTML string into the reader's ContentBlock model. This is the
// server-side entry point: it builds a DOM via jsdom (Node-only) and hands it to
// the pure `parseDocument` engine. The browser (Storybook fixtures) skips this
// wrapper and feeds `parseDocument` a `new DOMParser()` document directly, so
// jsdom never reaches the browser bundle.
export const parseHtmlContent = (
  html: string,
  getImage: (id: string) => Promise<string | null>,
): ReturnType<typeof parseDocument> => parseDocument(new JSDOM(html).window.document, getImage)
