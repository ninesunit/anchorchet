import { useEffect, useRef } from 'react'

const COLORS = ['#ff5266', '#2ee0c4', '#f5a623', '#a684ff', '#60a5fa', '#fafafa']

/**
 * Canvas confetti for the Hype Button payoff.
 *
 * Canvas rather than DOM nodes because ~140 absolutely-positioned divs
 * animating at once drops frames badly on an iPhone; one canvas does not.
 * Honours prefers-reduced-motion by rendering nothing at all.
 */
export function Confetti({ run, duration = 2600, onDone }) {
  const canvasRef = useRef(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (!run) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const id = setTimeout(() => doneRef.current?.(), 600)
      return () => clearTimeout(id)
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const pieces = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 2.4,
      vy: 2.5 + Math.random() * 3.5,
      size: 5 + Math.random() * 7,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    }))

    const start = performance.now()
    let frame

    const tick = (now) => {
      const elapsed = now - start
      // Fade the whole layer out over the last 600ms instead of cutting.
      const fade = Math.max(0, Math.min(1, (duration - elapsed) / 600))

      ctx.clearRect(0, 0, w, h)
      ctx.globalAlpha = fade

      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.045 // gravity
        p.vx *= 0.995
        p.rot += p.vr

        // Wrap horizontally so nothing drifts into a permanent edge gap
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (elapsed < duration) {
        frame = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
        doneRef.current?.()
      }
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [run, duration])

  if (!run) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] size-full"
    />
  )
}
