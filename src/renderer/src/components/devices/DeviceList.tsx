import { useDevicesStore } from '../../store/devicesSlice'
import { useAudioStore } from '../../store/audioSlice'
import { DeviceCard } from './DeviceCard'
import { GroupManager } from '../groups/GroupManager'
import { useState } from 'react'

export function DeviceList() {
  const devices = useDevicesStore((s) => s.devices)
  const selectedUuids = useDevicesStore((s) => s.selectedUuids)
  const toggleSelect = useDevicesStore((s) => s.toggleSelect)
  const streamUrl = useAudioStore((s) => s.streamUrl)
  const [showGroups, setShowGroups] = useState(false)

  const handleRefresh = () => window.soundbar.sonos.discover()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Speakers</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowGroups(!showGroups)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: showGroups ? 'var(--accent)' : 'var(--bg-elevated)', color: '#fff'
            }}
          >Groups</button>
          <button
            onClick={handleRefresh}
            style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >↺ Scan</button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
          Scanning for Sonos speakers…
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {devices.map((d) => (
            <DeviceCard
              key={d.uuid}
              device={d}
              selected={selectedUuids.has(d.uuid)}
              onSelect={() => toggleSelect(d.uuid)}
              streamUrl={streamUrl}
            />
          ))}
        </div>
      )}

      {showGroups && devices.length > 0 && (
        <GroupManager devices={devices} />
      )}
    </div>
  )
}
