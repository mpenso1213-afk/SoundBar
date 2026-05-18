import { useMusicStore } from '../../store/musicSlice'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function NowPlaying() {
  const nowPlaying = useMusicStore((s) => s.nowPlaying)

  const handlePlay = () => window.soundbar.music.play()
  const handlePause = () => window.soundbar.music.pause()
  const handleNext = () => window.soundbar.music.next()
  const handlePrev = () => window.soundbar.music.previous()

  if (!nowPlaying?.track) {
    return (
      <div style={{ padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        No track playing in Music.app
      </div>
    )
  }

  const { track, isPlaying, position } = nowPlaying
  const progress = track.duration > 0 ? (position / track.duration) * 100 : 0

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artist} — {track.album}
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', transition: 'width 1s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
          <span>{formatTime(position)}</span>
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
        <button onClick={handlePrev} style={{ fontSize: 20 }}>⏮</button>
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={handleNext} style={{ fontSize: 20 }}>⏭</button>
      </div>
    </div>
  )
}
