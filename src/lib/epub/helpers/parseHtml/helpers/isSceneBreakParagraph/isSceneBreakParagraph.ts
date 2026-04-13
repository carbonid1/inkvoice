export const isSceneBreakParagraph = (el: Element): boolean => {
  if (el.querySelector('img, image')) return false
  const text = el.textContent?.replace(/\u00A0/g, '').trim() ?? ''
  return text.length === 0
}
