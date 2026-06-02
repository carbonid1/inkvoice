import { useEffect, useRef, useState } from 'react'
import { expect } from 'storybook/test'
import preview from '#.storybook/preview'
import { parseDocument } from '@/lib/epub/helpers/parseHtml/helpers/parseDocument/parseDocument'
import type { ContentBlock as ContentBlockType } from '@/lib/types/book'
import { ContentBlock } from './ContentBlock'

// Verbatim <table> markup from data/books/the-great-gatsby.epub →
// epub/text/chapter-9.xhtml (Jimmy Gatz's daily SCHEDULE). Kept as-shipped: the
// <time>/<abbr> wrappers, class="last-child", and the ditto marks (”) that mean
// "same as above". Only the invisible word-joiners around the en-dashes are
// dropped. This is the EP-629 repro — before the table branch it rendered as one
// run-on paragraph.
const GATSBY_SCHEDULE = `<table>
  <tbody>
    <tr><td>Rise from bed</td><td><time datetime="1906-09-12T06:00">6:00</time></td><td class="last-child"><abbr>a.m.</abbr></td></tr>
    <tr><td>Dumbbell exercise and wall-scaling</td><td><time datetime="1906-09-12T06:15">6:15</time>–<time datetime="1906-09-12T06:30">6:30</time></td><td class="last-child">”</td></tr>
    <tr><td>Study electricity, <abbr>etc.</abbr></td><td><time datetime="1906-09-12T07:15">7:15</time>–<time datetime="1906-09-12T08:15">8:15</time></td><td class="last-child">”</td></tr>
    <tr><td>Work</td><td><time datetime="1906-09-12T08:30">8:30</time>–<time datetime="1906-09-12T16:30">4:30</time></td><td class="last-child"><abbr>p.m.</abbr></td></tr>
    <tr><td>Baseball and sports</td><td><time datetime="1906-09-12T16:30">4:30</time>–<time datetime="1906-09-12T17:00">5:00</time></td><td class="last-child">”</td></tr>
    <tr><td>Practise elocution, poise and how to attain it</td><td><time datetime="1906-09-12T17:00">5:00</time>–<time datetime="1906-09-12T18:00">6:00</time></td><td class="last-child">”</td></tr>
    <tr><td>Study needed inventions</td><td><time datetime="1906-09-12T19:00">7:00</time>–<time datetime="1906-09-12T21:00">9:00</time></td><td class="last-child">”</td></tr>
  </tbody>
</table>`

const noImage = (): Promise<string | null> => Promise.resolve(null)

// Render an EPUB HTML fragment exactly as the reader does: parse it in the browser
// (DOMParser → the shared parseDocument engine, no jsdom) and render each block
// through the real ContentBlock. This is what makes the fixture trustworthy — it
// exercises the actual parser + renderer, not hand-authored block data.
interface EpubFixtureProps {
  html: string
  currentParagraph?: number
}

const EpubFixture = ({ html, currentParagraph = -1 }: EpubFixtureProps) => {
  const [blocks, setBlocks] = useState<ContentBlockType[]>([])
  const paragraphRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let cancelled = false
    const doc = new DOMParser().parseFromString(html, 'text/html')

    parseDocument(doc, noImage).then(result => {
      if (!cancelled) setBlocks(result.content)
    })
    return () => {
      cancelled = true
    }
  }, [html])

  return (
    <>
      {blocks.map((block, index) => (
        <ContentBlock
          key={index}
          block={block}
          currentParagraph={currentParagraph}
          currentChapter={0}
          paragraphRef={paragraphRef}
        />
      ))}
    </>
  )
}

const meta = preview.meta({
  component: ContentBlock,
  title: 'Reader/EPUB Fixtures',
  parameters: { layout: 'fullscreen' },
  decorators: [
    // Simulate the reader behind the fixture: page background + the centered serif
    // prose column the reader renders content into.
    Story => (
      <div className="bg-background text-foreground min-h-screen w-full">
        <div className="prose prose-lg dark:prose-invert mx-auto max-w-2xl p-6 font-serif">
          <Story />
        </div>
      </div>
    ),
  ],
})

/** Gatsby's daily schedule (ch. IX), verbatim epub markup. Renders as aligned rows
 *  in an inset card — the EP-629 run-on-paragraph bug is gone. Switch the toolbar
 *  theme to check light/dark. */
export const GatsbySchedule = meta.story({
  render: () => <EpubFixture html={GATSBY_SCHEDULE} />,
})

GatsbySchedule.test(
  'renders the schedule as a multi-row table, not one run-on paragraph',
  async ({ canvas }) => {
    const rows = await canvas.findAllByRole('row')

    expect(rows).toHaveLength(7)
  },
)

/** The schedule mid-narration: the active row (index 2, "Study electricity") shows
 *  the full-width highlight band that the reader paints while TTS speaks it. */
export const GatsbyScheduleActiveRow = meta.story({
  render: () => <EpubFixture html={GATSBY_SCHEDULE} currentParagraph={2} />,
})
