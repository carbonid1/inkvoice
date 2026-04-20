import { getBookService } from '@/lib/services/book/book.service'
import { NextRequest, NextResponse } from 'next/server'
import { findMatchPositions } from './helpers/findMatchPositions/findMatchPositions'

type SearchMatch = {
  chapter: number
  paragraph: number
  chapterTitle: string
  textSnippet: string
  matchPositions: number[]
}

type SearchResponse = {
  query: string
  matches: SearchMatch[]
  totalMatches: number
  truncated: boolean
}

type RouteParams = {
  params: Promise<{ id: string }>
}

const MAX_MATCHES = 500
const MIN_QUERY_LENGTH = 2

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  const { id } = await params
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const chapterParam = request.nextUrl.searchParams.get('chapter')

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query must be at least ${MIN_QUERY_LENGTH} characters` },
      { status: 400 },
    )
  }

  const bookService = getBookService()

  try {
    const book = await bookService.getBook(id)
    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const chapterFilter = chapterParam !== null ? parseInt(chapterParam, 10) : null
    if (
      chapterFilter !== null &&
      (isNaN(chapterFilter) || chapterFilter < 0 || chapterFilter >= book.chapters.length)
    ) {
      return NextResponse.json({ error: 'Invalid chapter index' }, { status: 400 })
    }

    const startChapter = chapterFilter ?? 0
    const endChapter = chapterFilter !== null ? chapterFilter + 1 : book.chapters.length

    const matches: SearchMatch[] = []
    let truncated = false

    for (let chapterIndex = startChapter; chapterIndex < endChapter; chapterIndex++) {
      const chapter = book.chapters[chapterIndex]
      if (!chapter) continue
      for (let paragraphIndex = 0; paragraphIndex < chapter.paragraphs.length; paragraphIndex++) {
        const text = chapter.paragraphs[paragraphIndex]
        if (text === undefined) continue
        const positions = findMatchPositions(text, query)
        if (positions.length > 0) {
          matches.push({
            chapter: chapterIndex,
            paragraph: paragraphIndex,
            chapterTitle: chapter.title,
            textSnippet: text.length > 200 ? text.slice(0, 200) + '...' : text,
            matchPositions: positions,
          })
          if (matches.length >= MAX_MATCHES) {
            truncated = true
            break
          }
        }
      }
      if (truncated) break
    }

    const response: SearchResponse = {
      query,
      matches,
      totalMatches: matches.length,
      truncated,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error searching book:', error)
    return NextResponse.json({ error: 'Failed to search book' }, { status: 500 })
  }
}
