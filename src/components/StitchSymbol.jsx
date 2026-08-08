/**
 * Crochet chart symbols, drawn to the Craft Yarn Council standard.
 *
 * The whole point of this set is that it is the *same* alphabet she will meet
 * in any published chart, so the shapes are not stylised: a chain is a plain
 * oval, a single crochet is a plain cross, and the taller stitches are a stem
 * with one crossbar per yarn over. That last rule is the one worth learning —
 * count the slashes and you know how many times to wrap before you start.
 *
 * Everything is drawn in the same 44x52 box with the stitch sitting on an
 * invisible baseline at y=46, so a row of them lines up the way a real chart
 * does. Strokes use currentColor, so a symbol inherits whatever colour the
 * card around it sets.
 */

import { cx } from '../lib/utils'

const BOX = {
  viewBox: '0 0 44 52',
  xmlns: 'http://www.w3.org/2000/svg',
  className: 'size-full',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const BASE = 46 // baseline: where a stitch meets the row below
const TOP = 8 // top of a full-height (dc and up) stitch

/** The stem plus its top bar — the shared skeleton of hdc and everything above. */
function Stem({ top = TOP, bars = 0, x = 22 }) {
  // Crossbars are spread down the stem rather than stacked at the top, which
  // is how printed charts draw them and what makes 3 vs 4 countable at a glance.
  const span = BASE - top
  const slashes = Array.from({ length: bars }, (_, i) => {
    const y = top + (span * (i + 1)) / (bars + 1)
    return <path key={i} d={`M${x - 6},${y + 3} L${x + 6},${y - 3}`} />
  })
  return (
    <>
      <path d={`M${x},${top} L${x},${BASE}`} />
      <path d={`M${x - 7},${top} L${x + 7},${top}`} />
      {slashes}
    </>
  )
}

/* --------------------------------------------------------------- symbols -- */

/** Chain — a plain oval. The one symbol every chart starts with. */
const ch = () => (
  <svg {...BOX}>
    <ellipse cx="22" cy="27" rx="14" ry="8.5" />
  </svg>
)

/** Slip stitch — a filled dot. Almost no height, so it is drawn small. */
const slst = () => (
  <svg {...BOX}>
    <circle cx="22" cy="27" r="5.5" fill="currentColor" />
  </svg>
)

/** Single crochet — a cross. (Some charts print an x; same stitch.) */
const sc = () => (
  <svg {...BOX}>
    <path d="M22,12 L22,42" />
    <path d="M9,27 L35,27" />
  </svg>
)

/** Extended single crochet — a cross on a short stem. */
const esc = () => (
  <svg {...BOX}>
    <path d="M22,20 L22,46" />
    <path d="M12,26 L32,26" />
    <path d="M15,19 L29,19" />
  </svg>
)

/** Half double crochet — a plain T. No slash: no yarn over to count. */
const hdc = () => (
  <svg {...BOX}>
    <Stem top={16} bars={0} />
  </svg>
)

/** Double crochet — one crossbar, one yarn over. */
const dc = () => (
  <svg {...BOX}>
    <Stem bars={1} />
  </svg>
)

/** Treble — two crossbars, two yarn overs. */
const tr = () => (
  <svg {...BOX}>
    <Stem bars={2} />
  </svg>
)

/** Double treble — three. */
const dtr = () => (
  <svg {...BOX}>
    <Stem bars={3} />
  </svg>
)

/** Triple treble — four. */
const trtr = () => (
  <svg {...BOX}>
    <Stem bars={4} />
  </svg>
)

/** Increase — two stitches rising out of one hole. */
const inc = () => (
  <svg {...BOX}>
    <path d="M22,46 L11,14" />
    <path d="M5,14 L17,14" />
    <path d="M22,46 L33,14" />
    <path d="M27,14 L39,14" />
    <path d="M10,30 L17,26" />
    <path d="M27,26 L34,30" />
  </svg>
)

/** Decrease — two stitches pulled together into one top. */
const dec = () => (
  <svg {...BOX}>
    <path d="M11,46 L22,14" />
    <path d="M33,46 L22,14" />
    <path d="M15,14 L29,14" />
    <path d="M12,30 L19,34" />
    <path d="M25,34 L32,30" />
  </svg>
)

/**
 * Invisible decrease.
 *
 * Not a Craft Yarn Council chart symbol — it is an amigurumi technique, and
 * amigurumi is written, not charted. Drawn as a decrease with its front loops
 * marked so the difference from a standard dec is visible at a glance.
 */
const invdec = () => (
  <svg {...BOX}>
    <path d="M11,46 L22,16" />
    <path d="M33,46 L22,16" />
    <path d="M15,16 L29,16" strokeDasharray="3 3" />
    <path d="M8,40 q6,-5 12,0" strokeWidth="2" />
    <path d="M24,40 q6,-5 12,0" strokeWidth="2" />
  </svg>
)

/** Magic ring — the adjustable loop everything round starts from. */
const mr = () => (
  <svg {...BOX}>
    <circle cx="22" cy="24" r="13" />
    <path d="M31,33 q6,7 4,13" />
  </svg>
)

/** Turning chain — chains standing up at the start of a row. */
const turningChain = () => (
  <svg {...BOX}>
    <ellipse cx="22" cy="42" rx="9" ry="6" />
    <ellipse cx="22" cy="28" rx="9" ry="6" />
    <ellipse cx="22" cy="14" rx="9" ry="6" />
    <path d="M36,40 L36,16" strokeWidth="1.8" strokeDasharray="3 3" />
    <path d="M33,20 L36,15 L39,20" strokeWidth="1.8" />
  </svg>
)

/** Picot — a little loop of chains that makes a bump on an edge. */
const picot = () => (
  <svg {...BOX}>
    <ellipse cx="22" cy="12" rx="7" ry="5" transform="rotate(-90 22 12)" />
    <ellipse cx="12" cy="24" rx="7" ry="5" transform="rotate(-40 12 24)" />
    <ellipse cx="32" cy="24" rx="7" ry="5" transform="rotate(40 32 24)" />
    <path d="M14,32 L22,46 L30,32" />
  </svg>
)

/** Shell / fan — several stitches worked into one hole and left open. */
const shell = () => (
  <svg {...BOX}>
    {[-24, -12, 0, 12, 24].map((deg) => (
      <g key={deg} transform={`rotate(${deg} 22 46)`}>
        <path d="M22,46 L22,14" />
      </g>
    ))}
    <path d="M4,14 q18,-7 36,0" />
  </svg>
)

/** Cluster — several stitches joined at the top only. */
const cluster = () => (
  <svg {...BOX}>
    <path d="M22,44 L10,14" />
    <path d="M22,44 L22,14" />
    <path d="M22,44 L34,14" />
    <path d="M6,14 L38,14" />
    <path d="M12,28 L18,25" />
    <path d="M26,25 L32,28" />
  </svg>
)

/** Bobble — joined top and bottom, so it puffs out in the middle. */
const bobble = () => (
  <svg {...BOX}>
    <path d="M22,46 q-16,-16 0,-32" />
    <path d="M22,46 q-7,-16 0,-32" />
    <path d="M22,46 q7,-16 0,-32" />
    <path d="M22,46 q16,-16 0,-32" />
  </svg>
)

/** Puff — loops rather than full stitches, gathered at both ends. */
const puff = () => (
  <svg {...BOX}>
    <path d="M22,44 q-13,-14 0,-28" />
    <path d="M22,44 q13,-14 0,-28" />
    <path d="M22,44 L22,16" />
    <path d="M13,30 L31,30" strokeWidth="2" />
  </svg>
)

/** Popcorn — a group folded forward and cinched, drawn with the closing loop. */
const popcorn = () => (
  <svg {...BOX}>
    <path d="M22,46 L11,20" />
    <path d="M22,46 L22,20" />
    <path d="M22,46 L33,20" />
    <path d="M8,20 q14,-11 28,0" />
    <path d="M8,20 q14,9 28,0" strokeWidth="2" />
  </svg>
)

/** Front post double crochet — the stem hooks around the front of the post. */
const fpdc = () => (
  <svg {...BOX}>
    <path d="M22,12 L22,34 q0,10 10,10" />
    <path d="M15,12 L29,12" />
    <path d="M16,25 L28,19" />
  </svg>
)

/** Back post double crochet — same stitch, hooked the other way. */
const bpdc = () => (
  <svg {...BOX}>
    <path d="M22,12 L22,34 q0,10 -10,10" />
    <path d="M15,12 L29,12" />
    <path d="M16,25 L28,19" />
  </svg>
)

/** Back loop only — the arc marks the half of the V you go under. */
const blo = () => (
  <svg {...BOX}>
    <path d="M22,14 L22,32" />
    <path d="M13,23 L31,23" />
    <path d="M8,44 q14,-14 28,0" strokeWidth="3" />
  </svg>
)

/** Front loop only — the same mark, flipped. */
const flo = () => (
  <svg {...BOX}>
    <path d="M22,14 L22,32" />
    <path d="M13,23 L31,23" />
    <path d="M8,36 q14,14 28,0" strokeWidth="3" />
  </svg>
)

export const SYMBOLS = {
  ch,
  slst,
  sc,
  esc,
  hdc,
  dc,
  tr,
  dtr,
  trtr,
  inc,
  dec,
  invdec,
  mr,
  turningChain,
  picot,
  shell,
  cluster,
  bobble,
  puff,
  popcorn,
  fpdc,
  bpdc,
  blo,
  flo,
}

/**
 * @param {{name: string, size?: number, className?: string}} props
 */
export function StitchSymbol({ name, size = 34, className }) {
  const fn = SYMBOLS[name]
  if (!fn) return null
  return (
    <span
      className={cx('inline-block shrink-0', className)}
      style={{ width: size, height: (size * 52) / 44 }}
      aria-hidden="true"
    >
      {fn()}
    </span>
  )
}
