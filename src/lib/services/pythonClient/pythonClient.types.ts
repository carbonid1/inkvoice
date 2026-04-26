export type LifecycleState = 'stopped' | 'starting' | 'ready' | 'stopping'

export interface LifecycleStatus {
  state: LifecycleState
  url?: string
  instanceId: number
}

export interface PythonClient {
  fetch: (path: string, init?: RequestInit) => Promise<Response>
  getStatus: () => Promise<LifecycleStatus>
  getCurrentInstanceId: () => number
}
