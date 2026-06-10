import { JSDOM } from 'jsdom'

// XML's only predefined entities. Everything else (&nbsp;, &mdash;, …) lives
// in XHTML's external DTD, which non-validating XML parsers never fetch.
const XML_PREDEFINED_ENTITIES = new Set(['amp', 'lt', 'gt', 'quot', 'apos'])

// Decoding through the HTML5 parser (rather than a vendored entity table)
// guarantees the translation can never disagree with what the lenient
// fallback parser would produce for the same input.
const decoderBody = new JSDOM('').window.document.body
const decodedEntities = new Map<string, string>()

const decodeEntity = (entity: string): string => {
  const cached = decodedEntities.get(entity)

  if (cached !== undefined) return cached
  decoderBody.innerHTML = entity
  const decoded = decoderBody.textContent ?? entity

  decodedEntities.set(entity, decoded)
  return decoded
}

/**
 * Rewrites HTML named entities (&nbsp;, &mdash;, …) to numeric character
 * references so the string can survive strict XML parsing. The five
 * XML-predefined entities and names the HTML parser doesn't recognize pass
 * through untouched.
 */
export const translateNamedEntities = (xml: string): string =>
  xml.replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (entity, name: string) => {
    if (XML_PREDEFINED_ENTITIES.has(name)) return entity
    const decoded = decodeEntity(entity)

    if (decoded === entity) return entity
    return [...decoded].map(char => `&#${char.codePointAt(0)};`).join('')
  })
