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
  // Use epub2 for server-side parsing (epubjs is browser-only)
  const tempPath = join(tmpdir(), `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`)

  try {
    // Write ArrayBuffer to temp file (epub2 requires file path)
    await writeFile(tempPath, Buffer.from(arrayBuffer))

    // Parse with epub2
    const epub = await EPub.createAsync(tempPath)

    const chapters: ParsedChapter[] = []

    // Get chapters from the spine/flow
    const flow = epub.flow || []

    for (let i = 0; i < flow.length; i++) {
      const item = flow[i]
      if (!item.id) continue

      try {
        // Get chapter content using epub2's getChapter method
        const html = await new Promise<string>((resolve, reject) => {
          epub.getChapter(item.id, (err: Error | null, text: string) => {
            if (err) reject(err)
            else resolve(text || '')
          })
        })

        if (!html) continue

        const text = extractTextFromHtml(html)
        if (!text) continue

        const sentences = splitIntoSentences(text)
        if (sentences.length === 0) continue

        // Try to extract title from HTML heading or use item title/id
        let title = item.title || `Chapter ${chapters.length + 1}`
        const headingMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i)
        if (headingMatch?.[1]) {
          title = headingMatch[1].trim()
        }

        chapters.push({ title, sentences })
      } catch (e) {
        console.error(`Failed to parse chapter ${item.id}:`, e)
      }
    }

    return {
      id: bookId,
      title: epub.metadata?.title || 'Unknown Title',
      author: epub.metadata?.creator || 'Unknown Author',
      chapters,
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
