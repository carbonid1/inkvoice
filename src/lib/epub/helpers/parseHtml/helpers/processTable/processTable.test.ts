import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { processTable } from './processTable'

const makeTable = (html: string): Element => {
  const dom = new JSDOM(html)
  const table = dom.window.document.querySelector('table')

  if (!table) throw new Error('test html has no <table>')
  return table
}

describe('processTable', () => {
  it('parses each row into cells and joins cell text for natural speech', () => {
    const table = makeTable(
      '<table><tr><td>Rise from bed</td><td>6:00</td><td>a.m.</td></tr><tr><td>Work</td><td>8:30 – 4:30</td><td>p.m.</td></tr></table>',
    )
    const result = processTable(table, 0)

    expect(result?.block.type).toBe('table')
    expect(result?.block.rows).toHaveLength(2)
    expect(result?.block.rows?.[0]?.cells).toHaveLength(3)
    expect(result?.paragraphs).toEqual(['Rise from bed, 6:00, a.m.', 'Work, 8:30 – 4:30, p.m.'])
  })

  it('numbers rows continuing from startIndex so the shared paragraphs[] stays dense', () => {
    const table = makeTable('<table><tr><td>One</td></tr><tr><td>Two</td></tr></table>')
    const result = processTable(table, 5)

    expect(result?.block.rows?.[0]?.segments[0]?.paragraphIndex).toBe(5)
    expect(result?.block.rows?.[1]?.segments[0]?.paragraphIndex).toBe(6)
  })

  it('drops ditto-mark cells from speech but keeps them in the visual cells', () => {
    const table = makeTable('<table><tr><td>Study electricity</td><td>”</td></tr></table>')
    const result = processTable(table, 0)

    expect(result?.paragraphs).toEqual(['Study electricity'])
    expect(result?.block.rows?.[0]?.cells).toEqual(['Study electricity', '”'])
  })

  it('does not hoist rows out of a table nested inside a cell', () => {
    const table = makeTable(
      '<table><tr><td>Outer<table><tr><td>Inner</td></tr></table></td></tr></table>',
    )
    const result = processTable(table, 0)

    expect(result?.block.rows).toHaveLength(1)
  })

  it('returns null for a navigation table whose cells are only links (TOC / catalog)', () => {
    const table = makeTable(
      '<table><tr><td><a href="a">Chapter I</a></td></tr><tr><td><a href="b">Chapter II</a></td></tr></table>',
    )

    expect(processTable(table, 0)).toBeNull()
  })

  it('returns null for a contents table that pairs a plain label with a chapter link', () => {
    // The Mysterious Affair at Styles TOC: a "CHAPTER I." label beside the linked
    // title. The label cell is not a link, so an every-cell check would wrongly
    // render and narrate it; every ROW still carries one link cell.
    const table = makeTable(
      '<table>' +
        '<tr><td>CHAPTER I.</td><td><a href="c1">I GO TO STYLES</a></td></tr>' +
        '<tr><td>CHAPTER II.</td><td><a href="c2">THE 16TH AND 17TH OF JULY</a></td></tr>' +
        '</table>',
    )

    expect(processTable(table, 0)).toBeNull()
  })

  it('returns null for a contents table where the label cell is itself the link', () => {
    // Alice in Wonderland TOC: the "CHAPTER I." cell is the link, the title sits
    // plain beside it — the mirror image of the layout above.
    const table = makeTable(
      '<table>' +
        '<tr><td><a href="c1">CHAPTER I.</a></td><td>Down the Rabbit-Hole</td></tr>' +
        '<tr><td><a href="c2">CHAPTER II.</a></td><td>The Pool of Tears</td></tr>' +
        '</table>',
    )

    expect(processTable(table, 0)).toBeNull()
  })

  it('keeps a data table whose rows lead with an empty cell (does not read empty as a link)', () => {
    // Moby-Dick's Etymology: a blank first column, then the word and its language.
    // Empty cells must not count toward the navigation guard, or this data table
    // would be dropped.
    const table = makeTable(
      '<table>' +
        '<tr><td></td><td>κῆτος,</td><td>Greek.</td></tr>' +
        '<tr><td></td><td>WHŒL,</td><td>Anglo-Saxon.</td></tr>' +
        '</table>',
    )
    const result = processTable(table, 0)

    expect(result?.block.rows).toHaveLength(2)
    expect(result?.paragraphs).toEqual(['κῆτος,, Greek.', 'WHŒL,, Anglo-Saxon.'])
  })

  it('still suppresses a navigation table that also contains a ditto-mark row', () => {
    // The ditto row has no spoken content, so it must not flip the all-links guard.
    const table = makeTable(
      '<table><tr><td><a href="a">Chapter I</a></td></tr><tr><td>”</td></tr></table>',
    )

    expect(processTable(table, 0)).toBeNull()
  })

  it('returns null when no row carries spoken content', () => {
    const table = makeTable('<table><tr><td></td><td>   </td></tr></table>')

    expect(processTable(table, 0)).toBeNull()
  })
})
