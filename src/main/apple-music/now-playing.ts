import { BrowserWindow } from 'electron'
import { MusicChannels } from '../../shared/ipc-channels'
import { appleMusicController } from './controller'

class NowPlayingPoller {
  private interval: ReturnType<typeof setInterval> | null = null
  private mainWindow: BrowserWindow | null = null

  init(win: BrowserWindow): void {
    this.mainWindow = win
  }

  start(): void {
    if (this.interval) return
    this.interval = setInterval(async () => {
      if (!this.mainWindow) return
      const state = await appleMusicController.getNowPlaying().catch(() => null)
      this.mainWindow.webContents.send(MusicChannels.NOW_PLAYING, state)
    }, 1500)
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export const nowPlayingPoller = new NowPlayingPoller()
