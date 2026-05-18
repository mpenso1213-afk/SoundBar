import { create } from 'zustand'
import type { AudioDevice, PipelineStatus } from '../../../shared/types'

interface AudioState {
  devices: AudioDevice[]
  selectedDeviceIndex: number
  micGain: number
  musicGain: number
  pitchSemitones: number
  captureMusicApp: boolean
  pipelineStatus: PipelineStatus
  streamUrl: string | null
  setDevices: (devices: AudioDevice[]) => void
  setSelectedDevice: (index: number) => void
  setMicGain: (gain: number) => void
  setMusicGain: (gain: number) => void
  setPitch: (semitones: number) => void
  setCaptureMusicApp: (v: boolean) => void
  setPipelineStatus: (status: PipelineStatus) => void
  setStreamUrl: (url: string | null) => void
}

export const useAudioStore = create<AudioState>((set) => ({
  devices: [],
  selectedDeviceIndex: 0,
  micGain: 1.0,
  musicGain: 0.8,
  pitchSemitones: 0,
  captureMusicApp: false,
  pipelineStatus: { active: false, streamUrl: null, error: null },
  streamUrl: null,
  setDevices: (devices) => set({ devices }),
  setSelectedDevice: (selectedDeviceIndex) => set({ selectedDeviceIndex }),
  setMicGain: (micGain) => set({ micGain }),
  setMusicGain: (musicGain) => set({ musicGain }),
  setPitch: (pitchSemitones) => set({ pitchSemitones }),
  setCaptureMusicApp: (captureMusicApp) => set({ captureMusicApp }),
  setPipelineStatus: (pipelineStatus) => set({ pipelineStatus }),
  setStreamUrl: (streamUrl) => set({ streamUrl }),
}))
