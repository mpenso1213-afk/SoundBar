interface Props {
  active: boolean
  label?: string
}

export function StatusBadge({ active, label }: Props) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 11,
      color: active ? '#4ade80' : 'var(--text-secondary)',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: active ? '#4ade80' : 'var(--text-secondary)',
        boxShadow: active ? '0 0 6px #4ade80' : 'none',
      }} />
      {label ?? (active ? 'Active' : 'Inactive')}
    </span>
  )
}
