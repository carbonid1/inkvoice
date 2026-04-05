/* eslint-disable no-console */
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 8000
const __dirname = dirname(fileURLToPath(import.meta.url))
const silenceBuffer = readFileSync(resolve(__dirname, '../fixtures/silence.wav'))

const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  if (req.method === 'POST' && req.url === '/tts') {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString())
      console.log(`[mock-tts] ${body.voice} | ${body.text?.slice(0, 60)}...`)

      // Small delay so the worker's SSE events can be observed by the browser
      setTimeout(() => {
        res.writeHead(200, {
          'Content-Type': 'audio/wav',
          'X-Generation-Time-Ms': '50',
        })
        res.end(silenceBuffer)
      }, 50)
    })
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Mock TTS server listening on port ${PORT}`)
})
