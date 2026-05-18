export interface SonosDevice {
  uuid: string
  name: string
  host: string
  port: number
  groupId: string | null
  isCoordinator: boolean
  volume: number
  isPlaying: boolean
  currentTrack?: TrackInfo
}

export interface TrackInfo {
  title: string
  artist: string
  album: string
  albumArtUri?: string
  duration: number
  position: number
}

export interface SonosGroup {
  id: string
  coordinatorUuid: string
  memberUuids: string[]
  name: string
}

export interface AppleMusicTrack {
  id: string
  name: string
  artist: string
  album: string
  duration: number
  artworkUrl?: string
}

export interface NowPlayingState {
  track: AppleMusicTrack | null
  isPlaying: boolean
  position: number
  shuffleEnabled: boolean
  repeatMode: 'off' | 'one' | 'all'
}

export interface AudioDevice {
  index: number
  name: string
  type: 'input' | 'output'
}

export interface PipelineConfig {
  micDeviceIndex: number
  micGain: number
  musicGain: number
  pitchSemitones: number
  captureMusicApp: boolean
}

export interface PipelineStatus {
  active: boolean
  streamUrl: string | null
  error: string | null
}
