/**
 * Bowling arsenal: roles, specs, lane conditions and the pixel-art ball grid.
 */

export const GRID = 16
export const CELLS = GRID * GRID

export const ROLES = {
  strike_ball: {
    id: 'strike_ball',
    label: 'Strike ball',
    short: 'Strike',
    blurb: 'Main hooking ball',
    color: 'var(--ember)',
  },
  spare_ball: {
    id: 'spare_ball',
    label: 'Spare ball',
    short: 'Spare',
    blurb: 'Straight-line corner pin killer',
    color: 'var(--mint)',
  },
  secondary: {
    id: 'secondary',
    label: 'Backup / heavy oil',
    short: 'Backup',
    blurb: 'Second look when the lane changes',
    color: 'var(--violet)',
  },
}

export const COVERSTOCKS = [
  'Reactive Resin',
  'Urethane',
  'Plastic / Polyester',
  'Particle',
  'Hybrid Reactive',
  'Solid Reactive',
  'Pearl Reactive',
]

export const WEIGHTS = [10, 11, 12, 13, 14, 15, 16]

/**
 * Lane conditions. `id` is stored on the session; the order runs dry -> heavy
 * so charts and groupings read left to right the way bowlers think about it.
 */
export const OIL_PATTERNS = {
  dry: { id: 'dry', label: 'Short / Dry', blurb: 'Early hook, burns up fast' },
  house: { id: 'house', label: 'House Shot', blurb: 'Typical league condition' },
  medium: { id: 'medium', label: 'Medium Sport', blurb: 'Tighter than house' },
  heavy: { id: 'heavy', label: 'Heavy Sport Oil', blurb: 'Long, demanding, skid' },
  unknown: { id: 'unknown', label: 'Not logged', blurb: '' },
}

export const OIL_ORDER = ['dry', 'house', 'medium', 'heavy']

/* ---------------------------------------------------------- pixel art -- */

/** Painting palette — bowling balls are mostly saturated jewel tones + sparkle. */
export const BALL_PALETTE = [
  '#1a181d', '#3b3a45', '#6b6a78', '#a9a7b5', '#e8e6ee', '#ffffff',
  '#7b1e2b', '#d62828', '#ff5266', '#ff8fa3',
  '#a3410a', '#e8833a', '#f5a623', '#ffd166',
  '#14532d', '#2f6b4f', '#3ec46b', '#a8e6a1',
  '#0f4c5c', '#17877f', '#2ee0c4', '#9fdfcd',
  '#16265c', '#2f6fd0', '#5b9df9', '#a8c8e8',
  '#3d1a63', '#6b3f9e', '#a684ff', '#d5c2ff',
  '#5b3a26', '#8a5a3b', '#c8a678', '#f0e4cf',
]

export const emptyGrid = () => Array(CELLS).fill('')

/** True where (x,y) sits inside the ball circle, so presets never paint corners. */
function inBall(x, y) {
  const c = (GRID - 1) / 2
  const dx = x - c
  const dy = y - c
  return Math.sqrt(dx * dx + dy * dy) <= GRID / 2 - 0.35
}

/**
 * Deterministic value noise — same grid every time for a given seed, so a
 * preset looks identical on both phones without storing a seed.
 */
function noise(x, y, seed) {
  const n = Math.sin((x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453)
  return n - Math.floor(n)
}

/**
 * Generate a preset grid.
 * @param {'solid'|'swirl'|'split'|'marble'|'rings'|'galaxy'|'flame'} kind
 * @param {string[]} colors  [base, accent, highlight]
 */
export function makePreset(kind, colors) {
  const [a, b, c] = colors
  const grid = emptyGrid()
  const mid = (GRID - 1) / 2

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!inBall(x, y)) continue
      const i = y * GRID + x
      const dx = (x - mid) / mid
      const dy = (y - mid) / mid
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)

      let fill = a
      switch (kind) {
        case 'swirl': {
          // Spiral: angle advances with radius, banded into two colours.
          const s = Math.sin(angle * 2 + r * 5)
          fill = s > 0.15 ? b : s < -0.35 ? c || a : a
          break
        }
        case 'split':
          fill = dx + dy > 0 ? b : a
          break
        case 'marble': {
          const n = noise(x, y, 3) * 0.6 + noise(x * 0.5, y * 0.5, 9) * 0.4
          fill = n > 0.62 ? c || b : n > 0.38 ? b : a
          break
        }
        case 'rings':
          fill = r > 0.72 ? b : r > 0.4 ? a : c || b
          break
        case 'galaxy':
          fill = noise(x, y, 17) > 0.88 ? c || '#ffffff' : noise(x, y, 5) > 0.6 ? b : a
          break
        case 'flame': {
          const f = dy * 1.2 + Math.sin(dx * 3) * 0.35
          fill = f < -0.35 ? c || b : f < 0.25 ? b : a
          break
        }
        default:
          fill = a
      }
      grid[i] = fill
    }
  }

  // Shared specular highlight so every preset reads as a glossy sphere.
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!inBall(x, y)) continue
      const dx = (x - mid) / mid
      const dy = (y - mid) / mid
      if (Math.sqrt((dx + 0.42) ** 2 + (dy + 0.45) ** 2) < 0.22) {
        grid[y * GRID + x] = '#ffffff'
      }
    }
  }
  return grid
}

export const PRESETS = [
  { id: 'swirl', label: 'Swirl', colors: ['#3d1a63', '#a684ff', '#d5c2ff'] },
  { id: 'marble', label: 'Marble', colors: ['#0f4c5c', '#2ee0c4', '#e8e6ee'] },
  { id: 'galaxy', label: 'Galaxy', colors: ['#1a181d', '#3d1a63', '#ffffff'] },
  { id: 'flame', label: 'Flame', colors: ['#7b1e2b', '#ff5266', '#f5a623'] },
  { id: 'split', label: 'Split', colors: ['#16265c', '#ff8fa3'] },
  { id: 'rings', label: 'Rings', colors: ['#14532d', '#3ec46b', '#ffd166'] },
  { id: 'solid', label: 'Solid', colors: ['#2f6fd0'] },
]

/** Dominant colour of a grid — used to tint the in-game ball and list dots. */
export function dominantColor(grid) {
  if (!grid?.length) return '#6b6a78'
  const tally = {}
  for (const hex of grid) {
    if (!hex || hex === '#ffffff') continue
    tally[hex] = (tally[hex] || 0) + 1
  }
  const best = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : '#6b6a78'
}

/** A brand-new ball starts as a recognisable object, not a blank square. */
export function defaultBallGrid() {
  return makePreset('swirl', PRESETS[0].colors)
}
