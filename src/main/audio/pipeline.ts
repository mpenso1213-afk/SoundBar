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

  init(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async start(config: PipelineConfig): Promise<PipelineStatus> {
    if (this.active) await this.stop()

    this.mixer = new AudioMixerWrapper()
    this.mixer.setMicGain(config.micGain)

    if (config.captureMusicApp) {
      this.mixer.enableMusicInput()
      this.mixer.setMusicGain(config.musicGain)
      const musicStarted = this.musicCapture.start()
      if (musicStarted) {
        this.musicCapture.stream.on('data', (chunk: Buffer) => {
          this.mixer?.feedMusic(chunk)
        })
      }
    }

    // Mic PCM chunks go to renderer for pitch shift; shifted chunks come back via IPC
    this.micCapture.start(config.micDeviceIndex)
    this.micCapture.stream.on('data', (chunk: Buffer) => {
      this.mainWindow?.webContents.send(AudioChannels.MIC_CHUNK, chunk)
    })

    const mixerStream = this.mixer.getOutputStream()
    this.encoder.start(mixerStream)
    this.streamServer.init(this.encoder.outputStream)
    await this.streamServer.start()

    this.active = true
    const streamUrl = this.streamServer.getStreamUrl()

    const status: PipelineStatus = { active: true, streamUrl, error: null }
    this.mainWindow?.webContents.send(AudioChannels.PIPELINE_STATUS, status)
    this.mainWindow?.webContents.send(AudioChannels.STREAM_URL, streamUrl)
    return status
  }

  // Called from IPC when renderer sends back pitch-shifted PCM
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
    this.micCapture.stop()
    this.musicCapture.stop()
    this.encoder.stop()
    this.streamServer.stop()
    this.mixer?.destroy()
    this.mixer = null
    this.active = false
    const status: PipelineStatus = { active: false, streamUrl: null, error: null }
    this.mainWindow?.webContents.send(AudioChannels.PIPELINE_STATUS, status)
  }
}

export const audioPipeline = new AudioPipeline()
