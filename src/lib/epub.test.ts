import { describe, it, expect } from 'vitest'
import { parseHtmlContent, ContentBlock, TextSegment } from './epub'

// Helper to verify sentence index integrity
function verifySentenceIndexIntegrity(
  content: ContentBlock[],
  sentences: string[]
): void {
  content.forEach(block => {
    if (block.segments) {
      block.segments.forEach(segment => {
        expect(sentences[segment.sentenceIndex]).toBeDefined()
      })
    }
    if (block.items) {
      block.items.forEach(itemSegments => {
        itemSegments.forEach(segment => {
          expect(sentences[segment.sentenceIndex]).toBeDefined()
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
  it('should have sentenceIndex match array position for simple paragraphs', async () => {
    const html = `
      <body>
        <p>First sentence. Second sentence.</p>
        <p>Third sentence.</p>
      </body>
    `
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    // Each sentence index should be unique and sequential
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)
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
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)
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
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    // Verify sentence count matches segment count
    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(sentences.length)

    // Verify indices are sequential
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should handle multi-sentence paragraphs correctly', async () => {
    const html = `
      <body>
        <p>First sentence here. Second sentence follows. Third one too.</p>
      </body>
    `
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    expect(sentences.length).toBeGreaterThanOrEqual(3)

    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
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
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(sentences.length)
  })

  it('should maintain index alignment with inline formatting', async () => {
    const html = `
      <body>
        <p>This is <em>emphasized text</em> in a sentence. And <strong>bold text</strong> here.</p>
        <p>Another <i>italic</i> paragraph.</p>
      </body>
    `
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)
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
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    // Only non-empty paragraphs should create segments
    expect(sentences.length).toBe(2)
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
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)

    verifySentenceIndexIntegrity(content, sentences)

    const allSegments = getAllSegments(content)
    expect(allSegments.length).toBe(sentences.length)
    expect(sentences.length).toBe(2)
  })
})
