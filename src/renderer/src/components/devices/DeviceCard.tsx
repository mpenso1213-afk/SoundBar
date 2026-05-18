import { useState, useCallback } from 'react'
import { Slider } from '../shared/Slider'
import { StatusBadge } from '../shared/StatusBadge'
import type { SonosDevice, PipelineStatus } from '../../../../shared/types'

interface Props {
  device: SonosDevice
  selected: boolean
  onSelect: () => void
  streamUrl: string | null
}

export function DeviceCard({ device, selected, onSelect, streamUrl }: Props) {
  const [volume, setVolume] = useState(device.volume)
  const [testing, setTesting] = useState(false)
  const [starting, setStarting] = useState(false)

  const handleVolume = useCallback((v: number) => {
    setVolume(v)
    window.soundbar.sonos.setVolume(device.uuid, v)
  }, [device.uuid])

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (starting) return
    let url = streamUrl
    if (!url) {
      setStarting(true)
      const status = await window.soundbar.audio.startPipeline({
        micDeviceIndex: 0,
        micGain: 0,
        musicGain: 1,
        pitchSemitones: 0,
        captureMusicApp: true,
      }) as PipelineStatus
      url = status.streamUrl
      setStarting(false)
    }
    if (url) await window.soundbar.sonos.streamToDevice(device.uuid, url)
  }

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.soundbar.sonos.pause(device.uuid)
  }

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (testing) return
    setTesting(true)
    await window.soundbar.sonos.testBeep(device.uuid)
    setTimeout(() => setTesting(false), 7000)
  }

  const handleStreamToSpeaker = () => {
    if (!streamUrl) return
    window.soundbar.sonos.streamToDevice(device.uuid, streamUrl)
  }

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{device.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            {device.isCoordinator ? 'Coordinator' : 'Member'} · {device.host}
          </div>
        </div>
        <StatusBadge active={device.isPlaying} label={device.isPlaying ? 'Playing' : 'Idle'} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Vol</span>
        <div style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
          <Slider value={volume} min={0} max={100} step={1} onChange={handleVolume} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 24, textAlign: 'right' }}>{volume}</span>
      </div>

      <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={handlePlay}
          disabled={starting}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 13,
            background: starting ? 'var(--bg-elevated)' : '#16a34a',
            color: starting ? 'var(--text-secondary)' : '#fff',
            opacity: starting ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >{starting ? '⏳ Starting…' : '▶ Play'}</button>
        <button
          onClick={handlePause}
          style={{ flex: 1, padding: '6px 0', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 13 }}
        >⏸ Pause</button>
        <button
          onClick={handleTest}
          disabled={testing}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 12,
            background: testing ? 'var(--bg-elevated)' : '#2563eb',
            color: testing ? 'var(--text-secondary)' : '#fff',
            opacity: testing ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >{testing ? '🔔 …' : '🔔 Test'}</button>
        {streamUrl && (
          <button
            onClick={handleStreamToSpeaker}
            style={{ flex: 1, padding: '6px 0', background: 'var(--accent)', borderRadius: 6, fontSize: 12, color: '#fff' }}
          >📡 Stream</button>
        )}
      </div>
    </div>
  )
}
