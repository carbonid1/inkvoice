const FILE_ID_LABELS: Record<string, string> = {
  cover: 'Cover',
  copyright: 'Copyright',
  dedication: 'Dedication',
  abouttheauthor: 'About the Author',
}

const titleFromFileId = (itemId: string): string | undefined => {
  const normalized = itemId.toLowerCase().replace(/\.x?html?$/, '')
  for (const [keyword, label] of Object.entries(FILE_ID_LABELS)) {
    if (normalized.includes(keyword)) return label
  }
  return undefined
}

type InferTitleArgs = {
  /** First `<h1-3>` text from chapter HTML. Source: epub */
  htmlHeading: string | undefined
  /** Label from `epub.toc` matched by spine item ID. Source: epub */
  tocLabel: string | undefined
  /** `item.title` from epub spine/flow. Source: epub */
  itemTitle: string | undefined
  /** Chapter has images but no text sentences. Source: generated */
  isImageOnly: boolean
  /** Spine item ID / filename — parsed for keywords like "cover", "dedication". Source: epub, label generated */
  itemId: string
}

const isAllCaps = (s: string): boolean =>
  s.replace(/[^a-zA-Z]/g, '').length > 0 && s === s.toUpperCase()

const toTitleCase = (s: string): string =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

const normalize = (s: string): string => (isAllCaps(s) ? toTitleCase(s) : s)

export const inferChapterTitle = (args: InferTitleArgs, fallbackIndex: number): string => {
  if (args.htmlHeading) return normalize(args.htmlHeading)
  if (args.tocLabel) return normalize(args.tocLabel)
  if (args.itemTitle) return normalize(args.itemTitle)
  if (args.isImageOnly) return 'Illustrations'
  return titleFromFileId(args.itemId) ?? `Chapter ${fallbackIndex}`
}
