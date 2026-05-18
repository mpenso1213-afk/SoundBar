import express from 'express'
import { Server } from 'http'
import { networkInterfaces } from 'os'
import { PassThrough } from 'stream'

export function getLanIp(): string {
  const nets = networkInterfaces()
  for (const iface of Object.values(nets)) {
    if (!iface) continue
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return '127.0.0.1'
}

export class StreamServer {
  private app = express()
  private server: Server | null = null
  private clients = new Set<express.Response>()
  private encodedStream: PassThrough | null = null
  port = 0

  init(encodedStream: PassThrough): void {
    this.encodedStream = encodedStream

    this.app.get('/stream.mp3', (req, res) => {
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Transfer-Encoding', 'chunked')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('icy-name', 'SoundBar')
      res.setHeader('icy-metaint', '0')
      res.flushHeaders()
      this.clients.add(res)
      req.on('close', () => this.clients.delete(res))
    })

    encodedStream.on('data', (chunk: Buffer) => {
      for (const client of this.clients) {
        try {
          client.write(chunk)
        } catch {
          this.clients.delete(client)
        }
      }
    })
  }

  getStreamUrl(): string {
    return `http://${getLanIp()}:${this.port}/stream.mp3`
  }

  start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = this.app.listen(0, () => {
        const addr = this.server?.address()
        this.port = typeof addr === 'object' && addr ? addr.port : 0
        resolve(this.port)
      })
    })
  }

  stop(): void {
    for (const client of this.clients) {
      try { client.end() } catch { /* ignore */ }
    }
    this.clients.clear()
    this.server?.close()
    this.server = null
  }
}
