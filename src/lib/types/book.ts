/**
 * Book-related types extracted from epub.ts
 */

import { z } from 'zod'

export interface TextSegment {
  paragraphIndex: number
  html: string
}

// A table row carries TWO views of itself, intentionally decoupled:
// - `segments`: the spoken/highlight/tap unit — ONE entry per row whose
//   paragraphIndex points at the row's joined plain text in `paragraphs[]`.
//   An audiobook reads a schedule row as one utterance ("Rise from bed, 6 a.m."),
//   not as disconnected per-cell clips.
// - `cells`: per-cell inner HTML, presentation-only, kept faithful to print
//   (italics, ditto marks). Used to lay the row out in aligned columns.
export interface TableRow {
  segments: TextSegment[]
  cells: string[]
}

export interface ContentBlock {
  type:
    | 'paragraph'
    | 'heading'
    | 'blockquote'
    | 'attribution'
    | 'list'
    | 'image'
    | 'scene-break'
    | 'table'
  level?: number // For headings (1-6)
  segments?: TextSegment[] // Paragraph-aligned segments within block
  src?: string // For images (base64 data URL)
  alt?: string // For images
  items?: TextSegment[][] // For list items
  rows?: TableRow[] // For tables (row → { spoken segments, visual cells })
  // A structured blockquote (a Standard Ebooks letter, inscription, or titled
  // list) keeps its interior as nested blocks instead of one flattened segment,
  // so the header and each list item stay distinct spoken/highlight units inside
  // the quote frame. Mutually exclusive with `segments` on a blockquote: a
  // plain-text quote carries `segments`, a structured one carries `children`.
  // Consumers that flatten a block to its segments must recurse `children`.
  children?: ContentBlock[]
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

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  filename: z.string(),
})

export type Book = z.infer<typeof bookSchema>

export interface ChapterInfo {
  title: string
  paragraphCount: number
  wordCount: number
}

export interface TocNode {
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
