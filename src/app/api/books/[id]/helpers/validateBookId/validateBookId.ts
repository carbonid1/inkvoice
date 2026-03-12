import { NextResponse } from 'next/server'

export const validateBookId = (id: string): NextResponse | null =>
  !id || id.includes('..') || id.includes('/')
    ? NextResponse.json({ error: 'Invalid book ID' }, { status: 400 })
    : null
