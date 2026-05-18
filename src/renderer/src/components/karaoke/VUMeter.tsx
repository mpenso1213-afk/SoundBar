import { useEffect, useRef } from 'react'

interface Props {
  analyser: AnalyserNode | null
  width?: number
  height?: number
}

export function VUMeter({ analyser, width = 40, height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyser) return
    const ctx = canvas.getContext('2d')!
    const data = new Uint8Array(analyser.frequencyBinCount)

    function draw() {
      analyser!.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      const level = avg / 255

      ctx.clearRect(0, 0, width, height)
      const barH = level * height
      const gradient = ctx.createLinearGradient(0, height, 0, 0)
      gradient.addColorStop(0, '#4ade80')
      gradient.addColorStop(0.7, '#facc15')
      gradient.addColorStop(1, '#f87171')
      ctx.fillStyle = gradient
      ctx.roundRect(0, height - barH, width, barH, 4)
      ctx.fill()
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ borderRadius: 4, background: 'var(--bg-elevated)' }}
    />
  )
}
