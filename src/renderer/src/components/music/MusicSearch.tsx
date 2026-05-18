import { useState } from 'react'
import { useMusicStore } from '../../store/musicSlice'
import type { AppleMusicTrack } from '../../../../shared/types'

export function MusicSearch() {
  const [query, setQuery] = useState('')
  const results = useMusicStore((s) => s.searchResults)
  const isSearching = useMusicStore((s) => s.isSearching)
  const setSearchResults = useMusicStore((s) => s.setSearchResults)
  const setSearching = useMusicStore((s) => s.setSearching)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    const tracks = (await window.soundbar.music.search(query)) as AppleMusicTrack[]
    setSearchResults(tracks)
    setSearching(false)
  }

  const handlePlay = (track: AppleMusicTrack) => {
    window.soundbar.music.playTrack(track.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Apple Music library…"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 13, color: 'var(--text-primary)',
          }}
        />
        <button
          type="submit"
          style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 13 }}
        >
          {isSearching ? '…' : 'Search'}
        </button>
      </form>

      <div style={{ overflowY: 'auto', maxHeight: 320, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {results.map((track) => (
          <div
            key={track.id}
            onClick={() => handlePlay(track)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {track.artist} — {track.album}
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
