export const isAllCaps = (s: string): boolean =>
  s.replace(/[^a-zA-Z]/g, '').length > 0 && s === s.toUpperCase()

export const toTitleCase = (s: string): string =>
  s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())

export const normalizeTitle = (s: string): string =>
  (isAllCaps(s) ? toTitleCase(s) : s).replace(/:$/, '')
