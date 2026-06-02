import type { ContentBlock, TableRow } from '@/lib/types/book'
import { getInnerHtml } from '../getInnerHtml/getInnerHtml'
import { getPlainText } from '../getPlainText/getPlainText'

// Cells that are only ditto/quote marks (”, ″) mean "same as above" in print.
// They read aloud as garbage, so they are dropped from the SPOKEN text — but
// kept verbatim in the VISUAL cells (faithful to the page). Proper "same as
// above" resolution (carrying the prior row's value) is a follow-up.
const DITTO_ONLY = /^[“”"″'']+$/u

// A cell whose entire visible text lives inside <a> tags — e.g. a table-of-
// contents entry or a Project Gutenberg "other eBooks" catalog row. Empty cells
// count as link-only so spacer cells don't disqualify a navigation table.
const collapseWhitespace = (text: string): string => text.replace(/\s+/g, '')

const isLinkOnlyCell = (cell: Element, text: string): boolean => {
  if (!text) return true

  const links = Array.from(cell.querySelectorAll('a'))

  if (links.length === 0) return false
  return (
    collapseWhitespace(links.map(link => getPlainText(link)).join('')) === collapseWhitespace(text)
  )
}

export interface ProcessedTable {
  block: ContentBlock // { type: 'table', rows }
  paragraphs: string[] // spoken text to append to the shared paragraphs[], one per row
}

// Convert an EPUB <table> into a structured block. Each <tr> is one row: one
// spoken paragraphs[] entry (cells joined for natural narration, "Rise from bed,
// 6 a.m.") plus the per-cell HTML for column-aligned rendering. paragraphIndex
// values continue from `startIndex` (the caller's current paragraphs.length); the
// caller appends the returned `paragraphs` to keep that array dense.
//
// The :scope > selectors stay on the outer table, so rows of a NESTED table
// inside a cell are never hoisted into this one.
//
// Returns null when there is nothing to render as a data table:
//   - no rows carry spoken content, or
//   - every non-empty cell is just links (a TOC / PG catalog). Most EPUB <table>
//     usage in practice is this kind of navigation, not reading content; rendering
//     it as a grid and narrating the links would be a regression. A genuine data
//     table always has at least one prose/number cell, so this never drops one.
export const processTable = (tableEl: Element, startIndex: number): ProcessedTable | null => {
  const rowEls = tableEl.querySelectorAll(
    ':scope > tbody > tr, :scope > thead > tr, :scope > tfoot > tr, :scope > tr',
  )

  const rows: TableRow[] = []
  const paragraphs: string[] = []
  let everyCellIsLink = true

  rowEls.forEach(tr => {
    const cellEls = Array.from(tr.querySelectorAll(':scope > td, :scope > th'))

    if (cellEls.length === 0) return

    const cellTexts = cellEls.map(cell => getPlainText(cell).trim())
    const spoken = cellTexts.filter(text => text && !DITTO_ONLY.test(text)).join(', ')

    // Discard rows with no spoken content (all-ditto or empty spacer rows) BEFORE
    // the navigation check — otherwise a discarded row could flip everyCellIsLink
    // and falsely admit a TOC/catalog table that happens to contain a ditto cell.
    if (!spoken) return

    if (!cellEls.every((cell, index) => isLinkOnlyCell(cell, cellTexts[index] ?? ''))) {
      everyCellIsLink = false
    }

    const cells = cellEls.map(cell => getInnerHtml(cell).trim())

    rows.push({
      segments: [{ paragraphIndex: startIndex + paragraphs.length, html: spoken }],
      cells,
    })
    paragraphs.push(spoken)
  })

  if (rows.length === 0 || everyCellIsLink) return null

  return { block: { type: 'table', rows }, paragraphs }
}
