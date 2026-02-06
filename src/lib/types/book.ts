/**
 * Book-related types extracted from epub.ts
 */

export interface TextSegment {
  sentenceIndex: number
  html: string
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'blockquote' | 'attribution' | 'list' | 'image'
  level?: number // For headings (1-6)
  segments?: TextSegment[] // Sentence-aligned segments within block
  src?: string // For images (base64 data URL)
  alt?: string // For images
  items?: TextSegment[][] // For list items
}

export interface ParsedChapter {
  title: string
  sentences: string[] // Plain text for TTS
  content?: ContentBlock[] // Rich content for rendering (optional for backwards compat)
}

export interface ParsedBook {
  id: string
  title: string
  author: string
  chapters: ParsedChapter[]
}

export interface BookPosition {
  chapter: number
  sentence: number
}

export interface BookMetadata {
  title: string
  author: string
}

export interface BookInfo {
  id: string
  title: string
  author: string
  filename: string
}

export interface ChapterInfo {
  title: string
  sentenceCount: number
}

export interface BookOverview {
  id: string
  title: string
  author: string
  chapters: ChapterInfo[]
}
