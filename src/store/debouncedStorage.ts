import type { StateStorage } from 'zustand/middleware'

type PendingWrite = {
  timeout: ReturnType<typeof setTimeout> | null
  key: string | null
  value: string | null
  listenerAdded: boolean
}

// Factory — each store gets its own pending write slot to avoid overwrites
export const createDebouncedStorage = (): StateStorage => {
  const pending: PendingWrite = {
    timeout: null,
    key: null,
    value: null,
    listenerAdded: false,
  }

  const flushStorage = () => {
    if (pending.key !== null && pending.value !== null) {
      localStorage.setItem(pending.key, pending.value)
      pending.key = null
      pending.value = null
    }
    if (pending.timeout) {
      clearTimeout(pending.timeout)
      pending.timeout = null
    }
  }

  return {
    getItem: name => {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(name)
    },
    setItem: (name, value) => {
      if (typeof window === 'undefined') return
      if (!pending.listenerAdded) {
        window.addEventListener('beforeunload', flushStorage)
        pending.listenerAdded = true
      }
      pending.key = name
      pending.value = value
      if (pending.timeout) clearTimeout(pending.timeout)
      pending.timeout = setTimeout(flushStorage, 1000)
    },
    removeItem: name => {
      if (typeof window === 'undefined') return
      flushStorage()
      localStorage.removeItem(name)
    },
  }
}
