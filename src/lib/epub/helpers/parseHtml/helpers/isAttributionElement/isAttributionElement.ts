export const isAttributionElement = (el: Element): boolean => {
  const classes = el.getAttribute('class')?.split(/\s+/) ?? []
  if (!classes.includes('r')) return false
  const text = el.textContent?.replace(/\u00a0/g, '').trim() ?? ''
  return text.length > 0
}
