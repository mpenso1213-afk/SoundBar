import { useState } from 'react'
import { useSonosDevices } from './hooks/useSonosDevices'
import { useAppleMusic } from './hooks/useAppleMusic'
import { DeviceList } from './components/devices/DeviceList'
import { NowPlaying } from './components/music/NowPlaying'
import { MusicSearch } from './components/music/MusicSearch'
import { KaraokePanel } from './components/karaoke/KaraokePanel'

type Tab = 'speakers' | 'music' | 'karaoke'

export default function App() {
  useSonosDevices()
  useAppleMusic()

  const [tab, setTab] = useState<Tab>('speakers')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Title bar drag region */}
      <div
        style={{
          height: 52,
          WebkitAppRegion: 'drag' as React.CSSProperties['WebkitAppRegion'],
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 80,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>SoundBar</span>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '0 16px 12px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        WebkitAppRegion: 'no-drag' as React.CSSProperties['WebkitAppRegion'],
      }}>
        {(['speakers', 'music', 'karaoke'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {t === 'speakers' ? '🔊 Speakers' : t === 'music' ? '🎵 Music' : '🎤 Karaoke'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 16 }}>
        {tab === 'speakers' && <DeviceList />}
        {tab === 'music' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
            <NowPlaying />
            <MusicSearch />
          </div>
        )}
        {tab === 'karaoke' && <KaraokePanel />}
      </div>
    </div>
  )
}
