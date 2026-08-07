/**
 * Archetype silhouettes for pattern thumbnails.
 *
 * These are deliberately *schematics*, not depictions — they give the catalogue
 * grid a scannable shape-and-colour at a glance ("the round sheep one", "the
 * hat"), tinted with the actual yarn she would use. They are not a substitute
 * for a real reference photo, which is why every pattern also links out to real
 * examples and can carry a photo you attach yourself.
 *
 * Ten broad archetypes rather than one drawing per pattern: at thumbnail size a
 * bear and a cat silhouette are the same picture, and 56 bespoke drawings would
 * be worse, not better.
 */

// width/height 100% + meet lets the same square artwork sit correctly in both
// the square card thumb and the 4:3 detail header without cropping.
const S = {
  viewBox: '0 0 100 100',
  xmlns: 'http://www.w3.org/2000/svg',
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'xMidYMid meet',
  className: 'max-h-full',
}

/** Two dot eyes + a stitch mouth, shared by every face-bearing archetype. */
function Face({ cx = 50, cy = 52, spread = 11, size = 3.4, mouth = true }) {
  return (
    <>
      <circle cx={cx - spread} cy={cy} r={size} fill="#241f2b" opacity="0.85" />
      <circle cx={cx + spread} cy={cy} r={size} fill="#241f2b" opacity="0.85" />
      {mouth && (
        <path
          d={`M${cx - 4},${cy + 8} q4,3.5 8,0`}
          stroke="#241f2b"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      )}
    </>
  )
}

const critter = (a, b, c) => (
  <svg {...S}>
    {/* ears */}
    <circle cx="28" cy="27" r="12" fill={a} />
    <circle cx="72" cy="27" r="12" fill={a} />
    <circle cx="28" cy="27" r="6" fill={c} opacity="0.85" />
    <circle cx="72" cy="27" r="6" fill={c} opacity="0.85" />
    {/* body */}
    <circle cx="50" cy="55" r="34" fill={a} />
    {/* muzzle */}
    <ellipse cx="50" cy="66" rx="17" ry="13" fill={b} />
    <circle cx="50" cy="60" r="3.6" fill="#241f2b" opacity="0.85" />
    <Face cy={49} spread={12} />
  </svg>
)

const bird = (a, b, c) => (
  <svg {...S}>
    <ellipse cx="50" cy="58" rx="32" ry="34" fill={a} />
    <ellipse cx="50" cy="68" rx="19" ry="20" fill={b} />
    {/* beak */}
    <path d="M50,54 l9,7 -9,6 z" fill={c} />
    {/* wing */}
    <ellipse cx="22" cy="60" rx="8" ry="15" fill={a} opacity="0.75" />
    <ellipse cx="78" cy="60" rx="8" ry="15" fill={a} opacity="0.75" />
    {/* feet */}
    <path d="M40,90 l-5,6 M40,90 l5,6 M60,90 l-5,6 M60,90 l5,6" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
    <Face cy={46} spread={11} mouth={false} />
  </svg>
)

const humanoid = (a, b, c) => (
  <svg {...S}>
    {/* head */}
    <circle cx="50" cy="30" r="21" fill={b} />
    {/* hair */}
    <path d="M29,28 a21,21 0 0 1 42,0 q-21,-11 -42,0z" fill={c} />
    {/* body / robe */}
    <path d="M32,52 q18,-7 36,0 l7,40 q-25,7 -50,0z" fill={a} />
    {/* arms */}
    <path d="M32,54 l-9,26" stroke={a} strokeWidth="10" strokeLinecap="round" />
    <path d="M68,54 l9,26" stroke={a} strokeWidth="10" strokeLinecap="round" />
    <Face cy={31} spread={8} size={2.8} />
  </svg>
)

const bot = (a, b, c) => (
  <svg {...S}>
    <rect x="18" y="26" width="64" height="52" rx="14" fill={a} />
    <rect x="27" y="36" width="46" height="26" rx="10" fill={b} />
    <circle cx="50" cy="49" r="8" fill={c} />
    <circle cx="50" cy="49" r="3.2" fill="#241f2b" opacity="0.8" />
    {/* antenna + wheels */}
    <path d="M50,26 v-10" stroke={a} strokeWidth="4" strokeLinecap="round" />
    <circle cx="50" cy="13" r="4.5" fill={c} />
    <circle cx="31" cy="82" r="8" fill={c} />
    <circle cx="69" cy="82" r="8" fill={c} />
  </svg>
)

const hat = (a, b) => (
  <svg {...S}>
    {/* crown */}
    <path d="M22,62 a28,30 0 0 1 56,0z" fill={a} />
    {/* brim */}
    <rect x="14" y="60" width="72" height="18" rx="9" fill={b} />
    {/* ribbing */}
    <path
      d="M34,62 v-16 M42,62 v-22 M50,62 v-25 M58,62 v-22 M66,62 v-16"
      stroke="#241f2b"
      strokeWidth="1.6"
      opacity="0.16"
      strokeLinecap="round"
    />
    {/* pom */}
    <circle cx="50" cy="26" r="9" fill={b} />
  </svg>
)

const bag = (a, b) => (
  <svg {...S}>
    {/* handles */}
    <path d="M35,36 v-6 a15,15 0 0 1 30,0 v6" stroke={b} strokeWidth="5" fill="none" strokeLinecap="round" />
    {/* body */}
    <path d="M20,36 h60 l-6,52 h-48z" fill={a} />
    {/* weave */}
    <path
      d="M30,48 h40 M29,60 h42 M28,72 h44"
      stroke="#241f2b"
      strokeWidth="1.6"
      opacity="0.14"
      strokeLinecap="round"
    />
  </svg>
)

const blanket = (a, b, c) => {
  const cols = [a, b, c, b, c, a, c, a, b]
  return (
    <svg {...S}>
      {cols.map((fill, i) => (
        <rect
          key={i}
          x={14 + (i % 3) * 25}
          y={14 + Math.floor(i / 3) * 25}
          width="22"
          height="22"
          rx="4"
          fill={fill}
        />
      ))}
      {cols.map((_, i) => (
        <circle
          key={`d${i}`}
          cx={25 + (i % 3) * 25}
          cy={25 + Math.floor(i / 3) * 25}
          r="4.5"
          fill="#fff"
          opacity="0.35"
        />
      ))}
    </svg>
  )
}

const ball = (a, b) => (
  <svg {...S}>
    <circle cx="50" cy="52" r="36" fill={a} />
    <circle cx="40" cy="42" r="5" fill={b} />
    <circle cx="55" cy="38" r="5" fill={b} />
    <circle cx="50" cy="53" r="5" fill={b} />
    <ellipse cx="36" cy="34" rx="10" ry="6" fill="#fff" opacity="0.18" transform="rotate(-30 36 34)" />
  </svg>
)

const garment = (a, b) => (
  <svg {...S}>
    {/* sleeves */}
    <path d="M28,32 l-14,10 8,16 12,-8z" fill={a} />
    <path d="M72,32 l14,10 -8,16 -12,-8z" fill={a} />
    {/* body */}
    <path d="M30,30 q20,-8 40,0 l4,54 q-24,7 -48,0z" fill={a} />
    {/* placket */}
    <path d="M50,26 v58" stroke={b} strokeWidth="4" />
    <path d="M30,30 q20,-8 40,0" stroke={b} strokeWidth="4" fill="none" />
  </svg>
)

const star = (a, b) => (
  <svg {...S}>
    <circle cx="50" cy="16" r="8" fill="none" stroke={b} strokeWidth="4" />
    <path d="M50,30 l10,21 23,3 -17,16 4,23 -20,-11 -20,11 4,-23 -17,-16 23,-3z" fill={a} />
  </svg>
)

const heart = (a, b) => (
  <svg {...S}>
    <circle cx="50" cy="16" r="8" fill="none" stroke={b} strokeWidth="4" />
    <path
      d="M50,88 C18,66 16,44 28,36 c9,-6 18,0 22,8 4,-8 13,-14 22,-8 12,8 10,30 -22,52z"
      fill={a}
    />
  </svg>
)

/** Doughnut, scrunchie — anything that is essentially a fat ring. */
const ring = (a, b) => (
  <svg {...S}>
    <circle cx="50" cy="52" r="34" fill={a} />
    <circle cx="50" cy="52" r="13" fill="var(--surface-2)" />
    <path
      d="M50,18 a34,34 0 0 1 30,18"
      stroke={b}
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="34" cy="34" r="3" fill={b} />
    <circle cx="66" cy="70" r="3" fill={b} />
    <circle cx="30" cy="64" r="3" fill={b} />
  </svg>
)

const pin = (a, b) => (
  <svg {...S}>
    <path
      d="M50,8 c9,0 13,12 11,24 -1,7 -6,10 -6,17 0,12 8,17 8,29 0,9 -6,14 -13,14 s-13,-5 -13,-14 c0,-12 8,-17 8,-29 0,-7 -5,-10 -6,-17 -2,-12 2,-24 11,-24z"
      fill={a}
    />
    <path d="M38,36 q12,4 24,0 M37,45 q13,4 26,0" stroke={b} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
)

const scarf = (a, b) => (
  <svg {...S}>
    <rect x="34" y="10" width="32" height="66" rx="6" fill={a} />
    <path
      d="M38,24 h24 M38,38 h24 M38,52 h24 M38,66 h24"
      stroke="#241f2b"
      strokeWidth="1.8"
      opacity="0.14"
      strokeLinecap="round"
    />
    {/* fringe */}
    <path
      d="M38,76 v12 M46,76 v12 M54,76 v12 M62,76 v12"
      stroke={b}
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
)

const mittens = (a, b) => {
  // One mitten drawn around x=0, then placed twice — the earlier version nested
  // a scale(-1,1) inside a translate and collapsed into a single blob.
  const Mitten = ({ x, flip }) => (
    <g transform={`translate(${x},0)${flip ? ' scale(-1,1)' : ''}`}>
      <path d="M-11,34 q11,-11 22,0 v28 h-22z" fill={a} />
      <path d="M-11,44 q-9,1 -9,9 q0,8 9,7z" fill={a} />
      <rect x="-13" y="60" width="26" height="12" rx="6" fill={b} />
    </g>
  )
  return (
    <svg {...S}>
      <Mitten x={30} flip={false} />
      <Mitten x={70} flip />
    </svg>
  )
}

export const SHAPES = {
  critter,
  bird,
  humanoid,
  bot,
  hat,
  bag,
  blanket,
  ball,
  garment,
  star,
  heart,
  ring,
  pin,
  scarf,
  mittens,
}

/**
 * @param {string} shape  archetype key
 * @param {string[]} colors  1–3 fills, cycled if short
 */
export function renderShape(shape, colors) {
  const fn = SHAPES[shape] || SHAPES.critter
  const [a, b, c] = [0, 1, 2].map((i) => colors[i] ?? colors[i % colors.length] ?? '#c9c2d1')
  return fn(a, b, c)
}
