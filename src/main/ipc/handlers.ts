import { ipcMain, systemPreferences } from 'electron'
import { SonosChannels, MusicChannels, AudioChannels } from '../../shared/ipc-channels'
import { sonosManager } from '../sonos/manager'
import { sonosController } from '../sonos/controller'
import { sonosGroups } from '../sonos/groups'
import { testBeep } from '../sonos/beep'
import { appleMusicController } from '../apple-music/controller'
import { audioPipeline } from '../audio/pipeline'
import { getAudioDevices } from '../audio/devices'

export function registerIpcHandlers(): void {
  // Sonos
  ipcMain.handle(SonosChannels.DISCOVER, () => sonosManager.discover())
  ipcMain.handle(SonosChannels.PLAY, (_, uuid: string) => sonosController.play(uuid))
  ipcMain.handle(SonosChannels.PAUSE, (_, uuid: string) => sonosController.pause(uuid))
  ipcMain.handle(SonosChannels.STOP, (_, uuid: string) => sonosController.stop(uuid))
  ipcMain.handle(SonosChannels.NEXT, (_, uuid: string) => sonosController.next(uuid))
  ipcMain.handle(SonosChannels.PREVIOUS, (_, uuid: string) => sonosController.previous(uuid))
  ipcMain.handle(SonosChannels.SET_VOLUME, (_, uuid: string, volume: number) =>
    sonosController.setVolume(uuid, volume)
  )
  ipcMain.handle(SonosChannels.GET_TRACK_INFO, (_, uuid: string) =>
    sonosController.getTrackInfo(uuid)
  )
  ipcMain.handle(SonosChannels.CREATE_GROUP, (_, coordinatorUuid: string, memberUuids: string[]) =>
    sonosGroups.createGroup(coordinatorUuid, memberUuids)
  )
  ipcMain.handle(SonosChannels.DISSOLVE_GROUP, (_, groupId: string) =>
    sonosGroups.dissolveGroup(groupId)
  )
  ipcMain.handle(SonosChannels.ADD_TO_GROUP, (_, deviceUuid: string, coordinatorUuid: string) =>
    sonosGroups.addToGroup(deviceUuid, coordinatorUuid)
  )
  ipcMain.handle(SonosChannels.STREAM_TO_DEVICE, (_, uuid: string, streamUrl: string) =>
    sonosController.streamToDevice(uuid, streamUrl)
  )
  ipcMain.handle(SonosChannels.STOP_STREAM, (_, uuid: string) =>
    sonosController.stopStream(uuid)
  )
  ipcMain.handle(SonosChannels.TEST_BEEP, (_, uuid: string) => testBeep(uuid))
  ipcMain.handle(SonosChannels.ADD_BY_IP, (_, ip: string) => sonosManager.addByIp(ip))

  // Apple Music
  ipcMain.handle(MusicChannels.PLAY, () => appleMusicController.play())
  ipcMain.handle(MusicChannels.PAUSE, () => appleMusicController.pause())
  ipcMain.handle(MusicChannels.NEXT, () => appleMusicController.nextTrack())
  ipcMain.handle(MusicChannels.PREVIOUS, () => appleMusicController.previousTrack())
  ipcMain.handle(MusicChannels.PLAY_TRACK, (_, trackId: string) =>
    appleMusicController.playTrack(trackId)
  )
  ipcMain.handle(MusicChannels.SEARCH, (_, query: string) =>
    appleMusicController.search(query)
  )
  ipcMain.handle(MusicChannels.GET_NOW_PLAYING, () => appleMusicController.getNowPlaying())
  ipcMain.handle(MusicChannels.GET_AIRPLAY_DEVICES, () => appleMusicController.getAirPlayDevices())
  ipcMain.handle(MusicChannels.SET_AIRPLAY_DEVICE, (_, deviceName: string, active: boolean) =>
    appleMusicController.setAirPlayToDevice(deviceName, active)
  )

  // Audio pipeline
  ipcMain.handle(AudioChannels.GET_DEVICES, () => getAudioDevices())
  ipcMain.handle(AudioChannels.START_PIPELINE, (_, config) => audioPipeline.start(config))
  ipcMain.handle(AudioChannels.STOP_PIPELINE, () => audioPipeline.stop())
  ipcMain.handle(AudioChannels.SET_MIC_GAIN, (_, gain: number) =>
    audioPipeline.setMicGain(gain)
  )
  ipcMain.handle(AudioChannels.SET_MUSIC_GAIN, (_, gain: number) =>
    audioPipeline.setMusicGain(gain)
  )

  // Mic permission
  ipcMain.handle('app:request-mic-permission', async () => {
    const status = await systemPreferences.askForMediaAccess('microphone')
    return status
  })

  // Shifted PCM from renderer back into mixer
  ipcMain.on(AudioChannels.SHIFTED_CHUNK, (_, buffer: Buffer) => {
    audioPipeline.injectShiftedChunk(buffer)
  })
}
