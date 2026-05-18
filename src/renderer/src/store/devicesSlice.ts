import { create } from 'zustand'
import type { SonosDevice } from '../../../shared/types'

interface DevicesState {
  devices: SonosDevice[]
  selectedUuids: Set<string>
  setDevices: (devices: SonosDevice[]) => void
  toggleSelect: (uuid: string) => void
  clearSelection: () => void
}

export const useDevicesStore = create<DevicesState>((set) => ({
  devices: [],
  selectedUuids: new Set(),
  setDevices: (devices) => set({ devices }),
  toggleSelect: (uuid) =>
    set((s) => {
      const next = new Set(s.selectedUuids)
      next.has(uuid) ? next.delete(uuid) : next.add(uuid)
      return { selectedUuids: next }
    }),
  clearSelection: () => set({ selectedUuids: new Set() }),
}))
