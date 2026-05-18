import { sonosManager } from './manager'
import type { TrackInfo } from '../../shared/types'

const volumeDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

export const sonosController = {
  async play(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Play()
  },

  async pause(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Pause()
  },

  async stop(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Stop()
  },

  async next(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Next()
  },

  async previous(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Previous()
  },

  setVolume(uuid: string, volume: number): void {
    const existing = volumeDebounceTimers.get(uuid)
    if (existing) clearTimeout(existing)
    volumeDebounceTimers.set(
      uuid,
      setTimeout(async () => {
        const d = sonosManager.getDevice(uuid)
        if (!d) return
        await d.SetVolume(Math.round(volume))
        volumeDebounceTimers.delete(uuid)
      }, 100)
    )
  },

  async getTrackInfo(uuid: string): Promise<TrackInfo | null> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return null
    try {
      const [mediaInfo, posInfo] = await Promise.all([
        d.AVTransportService.GetMediaInfo(),
        d.AVTransportService.GetPositionInfo(),
      ])
      return {
        title: posInfo.TrackMetaData?.Title ?? '',
        artist: posInfo.TrackMetaData?.Creator ?? '',
        album: posInfo.TrackMetaData?.Album ?? '',
        albumArtUri: posInfo.TrackMetaData?.AlbumArtUri,
        duration: parseDuration(posInfo.TrackDuration ?? '0:00:00'),
        position: parseDuration(posInfo.RelTime ?? '0:00:00'),
      }
    } catch {
      return null
    }
  },

  async streamToDevice(uuid: string, streamUrl: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.SetAVTransportURI(streamUrl)
    await d.Play()
  },

  async stopStream(uuid: string): Promise<void> {
    const d = sonosManager.getDevice(uuid)
    if (!d) return
    await d.Stop()
  },
}

function parseDuration(str: string): number {
  const parts = str.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return Number(str) || 0
}
