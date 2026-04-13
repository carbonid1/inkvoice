/**
 * Book-related types extracted from epub.ts
 */

export interface TextSegment {
  paragraphIndex: number
  html: string
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'blockquote' | 'attribution' | 'list' | 'image' | 'scene-break'
  level?: number // For headings (1-6)
  segments?: TextSegment[] // Paragraph-aligned segments within block
  src?: string // For images (base64 data URL)
  alt?: string // For images
  items?: TextSegment[][] // For list items
}

export interface ParsedChapter {
  title: string
  paragraphs: string[] // Plain text for TTS
  content?: ContentBlock[] // Rich content for rendering (optional for backwards compat)
}

export interface ParsedBook {
  id: string
  title: string
  author: string
  chapters: ParsedChapter[]
  tocTree?: TocNode[]
}

export interface BookPosition {
  chapter: number
  paragraph: number
}

export interface BookMetadata {
  title: string
  author: string
}

export interface Book {
  id: string
  title: string
  author: string
  filename: string
}

export interface ChapterInfo {
  title: string
  paragraphCount: number
  wordCount: number
}

export type TocNode = {
  title: string
  chapterIndex: number
  children: TocNode[]
}

export interface BookOverview {
  id: string
  title: string
  author: string
  chapters: ChapterInfo[]
  tocTree?: TocNode[]
}
