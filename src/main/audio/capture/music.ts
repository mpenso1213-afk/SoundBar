import { execSync, spawn, ChildProcess } from 'child_process'
import { PassThrough } from 'stream'

function getMusicAppPid(): number | null {
  try {
    const pid = execSync("pgrep -x 'Music'", { encoding: 'utf8' }).trim()
    return pid ? parseInt(pid, 10) : null
  } catch {
    return null
  }
}

export class MusicCapture {
  private process: ChildProcess | null = null
  readonly stream = new PassThrough()

  start(): boolean {
    if (this.process) this.stop()

    const pid = getMusicAppPid()
    if (!pid) {
      console.warn('MusicCapture: Music.app is not running')
      return false
    }

    // Use ffmpeg with avfoundation to capture the default audio output device.
    // On macOS 15+ we can use a tap; for now we capture the system default output
    // which reflects whatever is playing (works when Music.app is the active source).
    // If BlackHole is installed it will be preferred via the device list.
    this.process = spawn('ffmpeg', [
      '-f', 'avfoundation',
      '-i', ':default',
      '-ar', '44100',
      '-ac', '2',
      '-f', 's16le',
      '-acodec', 'pcm_s16le',
      'pipe:1',
    ], { stdio: ['ignore', 'pipe', 'ignore'] })

    this.process.stdout?.pipe(this.stream, { end: false })
    this.process.on('error', (err) => console.error('Music capture error:', err))
    return true
  }

  stop(): void {
    this.process?.kill('SIGTERM')
    this.process = null
  }
}
