import { rmSync } from 'node:fs'
import { E2E_DATA_DIR } from './e2e.consts'

const globalTeardown = () => {
  rmSync(E2E_DATA_DIR, { recursive: true, force: true })
}

export default globalTeardown
