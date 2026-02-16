import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { describe, expect, it } from 'vitest'
import { parseHtmlContent } from './parseHtml'

const noopGetImage = async () => null

const getAllSegments = (content: ContentBlock[]): TextSegment[] =>
  content.flatMap(block => [...(block.segments ?? []), ...(block.items?.flat() ?? [])])

describe('structural invariants', () => {
  const mixedHtml = `<body>
    <h1>Title</h1>
    <p class="totalind">Epigraph line.</p>
    <p class="r"><i>Source,</i> Author</p>
    <blockquote>A quoted passage.</blockquote>
    <p>Regular paragraph with <em>emphasis</em>.</p>
    <ul><li>Item one.</li><li>Item two.</li></ul>
    <img src="map.png" alt="Map"/>
  </body>`

  it('should parse all expected block types', async () => {
    const { content } = await parseHtmlContent(mixedHtml, noopGetImage)
    const types = Array.from(new Set(content.map(block => block.type)))

    expect(types).toContain('heading')
    expect(types).toContain('paragraph')
    expect(types).toContain('blockquote')
    expect(types).toContain('attribution')
    expect(types).toContain('list')
    expect(types).toContain('image')
  })

  it('should produce sequential sentence indices with no gaps', async () => {
    const { content } = await parseHtmlContent(mixedHtml, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(segment => segment.sentenceIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should have total segment count equal to total sentence count', async () => {
    const { content, sentences } = await parseHtmlContent(mixedHtml, noopGetImage)
    const allSegments = getAllSegments(content)

    expect(allSegments.length).toBe(sentences.length)
  })

  it('should have every sentence index point to a valid sentence', async () => {
    const { content, sentences } = await parseHtmlContent(mixedHtml, noopGetImage)
    const allSegments = getAllSegments(content)

    allSegments.forEach(segment => {
      expect(sentences[segment.sentenceIndex]).toBeDefined()
    })
  })
})

describe('epigraph detection', () => {
  it('should detect <p class="totalind"> as blockquote', async () => {
    const html =
      '<body><p class="totalind">Words spoken softly carry farther than those shouted from the walls.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })

  it('should detect <p class="totalfirst"> as blockquote', async () => {
    const html = '<body><p class="totalfirst">The decision to move forward regardless.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })

  it('should detect <p class="totalsecond"> as blockquote', async () => {
    const html =
      '<body><p class="totalsecond">We who walked the grey road, through the long silence.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })

  it('should detect <p class="totalsecondfirst"> as blockquote', async () => {
    const html =
      '<body><p class="totalsecondfirst">And so we marched, with frost upon our standards.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })

  it('should detect <p class="totalthree"> as blockquote', async () => {
    const html =
      '<body><p class="totalthree">War reveals character, but it also consumes it.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })

  it('should detect epigraph among other classes', async () => {
    const html = '<body><p class="indent totalind">Epigraph with extra class.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })
})

describe('attribution detection', () => {
  it('should detect <p class="r"> with text content as attribution', async () => {
    const html = '<body><p class="r"><i>Meditations,</i> General Vosk</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('attribution')
  })

  it('should skip <p class="r"> that contains only &nbsp;', async () => {
    const html = '<body><p class="r">&nbsp;</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(0)
  })

  it('should skip <p class="r"> that contains only whitespace', async () => {
    const html = '<body><p class="r">   </p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(0)
  })

  it('should detect attribution with multiple &nbsp; and real text', async () => {
    const html = '<body><p class="r">&nbsp;&mdash; Some Author</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('attribution')
  })
})

describe('centered class handling', () => {
  // Epub class="c" (text-align:center) intentionally rendered as regular paragraphs.
  // Our reader is left-aligned — centering individual blocks looks inconsistent.
  // Speechify centers everything which makes it work there.
  it('should treat <p class="c"> as a regular paragraph', async () => {
    const html = '<body><p class="c">Centered in epub, left-aligned here.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('paragraph')
  })
})

describe('native blockquote', () => {
  it('should detect <blockquote> as blockquote type', async () => {
    const html =
      '<body><blockquote>A flawed decision executed with conviction will outperform a perfect plan.</blockquote></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('blockquote')
  })
})

describe('heading levels', () => {
  it('should preserve heading level for h1', async () => {
    const html = '<body><h1>Main Title</h1></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('heading')
    expect(content[0]?.level).toBe(1)
  })

  it('should preserve heading level for h2', async () => {
    const html = '<body><h2>Subtitle</h2></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('heading')
    expect(content[0]?.level).toBe(2)
  })

  it('should preserve heading level for h3', async () => {
    const html = '<body><h3>Section</h3></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('heading')
    expect(content[0]?.level).toBe(3)
  })
})

describe('list parsing', () => {
  it('should parse unordered list items', async () => {
    const html = '<body><ul><li>Alpha item.</li><li>Beta item.</li></ul></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('list')
    expect(content[0]?.items).toHaveLength(2)
  })

  it('should parse ordered list items', async () => {
    const html = '<body><ol><li>Step one.</li><li>Step two.</li><li>Step three.</li></ol></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('list')
    expect(content[0]?.items).toHaveLength(3)
  })
})

describe('inline formatting preservation', () => {
  it('should preserve <em> tags in html', async () => {
    const html = '<body><p>She walked <em>fourteen leagues</em> north.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content[0]?.segments?.[0]?.html).toContain('<em>')
  })

  it('should preserve <strong> tags in html', async () => {
    const html = '<body><p>There were <strong>three options</strong> available.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content[0]?.segments?.[0]?.html).toContain('<strong>')
  })

  it('should preserve <a> tags with href in html', async () => {
    const html = '<body><p>See the <a href="notes.xhtml">field manual</a> for details.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content[0]?.segments?.[0]?.html).toContain('<a href="notes.xhtml">')
  })

  it('should preserve <sup> tags in html', async () => {
    const html = '<body><p>A scout<sup>1</sup> led the way.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content[0]?.segments?.[0]?.html).toContain('<sup>')
  })

  it('should preserve <sub> tags in html', async () => {
    const html =
      '<body><p>The formula is C<sub>6</sub>H<sub>12</sub>O<sub>6</sub> indeed.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    const combinedHtml = content[0]?.segments?.map(segment => segment.html).join(' ') ?? ''
    expect(combinedHtml).toContain('<sub>')
  })

  it('should preserve <i> and <b> tags in single-sentence context', async () => {
    const html = '<body><p><i>Italic text</i> and <b>bold text</b> in one sentence.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    const segment = content[0]?.segments?.[0]
    expect(segment?.html).toContain('<i>')
    expect(segment?.html).toContain('<b>')
  })
})

describe('empty element handling', () => {
  it('should skip empty <p> elements', async () => {
    const html = '<body><p></p><p>Real content here.</p><p>   </p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('paragraph')
  })
})

describe('nested container flattening', () => {
  it('should extract paragraphs from nested div/section containers', async () => {
    const html = `<body>
      <div>
        <section>
          <p>Nested paragraph one.</p>
          <p>Nested paragraph two.</p>
        </section>
      </div>
    </body>`
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(2)
    expect(content[0]?.type).toBe('paragraph')
    expect(content[1]?.type).toBe('paragraph')
  })
})

describe('br handling', () => {
  it('should preserve <br/> in HTML output', async () => {
    const html = '<body><p>Line one<br/>Line two</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    const segment = content[0]?.segments?.[0]
    expect(segment?.html).toContain('<br/>')
  })

  it('should convert <br/> to space in plain text', async () => {
    const html = '<body><p>Line one<br/>Line two</p></body>'
    const { sentences } = await parseHtmlContent(html, noopGetImage)

    expect(sentences.join(' ')).toContain('Line one Line two')
  })

  it('should keep sentence indices synchronized with br present', async () => {
    const html = '<body><p>First sentence.<br/>Second sentence.</p><p>Third sentence.</p></body>'
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
    expect(allSegments.length).toBe(sentences.length)
  })

  it('should preserve multiple <br/> in verse content', async () => {
    const html =
      '<body><p>We who walked,<br/>who carried iron<br/>through the silence,<br/>know that courage is not fear.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    const combinedHtml = content[0]?.segments?.map(s => s.html).join(' ') ?? ''
    const brCount = (combinedHtml.match(/<br\/>/g) || []).length
    expect(brCount).toBe(3)
  })

  it('should preserve <br/> with surrounding inline tags', async () => {
    const html = '<body><p><em>Italic line</em><br/><strong>Bold line</strong></p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    const segment = content[0]?.segments?.[0]
    expect(segment?.html).toContain('<em>')
    expect(segment?.html).toContain('<br/>')
    expect(segment?.html).toContain('<strong>')
  })
})

describe('link-list paragraph splitting', () => {
  it('should split <p> with multiple <a> children into separate paragraphs', async () => {
    const html =
      '<body><p><a href="a">One</a> <a href="b">Two</a> <a href="c">Three</a></p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(3)
    expect(content.every(block => block.type === 'paragraph')).toBe(true)
  })

  it('should not split <p> with inline link in prose', async () => {
    const html = '<body><p>Text with <a href="a">link</a> inline.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('paragraph')
  })

  it('should not split <p> with a single link', async () => {
    const html = '<body><p><a href="a">Solo link</a></p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('paragraph')
  })

  it('should split <li> with multiple <a> children into separate list items', async () => {
    const html =
      '<body><ul><li><a href="a">Book One</a> <a href="b">Chapter One</a> <a href="c">Chapter Two</a></li></ul></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('list')
    expect(content[0]?.items).toHaveLength(3)
  })

  it('should preserve nested list structure with depth levels', async () => {
    const html = `<body><ul>
      <li><a href="a">Prologue</a></li>
      <li>
        <a href="b">Book One</a>
        <ul>
          <li><a href="c">Chapter One</a></li>
          <li><a href="d">Chapter Two</a></li>
        </ul>
      </li>
      <li><a href="e">Epilogue</a></li>
    </ul></body>`
    const { content } = await parseHtmlContent(html, noopGetImage)

    const lists = content.filter(b => b.type === 'list')
    expect(lists).toHaveLength(3)
    expect(lists[0]?.level).toBe(0)
    expect(lists[0]?.items).toHaveLength(2) // Prologue + Book One (siblings)
    expect(lists[1]?.level).toBe(1)
    expect(lists[1]?.items).toHaveLength(2) // Chapter One, Chapter Two
    expect(lists[2]?.level).toBe(0)
    expect(lists[2]?.items).toHaveLength(1) // Epilogue
  })

  it('should not split <li> with a single link', async () => {
    const html = '<body><ul><li><a href="a">Prologue</a></li><li><a href="b">Epilogue</a></li></ul></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('list')
    expect(content[0]?.items).toHaveLength(2)
  })

  it('should maintain sequential sentence indices across split paragraphs', async () => {
    const html =
      '<body><p><a href="a">First</a> <a href="b">Second</a> <a href="c">Third</a></p></body>'
    const { content, sentences } = await parseHtmlContent(html, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.sentenceIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
    expect(allSegments.length).toBe(sentences.length)
  })
})

describe('image parsing', () => {
  it('should detect images with src and alt', async () => {
    const html = '<body><img src="map.png" alt="A detailed map"/></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('image')
    expect(content[0]?.src).toBe('map.png')
    expect(content[0]?.alt).toBe('A detailed map')
  })

  it('should skip images without src', async () => {
    const html = '<body><img alt="No source"/></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(0)
  })

  it('should detect images inside <figure>', async () => {
    const html = '<body><figure><img src="map.png" alt="Map"/></figure></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('image')
    expect(content[0]?.src).toBe('map.png')
  })

  it('should detect SVG <image> with href', async () => {
    const html = '<body><svg><image href="map.png"/></svg></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('image')
    expect(content[0]?.src).toBe('map.png')
  })

  it('should detect image-only <p> as image', async () => {
    const html = '<body><p><img src="map.png" alt="Map"/></p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('image')
  })

  it('should keep <p> with text and inline image as paragraph', async () => {
    const html = '<body><p>Text with <img src="icon.png"/> inline.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('paragraph')
  })
})
