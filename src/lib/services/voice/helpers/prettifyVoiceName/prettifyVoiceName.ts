export const prettifyVoiceName = (slug: string): string =>
  slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
