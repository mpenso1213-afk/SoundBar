import { runAppleScript } from 'run-applescript'
import type { AppleMusicTrack, NowPlayingState } from '../../shared/types'

async function jxa(script: string): Promise<string> {
  return runAppleScript(`
    const Music = Application('Music')
    Music.includeStandardAdditions = true
    ${script}
  `)
}

export const appleMusicController = {
  async play(): Promise<void> {
    await runAppleScript('tell application "Music" to play')
  },

  async pause(): Promise<void> {
    await runAppleScript('tell application "Music" to pause')
  },

  async nextTrack(): Promise<void> {
    await runAppleScript('tell application "Music" to next track')
  },

  async previousTrack(): Promise<void> {
    await runAppleScript('tell application "Music" to previous track')
  },

  async playTrack(trackId: string): Promise<void> {
    await runAppleScript(`
      tell application "Music"
        set matchedTracks to (every track of library playlist 1 whose persistent ID is "${trackId}")
        if (count of matchedTracks) > 0 then
          play (item 1 of matchedTracks)
        end if
      end tell
    `)
  },

  async search(query: string): Promise<AppleMusicTrack[]> {
    try {
      const result = await runAppleScript(`
        tell application "Music"
          set searchResults to search library playlist 1 for "${query.replace(/"/g, '\\"')}"
          set output to {}
          repeat with t in searchResults
            set end of output to (persistent ID of t) & "|" & (name of t) & "|" & (artist of t) & "|" & (album of t) & "|" & (duration of t)
          end repeat
          return output as string
        end tell
      `)
      if (!result || result.trim() === '') return []
      return result
        .split(', ')
        .filter(Boolean)
        .slice(0, 30)
        .map((line) => {
          const [id, name, artist, album, duration] = line.split('|')
          return {
            id: id ?? '',
            name: name ?? '',
            artist: artist ?? '',
            album: album ?? '',
            duration: parseFloat(duration ?? '0'),
          }
        })
    } catch {
      return []
    }
  },

  async getNowPlaying(): Promise<NowPlayingState | null> {
    try {
      const result = await runAppleScript(`
        tell application "Music"
          if player state is stopped then return "stopped"
          set t to current track
          set isPlaying to (player state is playing)
          return (persistent ID of t) & "|" & (name of t) & "|" & (artist of t) & "|" & (album of t) & "|" & (duration of t) & "|" & (player position) & "|" & isPlaying & "|" & (shuffle enabled) & "|" & (song repeat)
        end tell
      `)
      if (!result || result === 'stopped') return null
      const [id, name, artist, album, duration, position, isPlaying, shuffle, repeat] =
        result.split('|')

      const repeatMode =
        repeat === 'all' ? 'all' : repeat === 'one' ? 'one' : ('off' as const)

      return {
        track: {
          id: id ?? '',
          name: name ?? '',
          artist: artist ?? '',
          album: album ?? '',
          duration: parseFloat(duration ?? '0'),
        },
        isPlaying: isPlaying === 'true',
        position: parseFloat(position ?? '0'),
        shuffleEnabled: shuffle === 'true',
        repeatMode,
      }
    } catch {
      return null
    }
  },
}
