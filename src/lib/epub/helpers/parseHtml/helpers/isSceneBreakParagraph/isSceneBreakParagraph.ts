// Decorative separators ("\u2014", "* * *", "\u2022\u2022\u2022") have no speakable characters, so
// TTS would produce silence and playback would stall on them \u2014 treat anything
// without a letter or digit as a scene break, same as a visually empty element.
export const isSceneBreakParagraph = (el: Element): boolean => {
  if (el.querySelector('img, image')) return false
  return !/[\p{L}\p{N}]/u.test(el.textContent ?? '')
}
