export interface SonosDeviceInfo {
  uuid: string
  name: string
  host: string
  port: number
  groupId: string | null
  isCoordinator: boolean
  volume: number
  isPlaying: boolean
}
