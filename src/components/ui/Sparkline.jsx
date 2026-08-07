import { cx } from '../../lib/utils'

/**
 * Compact trend line for bowling averages.
 *
 * The y-axis is padded to the data range rather than anchored at zero: the
 * interesting variance in a bowling average lives between 140 and 220, and a
 * zero baseline flattens it into a straight line.
 */
export function Sparkline({ values, className, height = 48, stroke = 'var(--mint)' }) {
  const points = values.filter((v) => Number.isFinite(v))
  if (points.length < 2) {
    return (
      <div
        className={cx('flex items-center justify-center text-[12px] text-faint', className)}
        style={{ height }}
      >
        Not enough sessions yet
      </div>
    )
  }

  const w = 100
  const h = height
  const pad = 4

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w
    const y = pad + (1 - (v - min) / range) * (h - pad * 2)
    return [x, y]
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const [lastX, lastY] = coords[coords.length - 1]
  const gradientId = `spark-${stroke.replace(/[^a-z]/gi, '')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cx('w-full overflow-visible', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={stroke} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
