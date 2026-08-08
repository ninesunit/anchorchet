/**
 * Content for the Crafter's Manual video library and cheat sheets.
 *
 * The stitch dictionary itself lives in data/crochetSymbols.js — it is built to
 * the Craft Yarn Council standard and carries the chart symbols, so it is a
 * reference set rather than app copy.
 */

/* --------------------------------------------------------- video library -- */

export const TUTORIAL_TIERS = {
  anchor_dropped: {
    id: 'anchor_dropped',
    label: 'Recommended by Player 2',
    blurb: 'Sent over by your Anchor',
  },
  basics: {
    id: 'basics',
    label: 'The absolute basics',
    blurb: 'Holding the yarn, slip knot, chaining',
  },
  stitches: {
    id: 'stitches',
    label: 'Stitch guides',
    blurb: 'SC, HDC, DC',
  },
  amigurumi: {
    id: 'amigurumi',
    label: 'Amigurumi essentials',
    blurb: 'Magic ring, invisible decrease, fastening off',
  },
}

/**
 * Seeded topics.
 *
 * These are searches, not specific videos: a hardcoded YouTube ID rots the day
 * that channel deletes it, and picking "the" tutorial for someone is worse than
 * showing them the shelf. Real embeds arrive when Player 2 drops a link.
 */
export const TUTORIAL_TOPICS = [
  { tier: 'basics', title: 'How to hold the yarn and hook', q: 'how to hold crochet hook and yarn beginner' },
  { tier: 'basics', title: 'Making a slip knot', q: 'crochet slip knot beginner' },
  { tier: 'basics', title: 'Chain stitch (CH)', q: 'crochet chain stitch tutorial beginner' },
  { tier: 'stitches', title: 'Single crochet (SC)', q: 'single crochet tutorial beginner' },
  { tier: 'stitches', title: 'Half double crochet (HDC)', q: 'half double crochet tutorial' },
  { tier: 'stitches', title: 'Double crochet (DC)', q: 'double crochet tutorial beginner' },
  { tier: 'amigurumi', title: 'The magic ring', q: 'crochet magic ring tutorial slow' },
  { tier: 'amigurumi', title: 'Invisible decrease', q: 'crochet invisible decrease amigurumi' },
  { tier: 'amigurumi', title: 'Fastening off and closing', q: 'amigurumi fasten off close hole tutorial' },
]

export const searchUrl = (q) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

/**
 * Turn a pasted YouTube / TikTok link into an embeddable one.
 * @returns {{embed:string,kind:'youtube'|'tiktok'|'other',id?:string}|null}
 */
export function parseTutorialUrl(raw) {
  const url = (raw || '').trim()
  if (!url) return null

  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (yt) {
    return { kind: 'youtube', id: yt[1], embed: `https://www.youtube.com/embed/${yt[1]}` }
  }

  const tk = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|v\/)(\d+)/)
  if (tk) {
    return { kind: 'tiktok', id: tk[1], embed: `https://www.tiktok.com/embed/v2/${tk[1]}` }
  }

  // A direct GIF or MP4 can be shown inline; anything else just gets linked.
  if (/\.(gif|webp|mp4|webm)(\?|$)/i.test(url)) {
    return { kind: 'media', embed: url }
  }
  return { kind: 'other', embed: url }
}

/* ---------------------------------------------------------- cheat sheets -- */

/**
 * Craft Yarn Council standard weights and their recommended hook ranges.
 * Amigurumi deliberately goes 1-2 sizes below these so the fabric is tight
 * enough that stuffing does not show through — noted in the UI.
 */
export const YARN_HOOK_CHART = [
  { n: 0, name: 'Lace', also: 'Thread, 10-count', mm: [1.6, 2.25], strand: 1 },
  { n: 1, name: 'Super Fine', also: 'Fingering, sock', mm: [2.25, 3.5], strand: 2 },
  { n: 2, name: 'Fine', also: 'Sport, baby', mm: [3.5, 4.5], strand: 3 },
  { n: 3, name: 'Light', also: 'DK, light worsted', mm: [4.5, 5.5], strand: 4 },
  { n: 4, name: 'Medium', also: 'Worsted, aran', mm: [5.5, 6.5], strand: 5.5 },
  { n: 5, name: 'Bulky', also: 'Chunky, craft', mm: [6.5, 9], strand: 7 },
  { n: 6, name: 'Super Bulky', also: 'Roving', mm: [9, 15], strand: 9 },
  { n: 7, name: 'Jumbo', also: 'Arm knitting', mm: [15, 25], strand: 12 },
]

/** Metric to US letter/number. The two systems do not line up exactly. */
export const HOOK_CONVERSION = [
  { mm: 2.25, us: 'B/1' },
  { mm: 2.75, us: 'C/2' },
  { mm: 3.25, us: 'D/3' },
  { mm: 3.5, us: 'E/4' },
  { mm: 3.75, us: 'F/5' },
  { mm: 4.0, us: 'G/6' },
  { mm: 4.5, us: '7' },
  { mm: 5.0, us: 'H/8' },
  { mm: 5.5, us: 'I/9' },
  { mm: 6.0, us: 'J/10' },
  { mm: 6.5, us: 'K/10½' },
  { mm: 8.0, us: 'L/11' },
  { mm: 9.0, us: 'M-N/13' },
  { mm: 10.0, us: 'N-P/15' },
]
