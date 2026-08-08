/**
 * The stitch dictionary behind the Crafter's Manual.
 *
 * Built to the Craft Yarn Council standard symbol set, which is what published
 * charts use — the same shapes turn up in Japanese and Russian charts too,
 * because the symbols are drawings of the stitch rather than letters in any
 * language. Where a term differs between US and UK patterns the UK name is
 * carried alongside, because that difference is the single most common way to
 * ruin a project: a UK "dc" is a US "sc", and a pattern almost never says which
 * dialect it is written in.
 *
 * `symbol` names a drawing in components/StitchSymbol.jsx; `diagram` optionally
 * names the fuller hand-drawn how-to in components/StitchDiagram.jsx.
 */

export const GROUPS = [
  {
    id: 'foundation',
    label: 'Starting off',
    blurb: 'Everything begins with one of these',
  },
  {
    id: 'height',
    label: 'The height family',
    blurb: 'One crossbar per yarn over — count them and you know the stitch',
  },
  {
    id: 'shaping',
    label: 'Shaping',
    blurb: 'Making it wider, narrower, or bend',
  },
  {
    id: 'texture',
    label: 'Texture & edges',
    blurb: 'Bumps, fans and finishing',
  },
]

export const STITCHES = [
  /* ------------------------------------------------------------ foundation */
  {
    id: 'ch',
    group: 'foundation',
    symbol: 'ch',
    diagram: 'chain',
    abbr: 'CH',
    name: 'Chain',
    uk: { abbr: 'CH', name: 'Chain' },
    yarnOvers: 0,
    how: 'Yarn over, pull through the loop on your hook. That is one chain.',
    use: 'The foundation row, and the way you travel sideways or make a gap. Count chains excluding the loop still on the hook — that one is never a stitch.',
    ami: true,
  },
  {
    id: 'slst',
    group: 'foundation',
    symbol: 'slst',
    diagram: 'slipStitch',
    abbr: 'SL ST',
    name: 'Slip stitch',
    uk: { abbr: 'SS', name: 'Slip stitch' },
    yarnOvers: 0,
    how: 'Insert the hook, yarn over, and pull through the stitch and the loop on your hook in one movement.',
    use: 'Adds almost no height. Joining a round, moving along an edge without building fabric, or finishing an invisible seam.',
    ami: true,
  },
  {
    id: 'mr',
    group: 'foundation',
    symbol: 'mr',
    diagram: 'magicRing',
    abbr: 'MR / MC',
    name: 'Magic ring',
    uk: { abbr: 'MR', name: 'Magic ring / magic circle' },
    yarnOvers: 0,
    how: 'Loop the yarn around two fingers, pull a loop through, and work your whole first round into that loop. Then pull the tail to cinch it shut.',
    use: 'Any piece worked in the round. The alternative — chain 4 and join — leaves a hole in the middle of the head that stuffing shows through.',
    ami: true,
  },
  {
    id: 'turningChain',
    group: 'foundation',
    symbol: 'turningChain',
    abbr: 'T-CH',
    name: 'Turning chain',
    uk: { abbr: 'T-CH', name: 'Turning chain' },
    yarnOvers: 0,
    how: 'Chains worked at the start of a row to bring the yarn up to the height of the stitch you are about to make. One for SC, two for HDC, three for DC.',
    use: 'Worked flat, in rows. Skip it and the edge of your fabric pulls in on itself. Whether it counts as a stitch depends on the pattern — it will say.',
  },

  /* ---------------------------------------------------------------- height */
  {
    id: 'sc',
    group: 'height',
    symbol: 'sc',
    diagram: 'single',
    abbr: 'SC',
    name: 'Single crochet',
    uk: { abbr: 'DC', name: 'Double crochet' },
    ukTrap: true,
    yarnOvers: 0,
    heightChains: 1,
    how: 'Insert the hook, yarn over, pull up a loop (2 loops on the hook), yarn over, pull through both.',
    use: 'Short and dense. The amigurumi workhorse — worked tight, stuffing cannot escape through it.',
    ami: true,
  },
  {
    id: 'hdc',
    group: 'height',
    symbol: 'hdc',
    abbr: 'HDC',
    name: 'Half double crochet',
    uk: { abbr: 'HTR', name: 'Half treble' },
    ukTrap: true,
    yarnOvers: 1,
    heightChains: 2,
    how: 'Yarn over first, then insert the hook, yarn over, pull up a loop (3 on the hook), yarn over, pull through all three at once.',
    use: 'Between SC and DC in height. Warm and slightly squishy — the usual choice for beanies and blankets.',
  },
  {
    id: 'dc',
    group: 'height',
    symbol: 'dc',
    abbr: 'DC',
    name: 'Double crochet',
    uk: { abbr: 'TR', name: 'Treble' },
    ukTrap: true,
    yarnOvers: 1,
    heightChains: 3,
    how: 'Yarn over, insert the hook, pull up a loop (3 on the hook), yarn over and pull through two, yarn over and pull through the last two.',
    use: 'Tall and quick, with a little drape. Most blankets and cardigans are mostly this.',
  },
  {
    id: 'tr',
    group: 'height',
    symbol: 'tr',
    abbr: 'TR',
    name: 'Treble crochet',
    uk: { abbr: 'DTR', name: 'Double treble' },
    ukTrap: true,
    yarnOvers: 2,
    heightChains: 4,
    how: 'Yarn over twice, insert the hook, pull up a loop, then work off two loops at a time until one is left.',
    use: 'Tall and open. Lace, mesh, and anything that should be airy.',
  },
  {
    id: 'dtr',
    group: 'height',
    symbol: 'dtr',
    abbr: 'DTR',
    name: 'Double treble',
    uk: { abbr: 'TRTR', name: 'Triple treble' },
    ukTrap: true,
    yarnOvers: 3,
    heightChains: 5,
    how: 'Yarn over three times, then work off two loops at a time.',
    use: 'Rare outside lace and dramatic edgings.',
  },
  {
    id: 'trtr',
    group: 'height',
    symbol: 'trtr',
    abbr: 'TRTR',
    name: 'Triple treble',
    uk: { abbr: 'QTR', name: 'Quadruple treble' },
    ukTrap: true,
    yarnOvers: 4,
    heightChains: 6,
    how: 'Yarn over four times, then work off two loops at a time.',
    use: 'About as tall as it gets. Mostly seen in openwork shawls.',
  },
  {
    id: 'esc',
    group: 'height',
    symbol: 'esc',
    abbr: 'ESC',
    name: 'Extended single crochet',
    uk: { abbr: 'EDC', name: 'Extended double crochet' },
    yarnOvers: 0,
    heightChains: 1.5,
    how: 'Insert the hook and pull up a loop, yarn over and pull through one loop (this is the extension), then yarn over and pull through both.',
    use: 'A single crochet with a little more height and give. Handy when SC is too stiff but HDC is too tall.',
  },

  /* --------------------------------------------------------------- shaping */
  {
    id: 'inc',
    group: 'shaping',
    symbol: 'inc',
    diagram: 'increase',
    abbr: 'INC',
    name: 'Increase',
    uk: { abbr: 'INC', name: 'Increase' },
    yarnOvers: 0,
    how: 'Work two stitches into the same hole. In a chart the two stems share one point at the bottom.',
    use: 'Makes a flat circle grow and shapes the top of a head. Six per round keeps a circle flat — more and it ruffles, fewer and it cups.',
    ami: true,
  },
  {
    id: 'dec',
    group: 'shaping',
    symbol: 'dec',
    diagram: 'decrease',
    abbr: 'DEC',
    name: 'Decrease',
    uk: { abbr: 'DEC', name: 'Decrease' },
    alsoWritten: 'sc2tog, dc2tog',
    yarnOvers: 0,
    how: 'Start two stitches but do not finish either, then pull through everything at once. In a chart the two stems join at the top.',
    use: 'The standard version goes under both loops of both stitches. It works, but it leaves a small bump.',
    ami: true,
  },
  {
    id: 'invdec',
    group: 'shaping',
    symbol: 'invdec',
    diagram: 'invdec',
    abbr: 'INV DEC',
    name: 'Invisible decrease',
    uk: { abbr: 'INV DEC', name: 'Invisible decrease' },
    yarnOvers: 0,
    notCharted: true,
    how: 'Hook under the FRONT loops only of the next two stitches (3 loops on the hook), yarn over, pull through the first two, yarn over, pull through both.',
    use: 'Nearly disappears. Use it anywhere the closing of a shape would show — faces, the top of a head, the tip of a limb.',
    ami: true,
  },
  {
    id: 'blo',
    group: 'shaping',
    symbol: 'blo',
    diagram: 'loops',
    abbr: 'BLO',
    name: 'Back loop only',
    uk: { abbr: 'BLO', name: 'Back loop only' },
    yarnOvers: 0,
    how: 'Work under just the far half of the V instead of both halves.',
    use: 'Leaves a visible ridge on the near side. Good for a sharp edge, a joint, or the fold where a base turns into a wall.',
    ami: true,
  },
  {
    id: 'flo',
    group: 'shaping',
    symbol: 'flo',
    diagram: 'loops',
    abbr: 'FLO',
    name: 'Front loop only',
    uk: { abbr: 'FLO', name: 'Front loop only' },
    yarnOvers: 0,
    how: 'Work under just the near half of the V.',
    use: 'Leaves a fold line and a free row of loops behind it — brims, skirts, and anywhere you want to come back and add a frill later.',
    ami: true,
  },

  /* --------------------------------------------------------------- texture */
  {
    id: 'shell',
    group: 'texture',
    symbol: 'shell',
    abbr: 'SHELL',
    name: 'Shell / fan',
    uk: { abbr: 'SHELL', name: 'Shell / fan' },
    yarnOvers: 1,
    how: 'Several stitches (usually five DC) into one hole, left open so they fan out.',
    use: 'The classic scalloped edge, and the building block of most vintage blanket patterns.',
  },
  {
    id: 'cluster',
    group: 'texture',
    symbol: 'cluster',
    abbr: 'CL',
    name: 'Cluster',
    uk: { abbr: 'CL', name: 'Cluster' },
    yarnOvers: 1,
    how: 'Several unfinished stitches across a few holes, then closed together at the top with one pull-through.',
    use: 'A shell in reverse — it draws the fabric in instead of fanning it out.',
  },
  {
    id: 'bobble',
    group: 'texture',
    symbol: 'bobble',
    abbr: 'BO',
    name: 'Bobble',
    uk: { abbr: 'BO', name: 'Bobble' },
    yarnOvers: 1,
    how: 'Four or five unfinished DC into the SAME hole, then closed at the top. Joined at both ends, so the middle has nowhere to go but outwards.',
    use: 'Raised dots. Noses, berries, and texture panels.',
  },
  {
    id: 'puff',
    group: 'texture',
    symbol: 'puff',
    abbr: 'PUFF',
    name: 'Puff stitch',
    uk: { abbr: 'PUFF', name: 'Puff stitch' },
    yarnOvers: 1,
    how: 'Yarn over, pull up a long loop in the same hole — three or four times — then pull through everything at once.',
    use: 'Softer and rounder than a bobble because it is loops rather than finished stitches.',
  },
  {
    id: 'popcorn',
    group: 'texture',
    symbol: 'popcorn',
    abbr: 'PC',
    name: 'Popcorn',
    uk: { abbr: 'PC', name: 'Popcorn' },
    yarnOvers: 1,
    how: 'Five DC into one hole, drop the loop, hook back into the first DC, pick the loop up again and pull it through — folding the group forward.',
    use: 'The most three-dimensional of the bumps. It genuinely sticks out.',
  },
  {
    id: 'picot',
    group: 'texture',
    symbol: 'picot',
    abbr: 'PICOT',
    name: 'Picot',
    uk: { abbr: 'PICOT', name: 'Picot' },
    yarnOvers: 0,
    how: 'Chain three, then slip stitch back into the base of those chains to make a tiny loop.',
    use: 'A row of little bumps along an edge. The quickest way to make a plain edge look finished.',
  },
  {
    id: 'fpdc',
    group: 'texture',
    symbol: 'fpdc',
    abbr: 'FPDC',
    name: 'Front post double crochet',
    uk: { abbr: 'FPTR', name: 'Front post treble' },
    ukTrap: true,
    yarnOvers: 1,
    how: 'Work a DC, but instead of going into the top V, go around the whole post of the stitch below, front to back to front.',
    use: 'With BPDC this is how ribbing is made. Alternate the two and the fabric folds like a knitted cuff.',
  },
  {
    id: 'bpdc',
    group: 'texture',
    symbol: 'bpdc',
    abbr: 'BPDC',
    name: 'Back post double crochet',
    uk: { abbr: 'BPTR', name: 'Back post treble' },
    ukTrap: true,
    yarnOvers: 1,
    how: 'The same as FPDC, but the hook goes around the post from the back.',
    use: 'The other half of ribbing. On its own it pushes a row backwards.',
  },
]

export const STITCHES_BY_ID = Object.fromEntries(STITCHES.map((s) => [s.id, s]))

/* ---------------------------------------------------------- US / UK table -- */

/**
 * The conversion nobody warns you about until a jumper comes out double-height.
 * Every US term shifts one place down the UK list, so both dialects use the
 * same words for different stitches.
 */
export const US_UK_TERMS = [
  { us: 'Slip stitch (sl st)', uk: 'Slip stitch (ss)' },
  { us: 'Single crochet (sc)', uk: 'Double crochet (dc)', trap: true },
  { us: 'Half double crochet (hdc)', uk: 'Half treble (htr)', trap: true },
  { us: 'Double crochet (dc)', uk: 'Treble (tr)', trap: true },
  { us: 'Treble crochet (tr)', uk: 'Double treble (dtr)', trap: true },
  { us: 'Double treble (dtr)', uk: 'Triple treble (trtr)', trap: true },
  { us: 'Gauge', uk: 'Tension' },
  { us: 'Yarn over (yo)', uk: 'Yarn over hook (yoh)' },
  { us: 'Skip', uk: 'Miss' },
]

/* ------------------------------------------------------ reading a chart -- */

export const CHART_RULES = [
  {
    title: 'It is an alphabet, not a picture',
    body: 'Each symbol is one stitch. Strung together they spell a pattern, exactly like letters make a word. You do not have to learn all of them — a pattern only uses the handful it needs, and the rest can wait.',
  },
  {
    title: 'Count the crossbars',
    body: 'A stem with no bar is a half double. One slash is a double, two is a treble, three is a double treble. The number of slashes is the number of times you yarn over before you start, every time.',
  },
  {
    title: 'Rounds read outwards, rows read in a zigzag',
    body: 'Worked in the round, you start at the centre and spiral out anticlockwise. Worked flat, you read right to left on the front-side rows and left to right on the back-side rows — the same direction your hook actually travels.',
  },
  {
    title: 'The symbols are near enough universal',
    body: 'US, Japanese and Russian charts use the same shapes, which is why a Japanese amigurumi chart is readable without a word of Japanese. A designer can invent a symbol for something unusual, but they will always print a key when they do.',
  },
]

/* ------------------------------------------------- label ↔ stitch lookup -- */

/**
 * Turn a human label like "Magic Ring (MR)" or "Single Crochet (SC)" back into
 * a stitch id.
 *
 * The quest analyzer stores readable strings rather than ids, because the
 * strings are what Player 2 sees when he files the bounty and what survives in
 * Firestore if the dictionary is ever renamed. Resolving happens at render
 * time so a label that no longer matches degrades to a plain pill instead of
 * throwing.
 *
 * @param {string} label
 * @returns {object|null}
 */
export function stitchFromLabel(label) {
  if (!label) return null
  const text = String(label).trim()

  const inBrackets = text.match(/\(([^)]+)\)/)?.[1]
  const norm = (s) => s.replace(/[^a-z]/gi, '').toLowerCase()

  if (inBrackets) {
    const key = norm(inBrackets)
    const hit = STITCHES.find((s) => norm(s.abbr) === key)
    if (hit) return hit
  }

  const bare = norm(text.replace(/\([^)]*\)/, ''))
  return (
    STITCHES.find((s) => norm(s.name) === bare) ||
    STITCHES.find((s) => norm(s.abbr) === norm(text)) ||
    null
  )
}
