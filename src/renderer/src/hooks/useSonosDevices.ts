import { useEffect } from 'react'
import { useDevicesStore } from '../store/devicesSlice'
import type { SonosDevice } from '../../../shared/types'

declare global {
  interface Window {
    soundbar: import('../../../preload/index').SoundBarAPI
  }
}

export function useSonosDevices(): void {
  const setDevices = useDevicesStore((s) => s.setDevices)

  useEffect(() => {
    const unsubscribe = window.soundbar.sonos.onDevicesUpdated((devices) => {
      setDevices(devices as SonosDevice[])
    })
    return unsubscribe
  }, [setDevices])
}
