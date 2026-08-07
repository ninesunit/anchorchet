import { useEffect, useRef } from 'react'

import { GRID } from '../data/arsenal'
import { PIN_POS } from '../data/bowlingGame'

/**
 * Pixel-art bowling lane on a canvas.
 *
 * Canvas rather than SVG here because the ball is animated every frame and the
 * whole thing is drawn at a low internal resolution then blown up with
 * imageSmoothingEnabled = false — that upscale is what produces crisp pixels
 * instead of a blurry vector look, and it is not something SVG can fake.
 */

// Internal pixel resolution. Everything is authored against this grid and
// scaled up, so the art stays consistent on any screen size.
const W = 96
const H = 128

const PAL = {
  dark: '#17141b',
  gutter: '#221c2a',
  gutterLip: '#2e2637',
  lane: '#c8a678',
  laneAlt: '#bd9a68',
  laneEdge: '#a98757',
  deck: '#8f7048',
  foul: '#e8384f',
  pin: '#fdfbf7',
  pinShade: '#d9d2c4',
  pinStripe: '#e8384f',
  shadow: 'rgba(0,0,0,0.28)',
  arrow: '#a2794b',
}

/** Lane occupies the middle; gutters either side. */
const LANE_X0 = 22
const LANE_X1 = 74
const DECK_Y = 16
const FOUL_Y = 112
// The ball rests above the foul line rather than on it: at the very bottom of
// the canvas it ends up tucked behind the phone's tab bar and half invisible.
const BALL_HOME_Y = FOUL_Y - 8
const BALL_END_Y = DECK_Y + 12

const laneX = (x) => LANE_X0 + ((x + 1) / 2) * (LANE_X1 - LANE_X0)
const pinY = (d) => DECK_Y + 14 - d * 7

function drawPin(ctx, x, y, falling) {
  if (falling) return
  ctx.fillStyle = PAL.shadow
  ctx.fillRect(x - 1, y + 4, 4, 1)
  ctx.fillStyle = PAL.pin
  ctx.fillRect(x - 1, y - 4, 3, 8)
  ctx.fillRect(x, y - 5, 1, 1)
  ctx.fillStyle = PAL.pinShade
  ctx.fillRect(x + 1, y - 4, 1, 8)
  ctx.fillStyle = PAL.pinStripe
  ctx.fillRect(x - 1, y - 2, 3, 1)
}

/**
 * @param {object} props
 * @param {number[]} props.standing      pin numbers still up
 * @param {string[]} props.ballGrid      16x16 pixel art for the ball skin
 * @param {{aim:number,spin:number}|null} props.aiming  live swipe preview
 * @param {{entry:number,pins:boolean[]}|null} props.throwing  resolved throw to animate
 * @param {() => void} props.onThrowEnd
 */
export function PixelLane({ standing, ballGrid, aiming, throwing, onThrowEnd, dragging }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ t: 0, raf: 0, done: false })

  // Latest props without restarting the animation loop on every render.
  const props = useRef({})
  props.current = { standing, ballGrid, aiming, throwing, onThrowEnd, dragging }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const cssW = canvas.clientWidth
      const cssH = canvas.clientHeight
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      ctx.imageSmoothingEnabled = false
    }
    resize()
    window.addEventListener('resize', resize)

    // Offscreen buffer at the tiny internal resolution; the visible canvas is
    // just this scaled up with smoothing off.
    const buf = document.createElement('canvas')
    buf.width = W
    buf.height = H
    const b = buf.getContext('2d')
    b.imageSmoothingEnabled = false

    const draw = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      const p = props.current
      const st = stateRef.current

      if (p.throwing) {
        st.t = Math.min(1, st.t + dt / 1100)
        if (st.t >= 1 && !st.done) {
          st.done = true
          p.onThrowEnd?.()
        }
      } else {
        st.t = 0
        st.done = false
      }

      /* ---------------------------------------------------- background -- */
      b.fillStyle = PAL.dark
      b.fillRect(0, 0, W, H)

      b.fillStyle = PAL.gutter
      b.fillRect(LANE_X0 - 7, DECK_Y - 4, 7, H - DECK_Y + 4)
      b.fillRect(LANE_X1, DECK_Y - 4, 7, H - DECK_Y + 4)
      b.fillStyle = PAL.gutterLip
      b.fillRect(LANE_X0 - 7, DECK_Y - 4, 1, H - DECK_Y + 4)
      b.fillRect(LANE_X1 + 6, DECK_Y - 4, 1, H - DECK_Y + 4)

      /* ---------------------------------------------------------- lane -- */
      b.fillStyle = PAL.lane
      b.fillRect(LANE_X0, DECK_Y, LANE_X1 - LANE_X0, H - DECK_Y)
      // board stripes
      b.fillStyle = PAL.laneAlt
      for (let x = LANE_X0; x < LANE_X1; x += 6) b.fillRect(x, DECK_Y, 2, H - DECK_Y)
      b.fillStyle = PAL.laneEdge
      b.fillRect(LANE_X0, DECK_Y, 1, H - DECK_Y)
      b.fillRect(LANE_X1 - 1, DECK_Y, 1, H - DECK_Y)

      // pin deck is a darker slab
      b.fillStyle = PAL.deck
      b.fillRect(LANE_X0, DECK_Y - 4, LANE_X1 - LANE_X0, 18)

      // aiming arrows, like the real inlays
      b.fillStyle = PAL.arrow
      for (let i = -2; i <= 2; i++) {
        const ax = Math.round(laneX(i * 0.32))
        b.fillRect(ax, 74 + Math.abs(i) * 3, 1, 3)
      }

      // foul line
      b.fillStyle = PAL.foul
      b.fillRect(LANE_X0, FOUL_Y, LANE_X1 - LANE_X0, 1)

      /* ---------------------------------------------------------- pins -- */
      PIN_POS.forEach((pin, i) => {
        const up = p.standing?.includes(pin.n)
        if (!up) return
        const knockedNow = p.throwing && st.t > 0.9 && !p.throwing.pins[i]
        drawPin(b, Math.round(laneX(pin.x * 0.62)), Math.round(pinY(pin.d)), knockedNow)
      })

      /* ------------------------------------------------ aim projection -- */
      if (p.aiming && !p.throwing) {
        const { aim, spin } = p.aiming
        b.fillStyle = 'rgba(255,255,255,0.35)'
        for (let s = 0; s <= 1; s += 0.06) {
          // Same curve shape the physics uses, so the guide does not lie.
          const cx = aim + spin * (0.45 + 0.6 * 0.35) * Math.pow(s, 2.2)
          const gx = Math.round(laneX(cx))
          const gy = Math.round(BALL_HOME_Y - s * (BALL_HOME_Y - BALL_END_Y))
          b.fillRect(gx, gy, 1, 1)
        }
      }

      /* ---------------------------------------------------------- ball -- */
      const t = st.t
      const entry = p.throwing?.entry ?? p.aiming?.aim ?? 0
      const startX = p.aiming?.aim ?? 0
      const bx = p.throwing
        ? laneX(startX + (entry - startX) * Math.pow(t, 2.2))
        : laneX(startX)
      const by = p.throwing ? BALL_HOME_Y - t * (BALL_HOME_Y - BALL_END_Y) : BALL_HOME_Y

      const size = p.throwing ? 9 - t * 3.5 : 9
      drawBall(b, p.ballGrid, bx, by, size)

      /* --------------------------------------------------------- blit -- */
      const scale = Math.min(canvas.width / W, canvas.height / H)
      const dw = W * scale
      const dh = H * scale
      ctx.fillStyle = PAL.dark
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buf, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)

      stateRef.current.raf = requestAnimationFrame(draw)
    }

    stateRef.current.raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(stateRef.current.raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="block size-full touch-none select-none"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}

/** Sample the 16x16 skin down onto a small circle of lane pixels. */
function drawBall(ctx, grid, cx, cy, size) {
  const r = size / 2
  const x0 = Math.round(cx - r)
  const y0 = Math.round(cy - r)
  const n = Math.max(3, Math.round(size))

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillRect(x0 + 1, y0 + n - 1, n - 2, 1)

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = (x + 0.5) / n - 0.5
      const dy = (y + 0.5) / n - 0.5
      if (dx * dx + dy * dy > 0.25) continue
      let hex = '#6b6a78'
      if (grid?.length) {
        const gx = Math.min(GRID - 1, Math.floor(((x + 0.5) / n) * GRID))
        const gy = Math.min(GRID - 1, Math.floor(((y + 0.5) / n) * GRID))
        hex = grid[gy * GRID + gx] || hex
      }
      ctx.fillStyle = hex
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}
