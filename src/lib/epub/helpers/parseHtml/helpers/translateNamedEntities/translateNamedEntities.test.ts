import { describe, expect, it } from 'vitest'
import { translateNamedEntities } from './translateNamedEntities'

describe('translateNamedEntities', () => {
  it('should rewrite HTML named entities to numeric character references', () => {
    expect(translateNamedEntities('A&nbsp;B&mdash;C')).toBe('A&#160;B&#8212;C')
  })

  it('should leave the five XML-predefined entities untouched', () => {
    expect(translateNamedEntities('&amp;&lt;&gt;&quot;&apos;')).toBe('&amp;&lt;&gt;&quot;&apos;')
  })

  it('should leave unrecognized entity names untouched', () => {
    expect(translateNamedEntities('&zzznope;')).toBe('&zzznope;')
  })

  it('should leave numeric character references untouched', () => {
    expect(translateNamedEntities('&#8220;quoted&#8221; and &#xA0;')).toBe(
      '&#8220;quoted&#8221; and &#xA0;',
    )
  })

  it('should translate entities inside attribute values', () => {
    expect(translateNamedEntities('<p title="A&nbsp;B">x</p>')).toBe('<p title="A&#160;B">x</p>')
  })
})
