// Node.nodeType === 1 is the spec-defined check for Element.
// We use this rather than `instanceof Element` because JSDOM creates nodes
// in its own realm whose constructors differ from the global Element.
export const isElement = (node: Node): node is Element => node.nodeType === 1
