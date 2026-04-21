import { isElement } from '../isElement/isElement'

export const getPlainText = (node: Node): string => {
  if (node.nodeType === 3) {
    // Text node
    return node.textContent || ''
  }
  if (isElement(node)) {
    // Element node
    const tag = node.tagName.toLowerCase()
    // Skip script, style
    if (tag === 'script' || tag === 'style') return ''
    if (tag === 'br') return ' '
    // Recurse
    return Array.from(node.childNodes).map(getPlainText).join('')
  }
  return ''
}
