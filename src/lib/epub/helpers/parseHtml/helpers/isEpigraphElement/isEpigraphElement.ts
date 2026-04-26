export const EPIGRAPH_CLASS_PATTERN = /^total(ind|first|second|secondfirst|three)$/

export const isEpigraphElement = (el: Element): boolean => {
  const classes = el.getAttribute('class')?.split(/\s+/) ?? []

  return classes.some(c => EPIGRAPH_CLASS_PATTERN.test(c))
}
