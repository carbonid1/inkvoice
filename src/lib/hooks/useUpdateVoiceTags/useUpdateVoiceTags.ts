'use client'

import { useCallback, useMemo, useState } from 'react'

interface UpdateVoiceTagsState {
  saving: boolean
  error: string | null
  updateTags: (voiceName: string, tags: string[]) => Promise<string[] | null>
}

export const useUpdateVoiceTags = (): UpdateVoiceTagsState => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTags = useCallback(
    async (voiceName: string, tags: string[]): Promise<string[] | null> => {
      setSaving(true)
      setError(null)

      try {
        const response = await fetch(`/api/voices/${encodeURIComponent(voiceName)}/tags`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({ error: 'Failed to update tags' }))

          setError(data.error ?? 'Failed to update tags')
          return null
        }

        const data = await response.json()

        return data.tags
      } catch {
        setError('Failed to update tags')
        return null
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  return useMemo(() => ({ saving, error, updateTags }), [saving, error, updateTags])
}
