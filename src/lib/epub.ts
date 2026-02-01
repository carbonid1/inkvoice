import ePub, { Book } from 'epubjs'
import EPub from 'epub2'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

export interface ParsedChapter {
  title: string
  sentences: string[]
}

export interface ParsedBook {
  id: string
  title: string
  author: string
  chapters: ParsedChapter[]
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end of string
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences
}

function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // Replace block elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|br)[^>]*>/gi, '\n')

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

export async function parseEpub(arrayBuffer: ArrayBuffer, bookId: string): Promise<ParsedBook> {
  const book = ePub(arrayBuffer)
  await book.ready

  const metadata = await book.loaded.metadata
  const spine = book.spine as any

  const chapters: ParsedChapter[] = []

  // Iterate through spine items
  for (const item of spine.items) {
    if (!item.href) continue

    try {
      const doc = await book.load(item.href)
      if (!doc) continue

      // Get the HTML content
      let html = ''
      if (doc instanceof Document) {
        html = doc.body?.innerHTML || ''
      } else if (typeof doc === 'string') {
        html = doc
      }

      const text = extractTextFromHtml(html)
      if (!text) continue

      const sentences = splitIntoSentences(text)
      if (sentences.length === 0) continue

      // Try to get chapter title from the document or use item id
      let title = item.idref || `Chapter ${chapters.length + 1}`
      if (doc instanceof Document) {
        const h1 = doc.querySelector('h1, h2, h3')
        if (h1?.textContent) {
          title = h1.textContent.trim()
        }
      }

      chapters.push({ title, sentences })
    } catch (e) {
      console.error(`Failed to parse chapter ${item.href}:`, e)
    }
  }

  return {
    id: bookId,
    title: metadata.title || 'Unknown Title',
    author: metadata.creator || 'Unknown Author',
    chapters,
  }
}

export async function getBookMetadata(arrayBuffer: ArrayBuffer): Promise<{ title: string; author: string }> {
  // Use epub2 for server-side parsing (epubjs is browser-only)
  const tempPath = join(tmpdir(), `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`)

  try {
    // Write ArrayBuffer to temp file (epub2 requires file path)
    await writeFile(tempPath, Buffer.from(arrayBuffer))

    // Parse with epub2
    const epub = await EPub.createAsync(tempPath)

    return {
      title: epub.metadata?.title || 'Unknown Title',
      author: epub.metadata?.creator || 'Unknown Author',
    }
  } finally {
    // Clean up temp file
    try {
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}
