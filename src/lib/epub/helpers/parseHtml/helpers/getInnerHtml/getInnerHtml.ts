import { isElement } from '../isElement/isElement'

export const getInnerHtml = (node: Node): string => {
  if (node.nodeType === 3) {
    // Text node - escape HTML
    const text = node.textContent || ''

    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  if (isElement(node)) {
    const el = node
    const tag = el.tagName.toLowerCase()

    if (tag === 'script' || tag === 'style') return ''

    const voidElements = ['br', 'hr']

    if (voidElements.includes(tag)) {
      return `<${tag}/>`
    }

    // For inline formatting tags, preserve them
    const inlineTags = ['em', 'i', 'strong', 'b', 'u', 'span', 'sup', 'sub', 'small']
    const childHtml = Array.from(node.childNodes).map(getInnerHtml).join('')

    if (tag === 'a') {
      const href = el.getAttribute('href')

      if (href?.startsWith('http')) {
        return `<a href="${href}">${childHtml}</a>`
      }
      return childHtml
    }

    if (inlineTags.includes(tag)) {
      return `<${tag}>${childHtml}</${tag}>`
    }

    // For other tags, just return the content
    return childHtml
  }
  return ''
}
