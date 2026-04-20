import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { parseHtmlContent } from './helpers/parseHtml/parseHtml'

// Helper to verify sentence index integrity
function verifySentenceIndexIntegrity(content: ContentBlock[], paragraphs: string[]): void {
  content.forEach(block => {
    if (block.segments) {
      block.segments.forEach(segment => {
        expect(paragraphs[segment.paragraphIndex]).toBeDefined()
      })
    }
    if (block.items) {
      block.items.forEach(itemSegments => {
        itemSegments.forEach(segment => {
          expect(paragraphs[segment.paragraphIndex]).toBeDefined()
        })
      })
    }
  })
}

// Collect all segments from content blocks
function getAllSegments(content: ContentBlock[]): TextSegment[] {
  const segments: TextSegment[] = []
  content.forEach(block => {
    if (block.segments) {
      segments.push(...block.segments)
    }
    if (block.items) {
      block.items.forEach(itemSegments => {
        segments.push(...itemSegments)
      })
    }
  })
  return segments
}

// Mock image loader that returns null
const noopGetImage = async () => null

describe('parseHtmlContent sentence indexing', () => {
  it('should have paragraphIndex match array position for simple paragraphs', async () => {
    const html = `
      <body>
        <p>First sentence. Second sentence.</p>
        <p>Third sentence.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    // Each sentence index should be unique and sequential
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should maintain index alignment with nested divs', async () => {
    const html = `
      <body>
        <div>
          <p>Sentence in div one.</p>
          <div>
            <p>Nested sentence.</p>
          </div>
        </div>
        <p>Sentence after div.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should maintain index alignment with mixed content types', async () => {
    const html = `
      <body>
        <h1>Chapter Title</h1>
        <p>First paragraph sentence.</p>
        <ul>
          <li>List item one.</li>
          <li>List item two.</li>
        </ul>
        <blockquote>A quote here.</blockquote>
        <p>Final paragraph.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    // Verify sentence count matches segment count
    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(paragraphs.length)

    // Verify indices are sequential
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should handle multi-sentence paragraphs correctly', async () => {
    const html = `
      <body>
        <p>First sentence here. Second sentence follows. Third one too.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    // Paragraph mode: entire paragraph is one chunk
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toBe('First sentence here. Second sentence follows. Third one too.')
  })

  it('should handle headings at different levels', async () => {
    const html = `
      <body>
        <h1>Main Title</h1>
        <p>Some content.</p>
        <h2>Subtitle Here</h2>
        <p>More content.</p>
        <h3>Sub-subtitle</h3>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(paragraphs.length)
  })

  it('should maintain index alignment with inline formatting', async () => {
    const html = `
      <body>
        <p>This is <em>emphasized text</em> in a sentence. And <strong>bold text</strong> here.</p>
        <p>Another <i>italic</i> paragraph.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should handle empty elements gracefully', async () => {
    const html = `
      <body>
        <p>Valid sentence.</p>
        <p></p>
        <p>   </p>
        <p>Another valid sentence.</p>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    // Only non-empty paragraphs should create segments
    expect(paragraphs.length).toBe(2)
  })

  it('should handle deeply nested structure', async () => {
    const html = `
      <body>
        <div>
          <section>
            <article>
              <div>
                <p>Deep sentence one.</p>
                <p>Deep sentence two.</p>
              </div>
            </article>
          </section>
        </div>
      </body>
    `
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, paragraphs)

    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(paragraphs.length)
    expect(paragraphs.length).toBe(2)
  })
})

describe('paragraph chunking', () => {
  it('should not split on common abbreviations', async () => {
    const html = `
      <body>
        <p>Dr. Smith went to St. Mary's hospital.</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toContain('Dr.')
    expect(paragraphs[0]).toContain('St.')
  })

  it('should not split on e.g. and i.e.', async () => {
    const html = `
      <body>
        <p>E.g. this is an example.</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
  })

  it('should not split on decimal numbers', async () => {
    const html = `
      <body>
        <p>The value is 3.14 approximately.</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toContain('3.14')
  })

  it('should not split on version numbers', async () => {
    const html = `
      <body>
        <p>Install version 2.0.1 now.</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toContain('2.0.1')
  })

  it('should keep paragraph as single chunk', async () => {
    const html = `
      <body>
        <p>Hello world. How are you?</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toBe('Hello world. How are you?')
  })

  it('should keep punctuation variants as single chunk', async () => {
    const html = `
      <body>
        <p>Wait! What happened?</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toBe('Wait! What happened?')
  })

  it('should preserve abbreviations in single chunk', async () => {
    const html = `
      <body>
        <p>Dr. Johnson is here. She arrived early.</p>
      </body>
    `
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toBe('Dr. Johnson is here. She arrived early.')
  })
})
