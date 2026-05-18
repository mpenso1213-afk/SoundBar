import { useState } from 'react'
import type { SonosDevice } from '../../../../shared/types'

interface Props {
  devices: SonosDevice[]
}

export function GroupManager({ devices }: Props) {
  const [coordinator, setCoordinator] = useState<string>('')
  const [members, setMembers] = useState<Set<string>>(new Set())

  const toggleMember = (uuid: string) => {
    if (uuid === coordinator) return
    setMembers((prev) => {
      const next = new Set(prev)
      next.has(uuid) ? next.delete(uuid) : next.add(uuid)
      return next
    })
  }

  const createGroup = async () => {
    if (!coordinator || members.size === 0) return
    await window.soundbar.sonos.createGroup(coordinator, [...members])
    setMembers(new Set())
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Create Group</div>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Coordinator:</div>
      <select
        value={coordinator}
        onChange={(e) => setCoordinator(e.target.value)}
        style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 10 }}
      >
        <option value="">Select coordinator…</option>
        {devices.map((d) => (
          <option key={d.uuid} value={d.uuid}>{d.name}</option>
        ))}
      </select>

      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Add members:</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {devices.filter((d) => d.uuid !== coordinator).map((d) => (
          <label key={d.uuid} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={members.has(d.uuid)}
              onChange={() => toggleMember(d.uuid)}
              style={{ accentColor: 'var(--accent)' }}
            />
            {d.name}
          </label>
        ))}
      </div>

      <button
        onClick={createGroup}
        disabled={!coordinator || members.size === 0}
        style={{
          width: '100%', padding: '7px 0', borderRadius: 8, fontSize: 13,
          background: coordinator && members.size > 0 ? 'var(--accent)' : 'var(--bg-elevated)',
          color: '#fff', opacity: coordinator && members.size > 0 ? 1 : 0.5,
        }}
      >
        Create Group
      </button>
    </div>
  )
}
