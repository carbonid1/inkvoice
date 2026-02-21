type DecodedEntity = {
  char: string
  length: number
}

export const decodeNextEntity = (html: string, pos: number): DecodedEntity | null => {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201c',
    '&rdquo;': '\u201d',
  }

  for (const [entity, char] of Object.entries(entities)) {
    if (html.slice(pos, pos + entity.length) === entity) {
      return { char, length: entity.length }
    }
  }

  // Numeric entity
  const numMatch = html.slice(pos).match(/^&#(\d+);/)
  if (numMatch?.[1]) {
    return { char: String.fromCharCode(parseInt(numMatch[1], 10)), length: numMatch[0].length }
  }

  return null
}
