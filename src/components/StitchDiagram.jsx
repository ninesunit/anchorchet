/**
 * Stitch diagrams.
 *
 * Hand-drawn SVG rather than photos or GIFs: the crochet tutorials worth
 * linking to are other people's work, and for "where exactly does the hook go"
 * a clean labelled diagram beats a photo anyway — a photo of yarn is mostly
 * fuzz. Every diagram is drawn in the same 120x90 space with the same visual
 * language: loops are outlined, the target loop is filled, and the hook is a
 * single accent-coloured stroke.
 */

import { cx } from '../lib/utils'

const VB = { viewBox: '0 0 120 90', xmlns: 'http://www.w3.org/2000/svg', className: 'w-full' }

const YARN = 'var(--tan, #c8a678)'
const LINE = 'var(--text)'
const HOOK = 'var(--ember)'
const HILITE = 'var(--mint)'

/** One V-shaped stitch top: the two loops you can see from above. */
function StitchTop({ x, y, s = 1, front = LINE, back = LINE, frontFill = 'none', backFill = 'none' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* back loop sits further from you */}
      <path
        d="M-11,-5 q11,-9 22,0"
        fill={backFill}
        stroke={back}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* front loop is the nearer half of the V */}
      <path
        d="M-11,2 q11,-9 22,0"
        fill={frontFill}
        stroke={front}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  )
}

function Post({ x, y, h = 26, color = LINE }) {
  return (
    <path
      d={`M${x},${y} q4,${h / 2} 0,${h}`}
      fill="none"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
    />
  )
}

function Hook({ x, y, rot = 0, color = HOOK }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path
        d="M0,26 L0,4 q0,-5 -5,-5 q-5,0 -5,4 q0,3 3,3"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

/**
 * Text inside the drawing.
 *
 * Sizes are in viewBox units, so they scale with the diagram — 5.5 lands at
 * roughly 15px once the SVG is capped at its 330px max width, which sits just
 * above the surrounding body text without shouting. `size={4}` is the footnote
 * under each drawing; anything longer than about 45 characters needs it to
 * stay inside the 120-unit box.
 */
function Label({ x, y, children, color = LINE, anchor = 'middle', size = 5.5 }) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      textAnchor={anchor}
      fontSize={size}
      fontWeight="700"
      style={{ letterSpacing: '0.02em' }}
    >
      {children}
    </text>
  )
}

function Leader({ from, to, color = LINE }) {
  return (
    <path
      d={`M${from[0]},${from[1]} L${to[0]},${to[1]}`}
      stroke={color}
      strokeWidth="1"
      strokeDasharray="2 2"
      fill="none"
    />
  )
}

/* ------------------------------------------------------------- diagrams -- */

/**
 * The one that matters most: what you are actually looking down at.
 *
 * One stitch drawn big and colour-coded, with a legend underneath rather than
 * leader lines into the drawing — at phone width, arrows pointing at two loops
 * 3mm apart land their labels on top of the thing they are labelling.
 */
const anatomy = () => (
  <svg {...VB}>
    <StitchTop x={62} y={32} s={2.4} back={HILITE} front={HOOK} />
    <Post x={57} y={40} h={20} />

    {/* the V */}
    <Leader from={[24, 17]} to={[41, 24]} />
    <Label x={4} y={15} anchor="start">
      the &ldquo;V&rdquo;
    </Label>

    {/* post */}
    <Leader from={[98, 54]} to={[65, 52]} />
    <Label x={116} y={57} anchor="end">
      post
    </Label>

    {/* legend, clear of the drawing */}
    <path d="M8,71 h13" stroke={HILITE} strokeWidth="3.5" strokeLinecap="round" />
    <Label x={26} y={73.5} anchor="start" size={5} color={HILITE}>
      back loop · further away
    </Label>
    <path d="M8,83 h13" stroke={HOOK} strokeWidth="3.5" strokeLinecap="round" />
    <Label x={26} y={85.5} anchor="start" size={5} color={HOOK}>
      front loop · nearer you
    </Label>
  </svg>
)

/** Chain: a row of interlocking loops. */
const chain = () => (
  <svg {...VB}>
    {[18, 42, 66, 90].map((x, i) => (
      <ellipse
        key={x}
        cx={x}
        cy={45}
        rx="13"
        ry="9"
        fill="none"
        stroke={i === 3 ? HOOK : YARN}
        strokeWidth="4"
        transform={`rotate(${i % 2 ? 8 : -8} ${x} 45)`}
      />
    ))}
    <Hook x={104} y={30} rot={12} />
    <Label x={60} y={80} size={4} color="var(--text-muted)">
      Yarn over, pull through the loop. Repeat.
    </Label>
  </svg>
)

/** Single crochet: hook through, yarn over, through two. */
const single = () => (
  <svg {...VB}>
    <g transform="translate(0 4)">
      <StitchTop x={30} y={34} s={1.4} />
      <StitchTop x={62} y={34} s={1.4} frontFill="var(--mint-soft)" />
      <StitchTop x={94} y={34} s={1.4} />
      <Post x={28} y={38} />
      <Post x={60} y={38} />
      <Post x={92} y={38} />
      <Hook x={62} y={4} rot={0} />
      <Leader from={[62, 60]} to={[62, 44]} color={HOOK} />
      <Label x={62} y={70} color={HOOK}>
        insert under both loops
      </Label>
    </g>
  </svg>
)

/** Increase: two posts sharing one hole. */
const increase = () => (
  <svg {...VB}>
    <g transform="translate(0 8)">
      <StitchTop x={32} y={30} s={1.4} />
      <StitchTop x={88} y={30} s={1.4} />
      <Post x={30} y={34} />
      <Post x={86} y={34} />

      {/* two posts into the same stitch */}
      <StitchTop x={60} y={30} s={1.4} frontFill="var(--mint-soft)" />
      <path d="M54,34 q-6,14 -4,26" fill="none" stroke={HOOK} strokeWidth="3" strokeLinecap="round" />
      <path d="M66,34 q6,14 4,26" fill="none" stroke={HOOK} strokeWidth="3" strokeLinecap="round" />
      <Leader from={[60, 74]} to={[60, 62]} color={HOOK} />
      <Label x={60} y={82} color={HOOK}>
        2 stitches into 1 hole
      </Label>
    </g>
  </svg>
)

/** Decrease: two stitch tops pulled into one. */
const decrease = () => (
  <svg {...VB}>
    <g transform="translate(0 2)">
      <StitchTop x={38} y={26} s={1.4} frontFill="var(--mint-soft)" />
      <StitchTop x={82} y={26} s={1.4} frontFill="var(--mint-soft)" />
      <path d="M38,32 q4,16 22,24" fill="none" stroke={HOOK} strokeWidth="3" strokeLinecap="round" />
      <path d="M82,32 q-4,16 -22,24" fill="none" stroke={HOOK} strokeWidth="3" strokeLinecap="round" />
      <StitchTop x={60} y={62} s={1.3} front={HOOK} back={HOOK} />
      <Label x={60} y={82} size={4} color="var(--text-muted)">
        2 stitches worked together into 1
      </Label>
    </g>
  </svg>
)

/** Invisible decrease: front loops only, so the join disappears. */
const invdec = () => (
  <svg {...VB}>
    <g transform="translate(0 8)">
      {/* the two front loops are what you pick up */}
      <StitchTop x={38} y={28} s={1.4} front={HILITE} frontFill="var(--mint-soft)" />
      <StitchTop x={82} y={28} s={1.4} front={HILITE} frontFill="var(--mint-soft)" />
      <Leader from={[26, 52]} to={[34, 34]} color={HILITE} />
      <Label x={3} y={58} color={HILITE} anchor="start">
        front loops only
      </Label>
      <Hook x={60} y={0} />
      <Label x={60} y={80} size={4} color="var(--text-muted)">
        Through both front loops, then finish as one
      </Label>
    </g>
  </svg>
)

/** Magic ring: an adjustable loop you cinch shut. */
const magicRing = () => (
  <svg {...VB}>
    <circle cx="56" cy="42" r="24" fill="none" stroke={YARN} strokeWidth="5" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <path
        key={a}
        d="M56,18 l0,-9"
        stroke={YARN}
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${a} 56 42)`}
      />
    ))}
    <path d="M80,42 q16,6 26,18" fill="none" stroke={HOOK} strokeWidth="4" strokeLinecap="round" />
    <Label x={106} y={78} color={HOOK} anchor="end">
      pull the tail to close
    </Label>
  </svg>
)

/** Slip stitch: flat join, no height. */
const slipStitch = () => (
  <svg {...VB}>
    <g transform="translate(0 10)">
      <StitchTop x={34} y={34} s={1.4} />
      <StitchTop x={86} y={34} s={1.4} />
      <path d="M34,34 q26,-16 52,0" fill="none" stroke={HOOK} strokeWidth="3.5" strokeLinecap="round" />
      <Label x={60} y={70} size={4} color="var(--text-muted)">
        Joins with no height — closing a round
      </Label>
    </g>
  </svg>
)

/** Fasten off: cut, pull through, weave in. */
const fastenOff = () => (
  <svg {...VB}>
    <g transform="translate(0 8)">
      <StitchTop x={44} y={32} s={1.4} />
      <StitchTop x={78} y={32} s={1.4} />
      <path
        d="M78,36 q10,14 22,10 q10,-4 4,-14"
        fill="none"
        stroke={HOOK}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* scissors mark, kept clear of the first stitch */}
      <path d="M8,24 l12,12 M20,24 l-12,12" stroke={LINE} strokeWidth="2.5" strokeLinecap="round" />
      <Label x={60} y={76} size={4} color="var(--text-muted)">
        Cut, pull the tail through, weave it in
      </Label>
    </g>
  </svg>
)

/** BLO / FLO: which half of the V you go under. */
const loops = () => (
  <svg {...VB}>
    <g transform="translate(0 4)">
      {/* BLO on the left */}
      <StitchTop x={32} y={34} s={1.6} back={HILITE} backFill="var(--mint-soft)" />
      <Label x={32} y={16} color={HILITE}>
        BLO
      </Label>
      <Label x={32} y={62} size={4} color="var(--text-muted)">
        back loop only
      </Label>

      {/* FLO on the right */}
      <StitchTop x={90} y={34} s={1.6} front={HOOK} frontFill="var(--ember-soft)" />
      <Label x={90} y={16} color={HOOK}>
        FLO
      </Label>
      <Label x={90} y={62} size={4} color="var(--text-muted)">
        front loop only
      </Label>

      <path d="M61,20 v34" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
      <Label x={60} y={80} size={4} color="var(--text-muted)">
        BLO makes a ridge · FLO makes a fold line
      </Label>
    </g>
  </svg>
)

export const DIAGRAMS = {
  anatomy,
  chain,
  single,
  increase,
  decrease,
  invdec,
  magicRing,
  slipStitch,
  fastenOff,
  loops,
}

export function StitchDiagram({ name, className }) {
  const fn = DIAGRAMS[name]
  if (!fn) return null
  // Capped rather than full-bleed: the labels are sized in viewBox units, so an
  // unbounded SVG on a desktop card renders 40px lettering on a 3-word note.
  return <div className={cx('mx-auto w-full max-w-[330px]', className)}>{fn()}</div>
}
