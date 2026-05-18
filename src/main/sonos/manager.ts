import { SonosManager as SvrooijSonosManager } from '@svrooij/sonos'
import { BrowserWindow } from 'electron'
import { SonosChannels } from '../../shared/ipc-channels'
import type { SonosDevice } from '../../shared/types'

class SonosManagerService {
  private manager: SvrooijSonosManager | null = null
  private mainWindow: BrowserWindow | null = null
  private discoveryInterval: ReturnType<typeof setInterval> | null = null

  init(win: BrowserWindow): void {
    this.mainWindow = win
  }

  async discover(): Promise<void> {
    this.manager = new SvrooijSonosManager()
    try {
      await this.manager.InitializeWithDiscovery(30)
      this.pushDevicesToRenderer()
      if (this.discoveryInterval) clearInterval(this.discoveryInterval)
      this.discoveryInterval = setInterval(() => this.pushDevicesToRenderer(), 5000)
    } catch (err) {
      console.error('Sonos discovery error:', err)
    }
  }

  getManager(): SvrooijSonosManager | null {
    return this.manager
  }

  getDevice(uuid: string) {
    try {
      return this.manager?.Devices?.find((d) => d.Uuid === uuid) ?? null
    } catch {
      return null
    }
  }

  private async pushDevicesToRenderer(): Promise<void> {
    if (!this.manager || !this.mainWindow) return
    let devices: SonosDevice[] = []
    try {
      const rawDevices = this.manager.Devices
      devices = rawDevices.map((d) => ({
        uuid: d.Uuid ?? '',
        name: d.Name ?? 'Unknown',
        host: d.Host ?? '',
        port: d.Port ?? 1400,
        groupId: d.GroupName ?? null,
        isCoordinator: d.Coordinator?.Uuid === d.Uuid,
        volume: d.Volume ?? 0,
        isPlaying: d.CurrentTransportStateSimple === 'PLAYING',
      }))
    } catch {
      // devices not yet loaded
    }
    this.mainWindow.webContents.send(SonosChannels.DEVICES_UPDATED, devices)
  }

  destroy(): void {
    if (this.discoveryInterval) clearInterval(this.discoveryInterval)
  }
}

export const sonosManager = new SonosManagerService()
