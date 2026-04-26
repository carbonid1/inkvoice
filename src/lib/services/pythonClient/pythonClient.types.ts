export type LifecycleState = 'stopped' | 'starting' | 'ready' | 'stopping'

export type LifecycleStatus = {
  state: LifecycleState
  url?: string
  instanceId: number
}

export type PythonClient = {
  fetch: (path: string, init?: RequestInit) => Promise<Response>
  getStatus: () => Promise<LifecycleStatus>
  getCurrentInstanceId: () => number
}
