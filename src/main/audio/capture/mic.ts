import { spawn, ChildProcess } from 'child_process'
import { PassThrough } from 'stream'

export class MicCapture {
  private process: ChildProcess | null = null
  readonly stream = new PassThrough()

  start(deviceIndex: number): void {
    if (this.process) this.stop()

    // Use ffmpeg to capture mic input as raw PCM
    this.process = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-i', `:${deviceIndex}`,
      '-ar', '44100',
      '-ac', '1',
      '-f', 's16le',
      '-acodec', 'pcm_s16le',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] })

    this.process.stdout?.pipe(this.stream, { end: false })
    this.process.on('error', (err) => console.error('Mic capture error:', err))
  }

  stop(): void {
    this.process?.kill('SIGTERM')
    this.process = null
  }
}
