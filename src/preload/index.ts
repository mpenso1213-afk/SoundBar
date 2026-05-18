import { contextBridge, ipcRenderer } from 'electron'
import { SonosChannels, MusicChannels, AudioChannels } from '../shared/ipc-channels'
import type { PipelineConfig } from '../shared/types'

const soundbar = {
  sonos: {
    discover: () => ipcRenderer.invoke(SonosChannels.DISCOVER),
    play: (uuid: string) => ipcRenderer.invoke(SonosChannels.PLAY, uuid),
    pause: (uuid: string) => ipcRenderer.invoke(SonosChannels.PAUSE, uuid),
    stop: (uuid: string) => ipcRenderer.invoke(SonosChannels.STOP, uuid),
    next: (uuid: string) => ipcRenderer.invoke(SonosChannels.NEXT, uuid),
    previous: (uuid: string) => ipcRenderer.invoke(SonosChannels.PREVIOUS, uuid),
    setVolume: (uuid: string, volume: number) =>
      ipcRenderer.invoke(SonosChannels.SET_VOLUME, uuid, volume),
    getTrackInfo: (uuid: string) => ipcRenderer.invoke(SonosChannels.GET_TRACK_INFO, uuid),
    createGroup: (coordinatorUuid: string, memberUuids: string[]) =>
      ipcRenderer.invoke(SonosChannels.CREATE_GROUP, coordinatorUuid, memberUuids),
    dissolveGroup: (groupId: string) => ipcRenderer.invoke(SonosChannels.DISSOLVE_GROUP, groupId),
    addToGroup: (deviceUuid: string, coordinatorUuid: string) =>
      ipcRenderer.invoke(SonosChannels.ADD_TO_GROUP, deviceUuid, coordinatorUuid),
    streamToDevice: (uuid: string, streamUrl: string) =>
      ipcRenderer.invoke(SonosChannels.STREAM_TO_DEVICE, uuid, streamUrl),
    stopStream: (uuid: string) => ipcRenderer.invoke(SonosChannels.STOP_STREAM, uuid),
    testBeep: (uuid: string) => ipcRenderer.invoke(SonosChannels.TEST_BEEP, uuid),
    addByIp: (ip: string) => ipcRenderer.invoke(SonosChannels.ADD_BY_IP, ip),
    onDevicesUpdated: (cb: (devices: unknown[]) => void) => {
      ipcRenderer.on(SonosChannels.DEVICES_UPDATED, (_, devices) => cb(devices))
      return () => ipcRenderer.removeAllListeners(SonosChannels.DEVICES_UPDATED)
    },
  },
  music: {
    play: () => ipcRenderer.invoke(MusicChannels.PLAY),
    pause: () => ipcRenderer.invoke(MusicChannels.PAUSE),
    next: () => ipcRenderer.invoke(MusicChannels.NEXT),
    previous: () => ipcRenderer.invoke(MusicChannels.PREVIOUS),
    playTrack: (id: string) => ipcRenderer.invoke(MusicChannels.PLAY_TRACK, id),
    search: (query: string) => ipcRenderer.invoke(MusicChannels.SEARCH, query),
    getNowPlaying: () => ipcRenderer.invoke(MusicChannels.GET_NOW_PLAYING),
    onNowPlaying: (cb: (state: unknown) => void) => {
      ipcRenderer.on(MusicChannels.NOW_PLAYING, (_, state) => cb(state))
      return () => ipcRenderer.removeAllListeners(MusicChannels.NOW_PLAYING)
    },
  },
  audio: {
    getDevices: () => ipcRenderer.invoke(AudioChannels.GET_DEVICES),
    startPipeline: (config: PipelineConfig) =>
      ipcRenderer.invoke(AudioChannels.START_PIPELINE, config),
    stopPipeline: () => ipcRenderer.invoke(AudioChannels.STOP_PIPELINE),
    setMicGain: (gain: number) => ipcRenderer.invoke(AudioChannels.SET_MIC_GAIN, gain),
    setMusicGain: (gain: number) => ipcRenderer.invoke(AudioChannels.SET_MUSIC_GAIN, gain),
    sendShiftedChunk: (buffer: Buffer) =>
      ipcRenderer.send(AudioChannels.SHIFTED_CHUNK, buffer),
    onMicChunk: (cb: (buffer: Buffer) => void) => {
      ipcRenderer.on(AudioChannels.MIC_CHUNK, (_, buf) => cb(buf))
      return () => ipcRenderer.removeAllListeners(AudioChannels.MIC_CHUNK)
    },
    onStreamUrl: (cb: (url: string) => void) => {
      ipcRenderer.on(AudioChannels.STREAM_URL, (_, url) => cb(url))
      return () => ipcRenderer.removeAllListeners(AudioChannels.STREAM_URL)
    },
    onPipelineStatus: (cb: (status: unknown) => void) => {
      ipcRenderer.on(AudioChannels.PIPELINE_STATUS, (_, status) => cb(status))
      return () => ipcRenderer.removeAllListeners(AudioChannels.PIPELINE_STATUS)
    },
  },
  requestMicPermission: () => ipcRenderer.invoke('app:request-mic-permission'),
}

contextBridge.exposeInMainWorld('soundbar', soundbar)

export type SoundBarAPI = typeof soundbar
