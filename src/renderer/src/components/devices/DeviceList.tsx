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
  const [showAddIp, setShowAddIp] = useState(false)
  const [ipInput, setIpInput] = useState('')
  const [ipStatus, setIpStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [adding, setAdding] = useState(false)

  const handleRefresh = () => window.soundbar.sonos.discover()

  const handleAddByIp = async (e: React.FormEvent) => {
    e.preventDefault()
    const ip = ipInput.trim()
    if (!ip) return
    setAdding(true)
    setIpStatus(null)
    const result = await window.soundbar.sonos.addByIp(ip) as { success: boolean; error?: string }
    setAdding(false)
    if (result.success) {
      setIpStatus({ type: 'success', msg: 'Speaker added.' })
      setIpInput('')
    } else {
      setIpStatus({ type: 'error', msg: result.error ?? 'Could not connect.' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Speakers</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setShowAddIp(!showAddIp); setIpStatus(null) }}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12,
              background: showAddIp ? 'var(--accent)' : 'var(--bg-elevated)', color: '#fff'
            }}
          >+ IP</button>
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

      {showAddIp && (
        <form
          onSubmit={handleAddByIp}
          style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 12 }}
        >
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Add speaker by IP address</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="192.168.1.xx"
              pattern="^(\d{1,3}\.){3}\d{1,3}$"
              title="Enter a valid IPv4 address"
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 7,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={adding || !ipInput.trim()}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 13,
                background: 'var(--accent)', color: '#fff',
                opacity: adding || !ipInput.trim() ? 0.5 : 1,
              }}
            >{adding ? '…' : 'Connect'}</button>
          </div>
          {ipStatus && (
            <div style={{ fontSize: 12, color: ipStatus.type === 'success' ? '#4ade80' : '#f87171' }}>
              {ipStatus.msg}
            </div>
          )}
        </form>
      )}

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
