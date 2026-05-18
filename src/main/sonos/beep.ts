import { spawn } from 'child_process'
import express from 'express'
import { Server } from 'http'
import { getLanIp } from '../audio/stream-server'
import { sonosController } from './controller'

let beepServer: Server | null = null
let beepPort = 0

function ensureBeepServer(): Promise<number> {
  if (beepServer && beepPort) return Promise.resolve(beepPort)

  const app = express()

  // Each GET generates a fresh 5-second 440 Hz sine wave MP3 via ffmpeg
  app.get('/beep.mp3', (_req, res) => {
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-cache')

    const ffmpeg = spawn('ffmpeg', [
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=5',
      '-c:a', 'libmp3lame',
      '-b:a', '128k',
      '-id3v2_version', '3',
      '-f', 'mp3',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] })

    ffmpeg.stdout?.pipe(res)
    ffmpeg.on('error', () => res.end())
    res.on('close', () => ffmpeg.kill('SIGTERM'))
  })

  return new Promise((resolve) => {
    beepServer = app.listen(0, () => {
      const addr = beepServer?.address()
      beepPort = typeof addr === 'object' && addr ? addr.port : 0
      resolve(beepPort)
    })
  })
}

export async function testBeep(uuid: string): Promise<void> {
  const port = await ensureBeepServer()
  const url = `http://${getLanIp()}:${port}/beep.mp3`
  await sonosController.streamToDevice(uuid, url)
  // After 7 seconds, stop playback so the speaker returns to its prior state
  setTimeout(() => sonosController.stop(uuid), 7000)
}
