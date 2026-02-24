import type { ChunkingMode, ParsedBook, ParsedChapter } from '@/lib/types/book'
import EPub from 'epub2'
import { unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { inferChapterTitle } from './helpers/inferChapterTitle/inferChapterTitle'
import { parseHtmlContent } from './helpers/parseHtml/parseHtml'

// Re-export types for backwards compatibility
export type {
  ChunkingMode,
  ContentBlock,
  ParsedBook,
  ParsedChapter,
  TextSegment,
} from '@/lib/types/book'

// Re-export parseHtmlContent for external use
export { parseHtmlContent } from './helpers/parseHtml/parseHtml'

export const parseEpub = async (
  arrayBuffer: ArrayBuffer,
  bookId: string,
  chunkingMode: ChunkingMode = 'sentence',
): Promise<ParsedBook> => {
  // Use epub2 for server-side parsing (epubjs is browser-only)
  const tempPath = join(tmpdir(), `epub-${Date.now()}-${Math.random().toString(36).slice(2)}.epub`)

  try {
    // Write ArrayBuffer to temp file (epub2 requires file path)
    await writeFile(tempPath, Buffer.from(arrayBuffer))

    // Parse with epub2
    const epub = await EPub.createAsync(tempPath)

    // Build TOC label lookup: spine item ID → TOC entry title
    const tocLabels = new Map<string, string>()
    for (const entry of epub.toc || []) {
      if (entry.id && entry.title) {
        tocLabels.set(entry.id, entry.title)
      }
    }

    const chapters: ParsedChapter[] = []

    // Helper to get image as base64 data URL
    const getImage = async (src: string): Promise<string | null> => {
      try {
        // epub2 stores images with their manifest id
        // The src might be a relative path, we need to find the manifest entry
        const normalizePath = (p: string) =>
          decodeURIComponent(p).split('/').pop()?.toLowerCase() ?? ''

        const manifestId = Object.keys(epub.manifest || {}).find(id => {
          const item = epub.manifest[id]
          const href = item.href ?? ''
          return (
            href.endsWith(src) || src.endsWith(href) || normalizePath(href) === normalizePath(src)
          )
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
        const { content, sentences } = await parseHtmlContent(html, getImage, chunkingMode)

        const hasContent = sentences.length > 0 || content.some(b => b.type === 'image')
        if (!hasContent) continue

        const htmlHeading = html
          .match(/<h[1-3][^>]*>([\s\S]+?)<\/h[1-3]>/i)?.[1]
          ?.replace(/<[^>]+>/g, '')
          ?.replace(/\s+/g, ' ')
          ?.trim()
        const isImageOnly = sentences.length === 0 && content.some(b => b.type === 'image')

        const title = inferChapterTitle(
          {
            itemId: item.id,
            tocLabel: tocLabels.get(item.id),
            itemTitle: item.title || undefined,
            htmlHeading,
            isImageOnly,
          },
          chapters.length + 1,
        )

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

export const getBookMetadata = async (
  arrayBuffer: ArrayBuffer,
): Promise<{ title: string; author: string }> => {
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

export const getCoverImage = async (
  arrayBuffer: ArrayBuffer,
): Promise<{ data: Buffer; mimeType: string } | null> => {
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
      if (id.toLowerCase().includes('cover') && item['media-type']?.startsWith('image/')) {
        const result = await getImageById(id)
        if (result) return result
      }
    }

    // Strategy 3: Manifest item with properties="cover-image" (EPUB3)
    for (const id of Object.keys(manifest)) {
      const item = manifest[id]
      if (item.properties?.includes('cover-image') && item['media-type']?.startsWith('image/')) {
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
