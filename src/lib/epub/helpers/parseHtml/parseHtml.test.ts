import { describe, expect, it } from 'vitest'
import type { ContentBlock, TextSegment } from '@/lib/types/book'
import { parseHtmlContent } from './parseHtml'

const noopGetImage = (): Promise<null> => Promise.resolve(null)

const getAllSegments = (content: ContentBlock[]): TextSegment[] =>
  content.flatMap(block => [
    ...(block.segments ?? []),
    ...(block.items?.flat() ?? []),
    ...(block.rows?.flatMap(row => row.segments) ?? []),
  ])

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
    const indices = allSegments.map(segment => segment.paragraphIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })

  it('should have total segment count equal to total sentence count', async () => {
    const { content, paragraphs } = await parseHtmlContent(mixedHtml, noopGetImage)
    const allSegments = getAllSegments(content)

    expect(allSegments.length).toBe(paragraphs.length)
  })

  it('should have every sentence index point to a valid sentence', async () => {
    const { content, paragraphs } = await parseHtmlContent(mixedHtml, noopGetImage)
    const allSegments = getAllSegments(content)

    allSegments.forEach(segment => {
      expect(paragraphs[segment.paragraphIndex]).toBeDefined()
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
})

describe('attribution detection', () => {
  it('should detect <p class="r"> with text content as attribution', async () => {
    const html = '<body><p class="r"><i>Meditations,</i> General Vosk</p></body>'
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

  it('should preserve external <a> tags with http href', async () => {
    const html = '<body><p>Visit <a href="http://www.example.com">the site</a> for more.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content[0]?.segments?.[0]?.html).toContain('<a href="http://www.example.com">')
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
  it('should keep sentence indices synchronized with br present', async () => {
    const html = '<body><p>First sentence.<br/>Second sentence.</p><p>Third sentence.</p></body>'
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
    expect(allSegments.length).toBe(paragraphs.length)
  })
})

describe('link-list paragraph splitting', () => {
  it('should split <p> with multiple <a> children into separate paragraphs', async () => {
    const html = '<body><p><a href="a">One</a> <a href="b">Two</a> <a href="c">Three</a></p></body>'
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
    const html =
      '<body><ul><li><a href="a">Prologue</a></li><li><a href="b">Epilogue</a></li></ul></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content).toHaveLength(1)
    expect(content[0]?.type).toBe('list')
    expect(content[0]?.items).toHaveLength(2)
  })

  it('should maintain sequential sentence indices across split paragraphs', async () => {
    const html =
      '<body><p><a href="a">First</a> <a href="b">Second</a> <a href="c">Third</a></p></body>'
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
    expect(allSegments.length).toBe(paragraphs.length)
  })
})

describe('misnested landmark anchor (Project Gutenberg)', () => {
  // Gutenberg "Ebookmaker" headings use self-closing landmark anchors like
  // <a id="chap04"/>. Valid XHTML, but HTML5 parsing leaves the <a> open and
  // reconstructs it around every following <p>, trapping the whole chapter in
  // one anchor. Without unwrapping, the chapter collapses into one paragraph.
  const gutenbergHtml = `<body><div class="chapter">
    <h2><a id="chap04"/>IV.<br/>THE CYLINDER OPENS.</h2>
    <p>When I returned to the common the sun was setting.</p>
    <p>&#8220;Keep back! Keep back!&#8221;</p>
    <p>A boy came running towards me.</p>
  </div></body>`

  it('should keep each trapped paragraph as its own block', async () => {
    const { content } = await parseHtmlContent(gutenbergHtml, noopGetImage)
    const paragraphs = content.filter(block => block.type === 'paragraph')

    expect(paragraphs).toHaveLength(3)
  })

  it('should still produce the chapter heading', async () => {
    const { content } = await parseHtmlContent(gutenbergHtml, noopGetImage)

    expect(content[0]?.type).toBe('heading')
  })

  it('should keep paragraph indices sequential after unwrapping', async () => {
    const { content, paragraphs } = await parseHtmlContent(gutenbergHtml, noopGetImage)
    const allSegments = getAllSegments(content)
    const indices = allSegments.map(s => s.paragraphIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
    expect(allSegments.length).toBe(paragraphs.length)
  })
})

describe('container direct-text preservation', () => {
  // Gutenberg poetry (e.g. Leaves of Grass) puts verse lines in DIRECT text
  // nodes of a <div class="pgmonospaced">, separated by <br/>. Descending only
  // into element children would drop every line (they are text nodes, not
  // elements). The container walk must flush inline/text runs as a paragraph.
  it('should preserve <br>-separated direct text inside a div', async () => {
    const html =
      '<body><div class="pgmonospaced">First line<br/>Second line<br/>Third line</div></body>'
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(content.some(b => b.type === 'paragraph')).toBe(true)
    const text = paragraphs.join(' ')

    expect(text).toContain('First line')
    expect(text).toContain('Second line')
    expect(text).toContain('Third line')
  })

  it('should preserve poetry text trapped in a misnested anchor', async () => {
    // Combined real-world shape: self-closing anchor in the heading wraps the
    // following <p> and the <br>-separated verse div.
    const html = `<body><div class="chapter">
      <h2><a id="book03"/>BOOK III</h2>
      <p>Song of Myself</p>
      <div class="pgmonospaced">I celebrate myself<br/>and sing myself</div>
    </div></body>`
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)
    const text = paragraphs.join(' ')

    expect(text).toContain('Song of Myself')
    expect(text).toContain('I celebrate myself')
    expect(text).toContain('and sing myself')
  })

  it('should not drop direct text that sits between block children', async () => {
    const html = '<body><div>Intro prose.<p>A block.</p>Tail prose.</div></body>'
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)
    const text = paragraphs.join(' ')

    expect(text).toContain('Intro prose.')
    expect(text).toContain('A block.')
    expect(text).toContain('Tail prose.')
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

describe('scene break detection', () => {
  it('should emit scene-break between paragraphs separated by empty <p>', async () => {
    const html = '<body><p>Before.</p><p>&nbsp;</p><p>After.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content.map(b => b.type)).toEqual(['paragraph', 'scene-break', 'paragraph'])
  })

  it('should emit scene-break for <hr/>', async () => {
    const html = '<body><p>Before.</p><hr/><p>After.</p></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content.map(b => b.type)).toEqual(['paragraph', 'scene-break', 'paragraph'])
  })

  it('should collapse consecutive breaks and drop leading/trailing breaks', async () => {
    const html =
      '<body><p>&nbsp;</p><p>Before.</p><p>&nbsp;</p><hr/><p>&nbsp;</p><p>After.</p><hr/></body>'
    const { content } = await parseHtmlContent(html, noopGetImage)

    expect(content.map(b => b.type)).toEqual(['paragraph', 'scene-break', 'paragraph'])
  })

  it('should keep paragraph indices contiguous across a scene-break', async () => {
    const html = '<body><p>Before.</p><p>&nbsp;</p><p>After.</p></body>'
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)
    const indices = content.flatMap(b => b.segments?.map(s => s.paragraphIndex) ?? [])

    expect(indices).toEqual([0, 1])
    expect(paragraphs).toHaveLength(2)
  })
})

describe('table parsing', () => {
  it('should emit a table block whose rows keep paragraph indices sequential', async () => {
    const html =
      '<body><p>Intro.</p><table><tr><td>Rise from bed</td><td>6:00 a.m.</td></tr><tr><td>Work</td><td>8:30 p.m.</td></tr></table></body>'
    const { content, paragraphs } = await parseHtmlContent(html, noopGetImage)

    expect(content.some(block => block.type === 'table')).toBe(true)
    const allSegments = getAllSegments(content)

    expect(allSegments).toHaveLength(paragraphs.length)
    const indices = allSegments.map(segment => segment.paragraphIndex).sort((a, b) => a - b)

    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i))
  })
})

describe('blockquote with nested structure preservation', () => {
  // KNOWN BUG — Notion EP-630. Standard Ebooks wraps structured quotations in a
  // <blockquote> that holds a <header> title plus a nested <ul>. The parser's
  // blockquote branch is a leaf (toSegments over the whole element), so the
  // header and every list item collapse into ONE run-on segment and ONE spoken
  // paragraph — wrong both visually and for TTS/highlighting.
  //
  // Real fixture: data/starter-books/the-great-gatsby.epub →
  // epub/text/chapter-9.xhtml lines 173-196 (Gatsby's "General Resolves").
  //
  // This asserts the user-facing contract only — each resolve is its own spoken
  // unit, none merged — and intentionally does NOT prescribe how the parser
  // should represent the result (heading vs list vs quoted block, the block
  // types, the header's spoken-or-not status). That is a separate investigation.
  //
  // Marked `it.fails` because the bug is unfixed: it passes today *because* the
  // body throws. Once the parser is fixed the assertions pass, the body stops
  // throwing, and `it.fails` flips to RED — remove `.fails` then to lock in the
  // regression guard.
  const html = `<body>
    <blockquote>
      <header role="presentation">
        <p class="first-child">General Resolves</p>
      </header>
      <ul>
        <li><p class="first-child">No wasting time at Shafters or [a name, indecipherable]</p></li>
        <li><p class="first-child">No more smokeing or chewing.</p></li>
        <li><p class="first-child">Bath every other day</p></li>
        <li><p class="first-child">Read one improving book or magazine per week</p></li>
        <li><p class="first-child">Save $5.00 [crossed out] $3.00 per week</p></li>
        <li><p class="first-child">Be better to parents</p></li>
      </ul>
    </blockquote>
  </body>`

  it.fails('should keep each resolve as its own spoken paragraph, not one run-on', async () => {
    const { paragraphs } = await parseHtmlContent(html, noopGetImage)

    // The six resolves are six distinct spoken units (currently collapsed to 1).
    expect(paragraphs.length).toBeGreaterThanOrEqual(6)
    // Each resolve stands alone, addressable for narration and highlighting.
    expect(paragraphs).toContain('Bath every other day')
    expect(paragraphs).toContain('Be better to parents')
    // No single entry swallows the whole list into one run-on string.
    const merged = paragraphs.some(
      p => p.includes('Bath every other day') && p.includes('Be better to parents'),
    )

    expect(merged).toBe(false)
  })
})
