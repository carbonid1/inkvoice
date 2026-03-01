'use client'

import { useCallback, useMemo, useState } from 'react'

type DeleteState = {
  deleting: boolean
  deleteVoice: (name: string) => Promise<boolean>
}

export const useDeleteVoice = (): DeleteState => {
  const [deleting, setDeleting] = useState(false)

  const deleteVoice = useCallback(async (name: string): Promise<boolean> => {
    setDeleting(true)

    try {
      const response = await fetch(`/api/voices/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch {
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  return useMemo(() => ({ deleting, deleteVoice }), [deleting, deleteVoice])
}
