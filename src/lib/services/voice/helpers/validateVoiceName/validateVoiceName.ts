const VALID_SLUG = /^[a-z0-9-]+$/
const MAX_LENGTH = 50

export const validateVoiceName = (name: string, existingNames: string[] = []): string | null => {
  if (!name) return 'Voice name is required'
  if (name.length > MAX_LENGTH) return 'Voice name must be 50 characters or less'
  if (!VALID_SLUG.test(name)) return 'Voice name contains invalid characters'
  if (existingNames.includes(name)) return `A voice named "${name}" already exists`
  return null
}
