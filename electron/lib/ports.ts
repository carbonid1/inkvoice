import net from 'net'

const findAvailablePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (address && typeof address === 'object') {
        const port = address.port
        server.close(() => resolve(port))
      } else {
        server.close(() => reject(new Error('Failed to get port')))
      }
    })
    server.on('error', reject)
  })

export type Ports = {
  nextJs: number
  python: number
}

export const allocatePorts = async (): Promise<Ports> => {
  const nextJs = await findAvailablePort()
  const python = await findAvailablePort()
  return { nextJs, python }
}
