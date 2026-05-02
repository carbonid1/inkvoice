import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export const useMounted = (): boolean =>
  useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
