export const normalizeTags = (tags: string[]): string[] =>
  Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean)))
