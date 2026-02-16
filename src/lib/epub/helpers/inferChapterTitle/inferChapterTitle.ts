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

export const inferChapterTitle = (args: InferTitleArgs, fallbackIndex: number): string => {
  if (args.htmlHeading) return args.htmlHeading
  if (args.tocLabel) return args.tocLabel
  if (args.itemTitle) return args.itemTitle
  if (args.isImageOnly) return 'Illustrations'
  return titleFromFileId(args.itemId) ?? `Chapter ${fallbackIndex}`
}
