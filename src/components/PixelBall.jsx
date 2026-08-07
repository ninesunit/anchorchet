import { GRID } from '../data/arsenal'
import { cx } from '../lib/utils'

/**
 * Renders a 16x16 pixel grid as a bowling ball.
 *
 * SVG rather than canvas: these appear in lists at many sizes, and SVG scales
 * without a per-size redraw or devicePixelRatio juggling. `shapeRendering:
 * crispEdges` keeps the pixels hard-edged instead of antialiasing into mush.
 */
export function PixelBall({ grid, size = 48, className, holes = true, ring = true }) {
  const cells = grid?.length ? grid : []

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      width={size}
      height={size}
      className={cx('shrink-0', className)}
      style={{ shapeRendering: 'crispEdges' }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="ball-clip">
          <circle cx={GRID / 2} cy={GRID / 2} r={GRID / 2 - 0.2} />
        </clipPath>
      </defs>

      <circle cx={GRID / 2} cy={GRID / 2} r={GRID / 2 - 0.2} fill="var(--surface-2)" />

      <g clipPath="url(#ball-clip)">
        {cells.map((hex, i) =>
          hex ? (
            <rect key={i} x={i % GRID} y={Math.floor(i / GRID)} width="1" height="1" fill={hex} />
          ) : null
        )}
      </g>

      {holes && (
        <g clipPath="url(#ball-clip)" opacity="0.55">
          <circle cx="6.6" cy="6.2" r="0.85" fill="#0b0a0e" />
          <circle cx="9.4" cy="6.2" r="0.85" fill="#0b0a0e" />
          <circle cx="8" cy="9.4" r="1" fill="#0b0a0e" />
        </g>
      )}

      {ring && (
        <circle
          cx={GRID / 2}
          cy={GRID / 2}
          r={GRID / 2 - 0.3}
          fill="none"
          stroke="rgb(0 0 0 / 0.18)"
          strokeWidth="0.4"
        />
      )}
    </svg>
  )
}
