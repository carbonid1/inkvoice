import { useEffect, useRef, useState } from 'react'
import { expect, waitFor } from 'storybook/test'
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

// Verbatim from data/books/the-maltese-falcon.epub → epub/text/chapter-14.xhtml:
// the two ship-arrival timetables Spade reads off the news wire. Two separate
// <table>s, each a time column beside an italic ship name and its origin. The
// leading em-dash is the book's own separator between the time and the vessel.
const FALCON_TIMETABLE = `<table>
  <tbody>
    <tr><td class="first-child">12:20 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Capac</i> from Astoria.</td></tr>
    <tr><td class="first-child">5:05 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Helen <abbr epub:type="z3998:given-name">P.</abbr> Drew</i> from Greenwood.</td></tr>
    <tr><td class="first-child">5:06 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Albarado</i> from Bandon.</td></tr>
  </tbody>
</table>
<table>
  <tbody>
    <tr><td class="first-child">5:17 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Tahiti</i> from Sydney and Papeete.</td></tr>
    <tr><td class="first-child">6:05 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Admiral Peoples</i> from Astoria.</td></tr>
    <tr><td class="first-child">8:07 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Caddopeak</i> from San Pedro.</td></tr>
    <tr><td class="first-child">8:17 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Silverado</i> from San Pedro.</td></tr>
    <tr><td class="first-child">8:05 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">La Paloma</i> from Hong Kong.</td></tr>
    <tr><td class="first-child">9:03 <abbr>a.m.</abbr></td><td>—<i epub:type="se:name.vessel.ship">Daisy Gray</i> from Seattle.</td></tr>
  </tbody>
</table>`

// Verbatim from data/books/the-mysterious-affair-at-styles.epub → ...863-h-12:
// the strychnine prescription Poirot reconstructs. Doses keep their <sup> figures
// and the dot leaders that align the label to its quantity on the page.
const STYLES_PRESCRIPTION = `<table style="border: none; padding: 0px; border-spacing: 0px;" summary="">
  <tbody>
    <tr><td style="text-align: left;">Strychninae Sulph. . . . . .</td><td style="text-align: left;">1 gr.</td></tr>
    <tr><td style="text-align: left;">Potass Bromide . . . . . . .</td><td style="text-align: left;"><sup>3</sup>vi</td></tr>
    <tr><td style="text-align: left;">Aqua ad. . . . . . . . . . . . .</td><td style="text-align: left;"><sup>3</sup>viii</td></tr>
    <tr><td style="text-align: left;">Fiat Mistura</td><td/></tr>
  </tbody>
</table>`

// Verbatim from data/books/the-mysterious-affair-at-styles.epub → ...863-h-0: the
// "Contents" heading and the chapter list that follows it. Each row pairs a plain
// "CHAPTER I." label with the linked title; the label cell is not a link, so the
// old "every cell is a link" guard rendered (and narrated) the list as a data
// table. The heading is kept here so the fixture mirrors the real front-matter
// page — the heading must render while the chapter-list table is dropped.
const STYLES_CONTENTS = `<h2>Contents</h2>
<table style="margin-right: auto; margin-left: auto;" summary="">
  <tbody>
    <tr><td>CHAPTER I.  </td><td><a href="863-h-1.htm.html#chap01" class="pginternal">I GO TO STYLES</a></td></tr>
    <tr><td>CHAPTER II.  </td><td><a href="863-h-2.htm.html#chap02" class="pginternal">THE 16TH AND 17TH OF JULY</a></td></tr>
    <tr><td>CHAPTER III.  </td><td><a href="863-h-3.htm.html#chap03" class="pginternal">THE NIGHT OF THE TRAGEDY</a></td></tr>
    <tr><td>CHAPTER IV.  </td><td><a href="863-h-4.htm.html#chap04" class="pginternal">POIROT INVESTIGATES</a></td></tr>
    <tr><td>CHAPTER V.  </td><td><a href="863-h-5.htm.html#chap05" class="pginternal">“IT ISN’T STRYCHNINE, IS IT?”</a></td></tr>
  </tbody>
</table>`

const noImage = (): Promise<string | null> => Promise.resolve(null)

// Render an EPUB HTML fragment exactly as the reader does: parse it in the browser
// (DOMParser → the shared parseDocument engine, no jsdom) and render each block
// through the real ContentBlock. This is what makes the fixture trustworthy — it
// exercises the actual parser + renderer, not hand-authored block data. The hidden
// marker flips to data-parsed="true" once the async parse settles, so a story can
// assert that a fixture rendered *nothing* without racing the parser.
interface EpubFixtureProps {
  html: string
  currentParagraph?: number
}

const EpubFixture = ({ html, currentParagraph = -1 }: EpubFixtureProps) => {
  const [blocks, setBlocks] = useState<ContentBlockType[] | null>(null)
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
      <span hidden data-testid="epub-fixture" data-parsed={blocks !== null} />
      {(blocks ?? []).map((block, index) => (
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

/** The Maltese Falcon's two ship-arrival timetables (ch. XVIII), verbatim epub
 *  markup. Each timetable is its own inset card; the italic ship names survive
 *  into the cells and the time column aligns on tabular figures. */
export const FalconTimetable = meta.story({
  render: () => <EpubFixture html={FALCON_TIMETABLE} />,
})

FalconTimetable.test('renders both timetables as separate tables', async ({ canvas }) => {
  const tables = await canvas.findAllByRole('table')
  const rows = await canvas.findAllByRole('row')

  expect(tables).toHaveLength(2)
  expect(rows).toHaveLength(9) // 3 + 6 arrivals
})

/** The strychnine prescription from The Mysterious Affair at Styles, verbatim epub
 *  markup. The <sup> figures in the doses (³vi, ³viii) are preserved in the cells. */
export const StylesPrescription = meta.story({
  render: () => <EpubFixture html={STYLES_PRESCRIPTION} />,
})

StylesPrescription.test('renders each prescription line as its own row', async ({ canvas }) => {
  const rows = await canvas.findAllByRole('row')

  expect(rows).toHaveLength(4)
  expect(canvas.getByText('1 gr.')).toBeInTheDocument()
})

/** A front-matter page whose chapter list (label + chapter-link per row) is
 *  navigation, not reading content. The "Contents" heading renders, but the
 *  chapter-list table is dropped rather than painted as a fake data table the
 *  narrator would read aloud — so the canvas shows only the heading. */
export const ContentsTableIgnored = meta.story({
  render: () => <EpubFixture html={STYLES_CONTENTS} />,
})

ContentsTableIgnored.test(
  'keeps surrounding prose but drops the chapter-list table',
  async ({ canvas }) => {
    const marker = await canvas.findByTestId('epub-fixture')

    await waitFor(() => expect(marker.getAttribute('data-parsed')).toBe('true'))

    expect(canvas.getByText('Contents')).toBeInTheDocument()
    expect(canvas.queryAllByRole('table')).toHaveLength(0)
    expect(canvas.queryAllByRole('row')).toHaveLength(0)
  },
)
