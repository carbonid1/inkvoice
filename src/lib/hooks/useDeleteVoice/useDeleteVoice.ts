'use client'

import { useCallback, useMemo } from 'react'

interface DeleteVoiceState {
  deleteVoice: (name: string) => Promise<boolean>
  restoreVoice: (name: string) => Promise<boolean>
}

export const useDeleteVoice = (): DeleteVoiceState => {
  const deleteVoice = useCallback(async (name: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/voices/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      })

      return response.ok
    } catch {
      return false
    }
  }, [])

  const restoreVoice = useCallback(async (name: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/voices/${encodeURIComponent(name)}`, {
        method: 'PATCH',
      })

      return response.ok
    } catch {
      return false
    }
  }, [])

  return useMemo(() => ({ deleteVoice, restoreVoice }), [deleteVoice, restoreVoice])
}
