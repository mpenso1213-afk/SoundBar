import { spawn, ChildProcess } from 'child_process'
import { PassThrough, Readable } from 'stream'

export class AudioEncoder {
  private process: ChildProcess | null = null
  readonly outputStream = new PassThrough()

  start(inputStream: Readable, inputChannels = 2): void {
    if (this.process) this.stop()

    this.process = spawn('ffmpeg', [
      '-f', 's16le',
      '-ar', '44100',
      '-ac', String(inputChannels),
      '-i', 'pipe:0',
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      '-id3v2_version', '3',
      '-f', 'mp3',
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'ignore'] })

    inputStream.pipe(this.process.stdin as NodeJS.WritableStream)
    this.process.stdout?.pipe(this.outputStream, { end: false })
    this.process.on('error', (err) => console.error('Encoder error:', err))
  }

  stop(): void {
    this.process?.stdin?.end()
    this.process?.kill('SIGTERM')
    this.process = null
  }
}
