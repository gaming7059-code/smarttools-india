import React, { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isPlaying: boolean
  color?: string
  height?: number
  barCount?: number
  className?: string
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  color = '#2563eb',
  height = 56,
  barCount = 48,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameIdRef = useRef<number | null>(null)
  const phaseRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isMounted = true

    const render = () => {
      if (!isMounted) return

      const dpr = window.devicePixelRatio || 1
      const displayWidth = canvas.clientWidth || 300
      const displayHeight = height

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr
        canvas.height = displayHeight * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, displayWidth, displayHeight)

      if (isPlaying) {
        phaseRef.current += 0.08
      } else {
        phaseRef.current += 0.015
      }

      const totalBars = Math.max(16, Math.min(barCount, Math.floor(displayWidth / 7)))
      const barWidth = 3
      const barSpacing = (displayWidth - totalBars * barWidth) / (totalBars - 1)
      const centerY = displayHeight / 2

      // Create vertical gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, displayHeight)
      gradient.addColorStop(0, color)
      gradient.addColorStop(0.5, '#3b82f6')
      gradient.addColorStop(1, '#6366f1')

      ctx.fillStyle = gradient

      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + barSpacing)
        let normalizedHeight: number

        if (isPlaying) {
          // Dynamic harmonic motion
          const wave1 = Math.sin(phaseRef.current + i * 0.28)
          const wave2 = Math.cos(phaseRef.current * 0.7 + i * 0.15)
          const wave3 = Math.sin(phaseRef.current * 1.3 + i * 0.42)
          const combined = (wave1 + wave2 + wave3) / 3
          // Bell curve multiplier so edges are shorter than center
          const envelope = Math.sin((Math.PI * i) / (totalBars - 1))
          normalizedHeight = Math.max(0.12, Math.abs(combined) * 0.85 * (0.3 + 0.7 * envelope))
        } else {
          // Calm resting state
          const staticCurve = Math.sin((Math.PI * i) / (totalBars - 1))
          const microPulse = Math.sin(phaseRef.current + i * 0.1) * 0.08
          normalizedHeight = Math.max(0.08, staticCurve * 0.45 + microPulse)
        }

        const barH = Math.max(4, normalizedHeight * (displayHeight - 8))
        const y = centerY - barH / 2

        // Rounded pill bar
        ctx.beginPath()
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barH, 2)
        } else {
          ctx.rect(x, y, barWidth, barH)
        }
        ctx.fill()
      }

      ctx.restore()

      animFrameIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      isMounted = false
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [isPlaying, color, height, barCount])

  return (
    <div className={`w-full overflow-hidden rounded-xl bg-slate-100/80 dark:bg-slate-950/60 p-2.5 border border-slate-200/80 dark:border-slate-800 ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
        aria-hidden="true"
      />
    </div>
  )
}
