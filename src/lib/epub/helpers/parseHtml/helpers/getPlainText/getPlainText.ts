export const getPlainText = (node: Node): string => {
  if (node.nodeType === 3) {
    // Text node
    return node.textContent || ''
  }
  if (node.nodeType === 1) {
    // Element node
    const el = node as Element
    const tag = el.tagName.toLowerCase()
    // Skip script, style
    if (tag === 'script' || tag === 'style') return ''
    if (tag === 'br') return ' '
    // Recurse
    return Array.from(node.childNodes).map(getPlainText).join('')
  }
  return ''
}
