import type { AttributeValues } from '../../VoiceDesignSection.consts'

const kebab = (value: string): string => value.trim().replace(/\s+/g, '-')

export const getVoiceDesignTags = (attributes: AttributeValues): string[] => {
  const tags: string[] = []

  if (attributes.gender) tags.push(attributes.gender)
  if (attributes.age) tags.push(kebab(attributes.age))

  // Drop "moderate pitch" — extremes describe a voice; the middle does not.
  if (attributes.pitch && attributes.pitch !== 'moderate pitch') {
    tags.push(kebab(attributes.pitch))
  }

  if (attributes.accent) tags.push(kebab(attributes.accent.replace(/ accent$/, '')))
  if (attributes.style) tags.push(attributes.style)

  return tags
}
