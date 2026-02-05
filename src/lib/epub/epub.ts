import EPub from 'epub2'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ParsedChapter, ParsedBook } from '@/lib/types/book'
import { parseHtmlContent } from './helpers/parseHtml/parseHtml'

// Re-export types for backwards compatibility
export type { TextSegment, ContentBlock, ParsedChapter, ParsedBook } from '@/lib/types/book'

// Re-export parseHtmlContent for external use
export { parseHtmlContent } from './helpers/parseHtml/parseHtml'

export const parseEpub = async (arrayBuffer: ArrayBuffer, bookId: string): Promise<ParsedBook> => {
  // Use epub2 for server-side parsing (epubjs is browser-only)
  const tempPath = join(tmpdir(), `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`)

  try {
    // Write ArrayBuffer to temp file (epub2 requires file path)
    await writeFile(tempPath, Buffer.from(arrayBuffer))

    // Parse with epub2
    const epub = await EPub.createAsync(tempPath)

    const chapters: ParsedChapter[] = []

    // Helper to get image as base64 data URL
    const getImage = async (src: string): Promise<string | null> => {
      try {
        // epub2 stores images with their manifest id
        // The src might be a relative path, we need to find the manifest entry
        const manifestId = Object.keys(epub.manifest || {}).find(id => {
          const item = epub.manifest[id]
          return item.href?.endsWith(src) || item.href === src || src.endsWith(item.href)
        })

        if (!manifestId) return null

        const [data, mimeType] = await new Promise<[Buffer, string]>((resolve, reject) => {
          epub.getImage(manifestId, (err: Error | null, data: Buffer, mime: string) => {
            if (err) reject(err)
            else resolve([data, mime])
          })
        })

        if (!data) return null

        const base64 = data.toString('base64')
        return `data:${mimeType};base64,${base64}`
      } catch {
        return null
      }
    }

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

        // Parse HTML to get rich content and sentences
        const { content, sentences } = await parseHtmlContent(html, getImage)

        if (sentences.length === 0) continue

        // Try to extract title from HTML heading or use item title/id
        let title = item.title || `Chapter ${chapters.length + 1}`
        const headingMatch = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i)
        if (headingMatch?.[1]) {
          title = headingMatch[1].trim()
        }

        chapters.push({ title, sentences, content })
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

export const getBookMetadata = async (arrayBuffer: ArrayBuffer): Promise<{ title: string; author: string }> => {
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

export const getCoverImage = async (arrayBuffer: ArrayBuffer): Promise<{ data: Buffer; mimeType: string } | null> => {
  const tempPath = join(tmpdir(), `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`)

  try {
    await writeFile(tempPath, Buffer.from(arrayBuffer))
    const epub = await EPub.createAsync(tempPath)

    const manifest = epub.manifest || {}

    // Helper to get image by manifest ID
    const getImageById = async (id: string): Promise<{ data: Buffer; mimeType: string } | null> => {
      try {
        const [data, mimeType] = await new Promise<[Buffer, string]>((resolve, reject) => {
          epub.getImage(id, (err: Error | null, data: Buffer, mime: string) => {
            if (err) reject(err)
            else resolve([data, mime])
          })
        })
        if (data && data.length > 0) {
          return { data, mimeType }
        }
      } catch {
        // Image fetch failed
      }
      return null
    }

    // Strategy 1: epub.metadata.cover (EPUB2 standard)
    if (epub.metadata?.cover) {
      const result = await getImageById(epub.metadata.cover)
      if (result) return result
    }

    // Strategy 2: Manifest item with ID containing "cover" and image MIME type
    for (const id of Object.keys(manifest)) {
      const item = manifest[id]
      if (
        id.toLowerCase().includes('cover') &&
        item['media-type']?.startsWith('image/')
      ) {
        const result = await getImageById(id)
        if (result) return result
      }
    }

    // Strategy 3: Manifest item with properties="cover-image" (EPUB3)
    for (const id of Object.keys(manifest)) {
      const item = manifest[id]
      if (
        item.properties?.includes('cover-image') &&
        item['media-type']?.startsWith('image/')
      ) {
        const result = await getImageById(id)
        if (result) return result
      }
    }

    // Strategy 4: First image in manifest (fallback)
    for (const id of Object.keys(manifest)) {
      const item = manifest[id]
      if (item['media-type']?.startsWith('image/')) {
        const result = await getImageById(id)
        if (result) return result
      }
    }

    return null
  } finally {
    try {
      await unlink(tempPath)
    } catch {
      // Ignore cleanup errors
    }
  }
}
