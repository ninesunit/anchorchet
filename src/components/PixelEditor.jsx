import { useCallback, useRef, useState } from 'react'

import {
  BALL_PALETTE,
  CELLS,
  GRID,
  PRESETS,
  emptyGrid,
  makePreset,
} from '../data/arsenal'
import { buzz, cx } from '../lib/utils'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

const TOOLS = [
  { id: 'paint', label: 'Paint', icon: 'edit' },
  { id: 'fill', label: 'Fill', icon: 'target' },
  { id: 'erase', label: 'Erase', icon: 'trash' },
]

/** Flood fill from `start`, replacing the contiguous run of its current colour. */
function floodFill(grid, start, next) {
  const from = grid[start]
  if (from === next) return grid
  const out = [...grid]
  const stack = [start]
  while (stack.length) {
    const i = stack.pop()
    if (out[i] !== from) continue
    out[i] = next
    const x = i % GRID
    const y = Math.floor(i / GRID)
    if (x > 0) stack.push(i - 1)
    if (x < GRID - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - GRID)
    if (y < GRID - 1) stack.push(i + GRID)
  }
  return out
}

/**
 * 16x16 pixel editor.
 *
 * Painting is handled by one pointer listener on the grid rather than 256
 * per-cell handlers — that is what makes drag-to-paint work, and it keeps the
 * DOM light enough to stay smooth on a phone. `touch-action: none` stops the
 * page scrolling out from under a drag.
 */
export function PixelEditor({ value, onChange }) {
  const grid = value?.length === CELLS ? value : emptyGrid()

  const [tool, setTool] = useState('paint')
  const [color, setColor] = useState(BALL_PALETTE[27])
  const [mirror, setMirror] = useState(true)
  const [history, setHistory] = useState([])

  const boardRef = useRef(null)
  const painting = useRef(false)
  const strokeStart = useRef(null)

  const cellFromEvent = useCallback((e) => {
    const el = boardRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * GRID)
    const y = Math.floor(((e.clientY - r.top) / r.height) * GRID)
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return null
    return y * GRID + x
  }, [])

  const applyAt = useCallback(
    (index, base) => {
      const next = [...base]
      const paint = tool === 'erase' ? '' : color
      const x = index % GRID
      const y = Math.floor(index / GRID)
      next[index] = paint
      // Mirroring across the vertical axis is what makes hand-drawn swirls
      // look like a manufactured ball instead of a smudge.
      if (mirror) next[y * GRID + (GRID - 1 - x)] = paint
      return next
    },
    [tool, color, mirror]
  )

  function commit(next) {
    onChange(next)
  }

  function onPointerDown(e) {
    const i = cellFromEvent(e)
    if (i === null) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setHistory((h) => [...h.slice(-19), grid])
    buzz(6)

    if (tool === 'fill') {
      commit(floodFill(grid, i, color))
      return
    }
    painting.current = true
    strokeStart.current = grid
    commit(applyAt(i, grid))
  }

  function onPointerMove(e) {
    if (!painting.current || tool === 'fill') return
    const i = cellFromEvent(e)
    if (i === null) return
    commit(applyAt(i, grid))
  }

  function endStroke() {
    painting.current = false
    strokeStart.current = null
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h
      commit(h[h.length - 1])
      return h.slice(0, -1)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ------------------------------------------------------- canvas -- */}
      <div
        ref={boardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
        role="application"
        aria-label="Pixel ball canvas"
        className="relative mx-auto w-full max-w-[340px] touch-none select-none overflow-hidden rounded-2xl border border-border bg-surface-2"
        style={{ aspectRatio: '1 / 1' }}
      >
        <svg viewBox={`0 0 ${GRID} ${GRID}`} className="size-full" style={{ shapeRendering: 'crispEdges' }}>
          {/* checkerboard so empty cells read as transparent, not white */}
          {Array.from({ length: CELLS }, (_, i) => {
            const x = i % GRID
            const y = Math.floor(i / GRID)
            return (
              <rect
                key={`bg${i}`}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={(x + y) % 2 ? 'rgb(0 0 0 / 0.05)' : 'transparent'}
              />
            )
          })}
          {grid.map((hex, i) =>
            hex ? (
              <rect
                key={i}
                x={i % GRID}
                y={Math.floor(i / GRID)}
                width="1"
                height="1"
                fill={hex}
              />
            ) : null
          )}
          {/* ball outline guide — shows what will actually be visible */}
          <circle
            cx={GRID / 2}
            cy={GRID / 2}
            r={GRID / 2 - 0.2}
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="0.12"
            strokeDasharray="0.5 0.5"
          />
        </svg>
      </div>

      <p className="text-center text-[12px] text-faint">
        Anything outside the dotted circle will not show on the ball.
      </p>

      {/* -------------------------------------------------------- tools -- */}
      <div className="flex flex-wrap items-center gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            aria-pressed={tool === t.id}
            className={cx(
              'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-bold transition',
              tool === t.id
                ? 'border-ember bg-ember-soft/50 text-ember'
                : 'border-border bg-surface text-muted hover:text-text'
            )}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setMirror(!mirror)}
          aria-pressed={mirror}
          className={cx(
            'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-bold transition',
            mirror
              ? 'border-mint bg-mint-soft/50 text-mint'
              : 'border-border bg-surface text-muted hover:text-text'
          )}
        >
          <Icon name="sparkle" size={15} />
          Mirror
        </button>

        <Button variant="ghost" size="sm" onClick={undo} disabled={!history.length}>
          Undo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setHistory((h) => [...h, grid]); commit(emptyGrid()) }}>
          Clear
        </Button>
      </div>

      {/* ------------------------------------------------------ palette -- */}
      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-muted">Colour</p>
        <div className="grid grid-cols-10 gap-1.5">
          {BALL_PALETTE.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setColor(hex)
                if (tool === 'erase') setTool('paint')
              }}
              aria-label={hex}
              aria-pressed={color === hex}
              className={cx(
                'aspect-square rounded-md ring-1 ring-black/10 transition dark:ring-white/15',
                color === hex && 'ring-2 ring-ember ring-offset-2 ring-offset-bg-elevated'
              )}
              style={{ background: hex }}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ presets -- */}
      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-muted">Start from a preset</p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setHistory((h) => [...h, grid])
                commit(makePreset(preset.id, preset.colors))
                buzz(10)
              }}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-[13px] font-semibold text-muted transition hover:text-text"
            >
              <span className="flex gap-0.5">
                {preset.colors.map((c) => (
                  <span
                    key={c}
                    className="size-3 rounded-full ring-1 ring-black/10"
                    style={{ background: c }}
                  />
                ))}
              </span>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
