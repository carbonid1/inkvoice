import { decodeNextEntity } from '../../../decodeNextEntity/decodeNextEntity'

export const sliceHtmlByPlainText = (html: string, chunks: string[]): string[] => {
  const slices: string[] = []
  let htmlPos = 0
  const openTags: string[] = []

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex] ?? ''
    let chunkPlainPos = 0
    let sliceStart = htmlPos
    const tagsOpenAtStart = [...openTags]

    // Skip leading whitespace in HTML between chunks
    if (chunkIndex > 0) {
      while (htmlPos < html.length && html[htmlPos] === ' ') htmlPos++
      sliceStart = htmlPos
    }

    while (chunkPlainPos < chunk.length && htmlPos < html.length) {
      const ch = html[htmlPos]

      if (ch === '<') {
        // Parse tag
        const closeIdx = html.indexOf('>', htmlPos)

        if (closeIdx === -1) break
        const tag = html.slice(htmlPos, closeIdx + 1)
        const isClosing = tag[1] === '/'
        const isSelfClosing = tag[closeIdx - htmlPos - 1] === '/'

        if (!isSelfClosing) {
          if (isClosing) {
            openTags.pop()
          } else {
            const tagName = tag.match(/^<(\w+)/)?.[1]

            if (tagName) openTags.push(tagName)
          }
        }

        htmlPos = closeIdx + 1
      } else if (ch === '&') {
        const entity = decodeNextEntity(html, htmlPos)

        if (entity) {
          chunkPlainPos += entity.char.length
          htmlPos += entity.length
        } else {
          chunkPlainPos++
          htmlPos++
        }
      } else {
        chunkPlainPos++
        htmlPos++
      }
    }

    // Extract the HTML slice
    let slice = html.slice(sliceStart, htmlPos)

    // Close any tags that were opened inside this chunk but not closed
    const tagsToClose = openTags.slice(tagsOpenAtStart.length)

    for (let i = tagsToClose.length - 1; i >= 0; i--) {
      slice += `</${tagsToClose[i]}>`
    }

    // Prepend reopened tags for chunks after the first
    if (chunkIndex > 0) {
      const prefix = tagsOpenAtStart.map(tag => `<${tag}>`).join('')

      slice = prefix + slice
    }

    slices.push(slice)
  }

  return slices
}
