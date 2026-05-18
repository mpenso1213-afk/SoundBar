interface Props {
  value: number
  min: number
  max: number
  step?: number
  label?: string
  onChange: (value: number) => void
  vertical?: boolean
}

export function Slider({ value, min, max, step = 0.01, label, onChange, vertical }: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: vertical ? 'column-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    }}>
      {label && <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 32 }}>{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          writingMode: vertical ? 'vertical-lr' : undefined,
          direction: vertical ? 'rtl' : undefined,
          accentColor: 'var(--accent)',
          flex: 1,
        }}
      />
    </div>
  )
}
