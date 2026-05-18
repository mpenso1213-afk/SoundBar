import { Mixer, Input } from 'audio-mixer'
import { Readable } from 'stream'

export class AudioMixerWrapper {
  private mixer: InstanceType<typeof Mixer>
  private micInput: InstanceType<typeof Input>
  private musicInput: InstanceType<typeof Input> | null = null

  constructor() {
    this.mixer = new Mixer({
      channels: 2,
      bitDepth: 16,
      sampleRate: 44100,
      clearInterval: 250,
    })
    // Mic: mono input (upmixed to stereo by mixer)
    this.micInput = new Input({ channels: 1, bitDepth: 16, sampleRate: 44100, volume: 100 })
    this.mixer.addInput(this.micInput)
  }

  enableMusicInput(): void {
    if (this.musicInput) return
    this.musicInput = new Input({ channels: 2, bitDepth: 16, sampleRate: 44100, volume: 80 })
    this.mixer.addInput(this.musicInput)
  }

  feedMic(data: Buffer): void {
    this.micInput.write(data)
  }

  feedMusic(data: Buffer): void {
    this.musicInput?.write(data)
  }

  setMicGain(gain: number): void {
    this.micInput.setVolume(Math.round(gain * 100))
  }

  setMusicGain(gain: number): void {
    this.musicInput?.setVolume(Math.round(gain * 100))
  }

  getOutputStream(): Readable {
    return this.mixer as unknown as Readable
  }

  destroy(): void {
    this.mixer.destroy()
  }
}
