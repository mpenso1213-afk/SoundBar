import { create } from 'zustand'
import type { NowPlayingState, AppleMusicTrack } from '../../../shared/types'

interface MusicState {
  nowPlaying: NowPlayingState | null
  searchResults: AppleMusicTrack[]
  searchQuery: string
  isSearching: boolean
  setNowPlaying: (state: NowPlayingState | null) => void
  setSearchResults: (results: AppleMusicTrack[]) => void
  setSearchQuery: (q: string) => void
  setSearching: (v: boolean) => void
}

export const useMusicStore = create<MusicState>((set) => ({
  nowPlaying: null,
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  setNowPlaying: (nowPlaying) => set({ nowPlaying }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearching: (isSearching) => set({ isSearching }),
}))
