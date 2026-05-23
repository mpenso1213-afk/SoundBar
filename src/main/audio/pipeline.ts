import { BrowserWindow } from 'electron'
import { MicCapture } from './capture/mic'
import { MusicCapture } from './capture/music'
import { AudioMixerWrapper } from './mixer'
import { AudioEncoder } from './encoder'
import { StreamServer } from './stream-server'
import { AudioChannels } from '../../shared/ipc-channels'
import type { PipelineConfig, PipelineStatus } from '../../shared/types'

class AudioPipeline {
  private micCapture = new MicCapture()
  private musicCapture = new MusicCapture()
  private mixer: AudioMixerWrapper | null = null
  private encoder = new AudioEncoder()
  private streamServer = new StreamServer()
  private mainWindow: BrowserWindow | null = null
  private active = false
  private silenceTimer: ReturnType<typeof setInterval> | null = null

  init(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async start(config: PipelineConfig): Promise<PipelineStatus> {
    if (this.active) await this.stop()

    const wantMic = config.micGain > 0
    const wantMusic = config.captureMusicApp
    const micOnly = wantMic && !wantMusic
    const musicOnly = !wantMic && wantMusic

    if (micOnly) {
      // Mic-only: bypass mixer + IPC, pipe capture directly to encoder (mono)
      this.micCapture.start(config.micDeviceIndex)
      this.encoder.start(this.micCapture.stream, 1)

    } else if (musicOnly) {
      // Music-only: bypass mixer, pipe capture → encoder directly
      const result = this.musicCapture.start()
      if (!result.ok) {
        return { active: false, streamUrl: null, error: result.error ?? 'Music capture failed' }
      }
      this.encoder.start(this.musicCapture.stream)

    } else if (wantMic && wantMusic) {
      // Full mix: mic + optional music through AudioMixerWrapper
      this.mixer = new AudioMixerWrapper()
      this.mixer.setMicGain(config.micGain)

      if (config.captureMusicApp) {
        const result = this.musicCapture.start()
        if (result.ok) {
          this.mixer.enableMusicInput()
          this.mixer.setMusicGain(config.musicGain)
          this.musicCapture.stream.on('data', (chunk: Buffer) => {
            this.mixer?.feedMusic(chunk)
          })
        }
      }

      // Mic chunks go to renderer for pitch shift; shifted chunks come back via IPC
      this.micCapture.start(config.micDeviceIndex)
      this.micCapture.stream.on('data', (chunk: Buffer) => {
        this.mainWindow?.webContents.send(AudioChannels.MIC_CHUNK, chunk)
      })

      // If mic is not actively being sent back (no KaraokePanel listener), inject
      // silence locally so the mixer keeps flushing without stalling
      const silenceChunk = Buffer.alloc(4096, 0)
      this.silenceTimer = setInterval(() => {
        if (this.mixer) this.mixer.feedMic(silenceChunk)
      }, 46)

      this.encoder.start(this.mixer.getOutputStream())
    }

    this.streamServer.init(this.encoder.outputStream)
    await this.streamServer.start()
    this.active = true

    const streamUrl = this.streamServer.getStreamUrl()
    const status: PipelineStatus = { active: true, streamUrl, error: null }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(AudioChannels.PIPELINE_STATUS, status)
      this.mainWindow.webContents.send(AudioChannels.STREAM_URL, streamUrl)
    }
    return status
  }

  // Overrides the silence-injection when KaraokePanel is open and sending real chunks
  injectShiftedChunk(buffer: Buffer): void {
    if (!this.active || !this.mixer) return
    this.mixer.feedMic(buffer)
  }

  setMicGain(gain: number): void {
    this.mixer?.setMicGain(gain)
  }

  setMusicGain(gain: number): void {
    this.mixer?.setMusicGain(gain)
  }

  async stop(): Promise<void> {
    if (this.silenceTimer) { clearInterval(this.silenceTimer); this.silenceTimer = null }
    this.micCapture.stop()
    this.musicCapture.stop()
    this.encoder.stop()
    this.streamServer.stop()
    this.mixer?.destroy()
    this.mixer = null
    this.active = false
    const status: PipelineStatus = { active: false, streamUrl: null, error: null }
    if (this.mainWindow && !this.mainWindow.isDestroyed())
      this.mainWindow.webContents.send(AudioChannels.PIPELINE_STATUS, status)
  }
}

export const audioPipeline = new AudioPipeline()
