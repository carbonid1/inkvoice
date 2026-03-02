'use client'

import { useCallback, useMemo, useState } from 'react'

type DeleteState = {
  deletingVoice: string | null
  deleteVoice: (name: string) => Promise<boolean>
}

export const useDeleteVoice = (): DeleteState => {
  const [deletingVoice, setDeletingVoice] = useState<string | null>(null)

  const deleteVoice = useCallback(async (name: string): Promise<boolean> => {
    setDeletingVoice(name)

    try {
      const response = await fetch(`/api/voices/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch {
      return false
    } finally {
      setDeletingVoice(null)
    }
  }, [])

  return useMemo(() => ({ deletingVoice, deleteVoice }), [deletingVoice, deleteVoice])
}
