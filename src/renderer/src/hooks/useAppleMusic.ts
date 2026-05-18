import { useEffect } from 'react'
import { useMusicStore } from '../store/musicSlice'
import type { NowPlayingState } from '../../../shared/types'

export function useAppleMusic(): void {
  const setNowPlaying = useMusicStore((s) => s.setNowPlaying)

  useEffect(() => {
    const unsubscribe = window.soundbar.music.onNowPlaying((state) => {
      setNowPlaying(state as NowPlayingState | null)
    })
    return unsubscribe
  }, [setNowPlaying])
}
