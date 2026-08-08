/**
 * Guessing which stitches a bounty needs, from its title and note.
 *
 * Player 2 does not crochet and cannot tag a quest with "you'll want an
 * invisible decrease for this". He can, however, type "Palworld Depresso
 * plushie" — and the word "plushie" is enough to know the answer, because
 * construction follows category almost perfectly: soft toys are worked in the
 * round from a magic ring in single crochet, wearables are worked flat in
 * taller stitches, and homeware is flat rows with turning chains.
 *
 * Runs entirely on the client before the write, so the tags are already on the
 * document when it reaches her — no lookup on read, and no cloud function.
 */

/**
 * Ordered most-specific first: a "plushie beanie" is a plushie, and matching
 * stops at the first rule that hits so it does not end up tagged with six
 * stitches and no signal.
 */
export const KEYWORD_RULES = [
  {
    id: 'amigurumi',
    label: 'Amigurumi / soft toy',
    keywords: [
      'plushie',
      'plush',
      'amigurumi',
      'ami',
      'doll',
      'toy',
      'keychain',
      'buddy',
      'critter',
      'stuffed',
      'figure',
      'pal',
    ],
    stitches: ['Magic Ring (MR)', 'Single Crochet (SC)', 'Invisible Decrease (INV DEC)'],
    note: 'Worked in a spiral from a magic ring, in single crochet, with invisible decreases so the shaping does not show.',
  },
  {
    id: 'wearable',
    label: 'Wearable',
    keywords: [
      'beanie',
      'hat',
      'cardigan',
      'sweater',
      'wearable',
      'scarf',
      'mittens',
      'gloves',
      'sock',
      'top',
      'bag',
      'bucket hat',
      'headband',
    ],
    stitches: ['Chain (CH)', 'Double Crochet (DC)', 'Half-Double Crochet (HDC)'],
    note: 'Taller stitches so it grows fast and drapes. Chain to start, then rows or rounds of HDC and DC.',
  },
  {
    id: 'flat',
    label: 'Flat piece',
    keywords: [
      'coaster',
      'blanket',
      'flat',
      'granny square',
      'square',
      'mat',
      'placemat',
      'doily',
      'throw',
      'dishcloth',
      'bookmark',
      'garland',
    ],
    stitches: ['Chain (CH)', 'Slip Stitch (SL ST)', 'Turning Chain'],
    note: 'Worked flat in rows. The turning chain at the start of each row is what stops the edges pulling in.',
  },
]

/**
 * @param {string} text  Title and description, concatenated is fine.
 * @returns {{id:string,label:string,stitches:string[],note:string}|null}
 */
export function matchStitchRule(text) {
  const haystack = ` ${String(text || '').toLowerCase()} `
  for (const rule of KEYWORD_RULES) {
    // Word-boundary match: "toy" must not fire on "Tokyo", and "ami" must not
    // fire on "ceramic".
    const hit = rule.keywords.some((k) =>
      new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(haystack)
    )
    if (hit) return rule
  }
  return null
}

/**
 * The array that goes on the document.
 * @param {string} text
 * @returns {string[]}  empty when nothing matched — an empty array is a real
 *                      answer here, and better than a wrong guess
 */
export function analyzeStitches(text) {
  return matchStitchRule(text)?.stitches ?? []
}
