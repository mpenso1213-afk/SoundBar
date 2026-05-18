import { execSync, spawn, ChildProcess } from 'child_process'
import { PassThrough } from 'stream'

const LOOPBACK_KEYWORDS = ['blackhole', 'loopback', 'soundflower', 'virtual']

export function findMusicCaptureDevice(): { index: number; name: string } | null {
  try {
    const output = execSync('ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true', {
      encoding: 'utf8',
      timeout: 5000,
    })
    let inAudioSection = false
    for (const line of output.split('\n')) {
      if (line.includes('AVFoundation audio devices')) { inAudioSection = true; continue }
      if (line.includes('AVFoundation video devices')) break
      if (!inAudioSection) continue
      const match = line.match(/\[(\d+)\]\s+(.+)/)
      if (match) {
        const name = match[2].trim()
        if (LOOPBACK_KEYWORDS.some((k) => name.toLowerCase().includes(k))) {
          return { index: parseInt(match[1], 10), name }
        }
      }
    }
  } catch {
    // ffmpeg not available
  }
  return null
}

export class MusicCapture {
  private process: ChildProcess | null = null
  readonly stream = new PassThrough()

  start(): { ok: boolean; error?: string } {
    if (this.process) this.stop()

    const device = findMusicCaptureDevice()
    if (!device) {
      return {
        ok: false,
        error: 'No audio loopback device found. Install BlackHole (brew install --cask blackhole-2ch), set your Mac audio output to BlackHole, then try again.',
      }
    }

    this.process = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-i', `:${device.index}`,
      '-ar', '44100',
      '-ac', '2',
      '-f', 's16le',
      '-acodec', 'pcm_s16le',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] })

    this.process.stdout?.pipe(this.stream, { end: false })
    this.process.on('error', (err) => console.error('Music capture error:', err))
    return { ok: true }
  }

  stop(): void {
    this.process?.kill('SIGTERM')
    this.process = null
  }
}
