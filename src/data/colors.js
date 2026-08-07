/**
 * Yarn colours are typed in free-hand ("Dusty Rose", "cobalt", "off white"), so
 * matching a stash entry against a pattern requirement has to go through a
 * normalised colour family rather than a string compare.
 */

export const FAMILIES = [
  'red',
  'pink',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'brown',
  'tan',
  'cream',
  'white',
  'grey',
  'black',
  'multi',
]

export const FAMILY_LABEL = {
  red: 'Red',
  pink: 'Pink',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal',
  blue: 'Blue',
  purple: 'Purple',
  brown: 'Brown',
  tan: 'Tan',
  cream: 'Cream',
  white: 'White',
  grey: 'Grey',
  black: 'Black',
  multi: 'Variegated',
}

/** A swatch per family, for chips and stash dots. */
export const FAMILY_SWATCH = {
  red: '#dc2626',
  pink: '#ec4899',
  orange: '#f97316',
  yellow: '#facc15',
  green: '#22c55e',
  teal: '#14b8a6',
  blue: '#3b82f6',
  purple: '#a855f7',
  brown: '#92400e',
  tan: '#d6b48c',
  cream: '#f5e9d7',
  white: '#fafafa',
  grey: '#9ca3af',
  black: '#27272a',
  multi: 'linear-gradient(135deg,#f472b6,#facc15,#34d399,#60a5fa)',
}

/**
 * Keyword -> family. Order matters: the first hit wins, so more specific
 * multi-word terms are listed before the bare colour they contain
 * ("navy blue" and "baby blue" both land on blue, but "teal blue" is teal).
 */
const KEYWORDS = [
  ['multi', ['variegated', 'multicolor', 'multicolour', 'rainbow', 'ombre', 'speckle', 'self-strip', 'gradient', 'tie dye', 'tie-dye']],
  ['teal', ['teal', 'turquoise', 'aqua', 'cyan', 'seafoam', 'sea foam', 'mint', 'jade', 'aquamarine']],
  ['pink', ['pink', 'rose', 'blush', 'fuchsia', 'magenta', 'salmon', 'coral', 'bubblegum', 'peony']],
  ['red', ['red', 'crimson', 'scarlet', 'burgundy', 'maroon', 'ruby', 'cherry', 'wine', 'brick']],
  ['orange', ['orange', 'apricot', 'tangerine', 'rust', 'terracotta', 'peach', 'amber', 'pumpkin']],
  ['yellow', ['yellow', 'gold', 'mustard', 'lemon', 'butter', 'canary', 'honey', 'straw', 'daffodil']],
  ['green', ['green', 'olive', 'sage', 'lime', 'forest', 'moss', 'emerald', 'pistachio', 'khaki', 'avocado']],
  ['blue', ['blue', 'navy', 'cobalt', 'denim', 'indigo', 'sky', 'cerulean', 'periwinkle', 'sapphire', 'azure']],
  ['purple', ['purple', 'violet', 'lilac', 'lavender', 'plum', 'mauve', 'amethyst', 'orchid', 'aubergine', 'eggplant']],
  ['brown', ['brown', 'chocolate', 'coffee', 'espresso', 'walnut', 'chestnut', 'mocha', 'cocoa', 'hazel']],
  ['tan', ['tan', 'beige', 'camel', 'caramel', 'sand', 'taupe', 'biscuit', 'oat', 'wheat', 'latte', 'toffee', 'nude']],
  ['cream', ['cream', 'ivory', 'ecru', 'vanilla', 'bone', 'eggshell', 'linen', 'parchment', 'almond']],
  ['white', ['white', 'snow', 'pearl', 'chalk', 'blanc']],
  ['grey', ['grey', 'gray', 'silver', 'charcoal', 'slate', 'ash', 'graphite', 'smoke', 'pewter', 'heather']],
  ['black', ['black', 'onyx', 'jet', 'raven', 'ebony', 'noir']],
]

/**
 * Best-effort family for a free-text colour name.
 * @returns {string|null} family id, or null when nothing matches.
 */
export function colorFamily(name) {
  if (!name) return null
  const s = String(name).toLowerCase().trim()
  for (const [family, words] of KEYWORDS) {
    for (const w of words) {
      if (s.includes(w)) return family
    }
  }
  return null
}

export function familySwatch(name) {
  const fam = colorFamily(name)
  return fam ? FAMILY_SWATCH[fam] : 'var(--border-strong)'
}

/* -------------------------------------------------------------- weights -- */

/** Ordered thinnest -> thickest, so adjacency = a plausible substitution. */
export const WEIGHTS = [
  'Lace',
  'Fingering',
  'Sport',
  'DK',
  'Worsted',
  'Aran',
  'Chunky',
  'Super Chunky',
]

const WEIGHT_INDEX = Object.fromEntries(WEIGHTS.map((w, i) => [w.toLowerCase(), i]))

/**
 * How well a stash yarn's weight fits what a pattern asks for.
 * @returns {'exact'|'substitute'|'no'}
 */
export function weightFit(stashWeight, patternWeight) {
  if (!patternWeight) return 'exact'
  const a = WEIGHT_INDEX[String(stashWeight || '').toLowerCase()]
  const b = WEIGHT_INDEX[String(patternWeight || '').toLowerCase()]
  if (a === undefined || b === undefined) return 'substitute'
  const gap = Math.abs(a - b)
  if (gap === 0) return 'exact'
  if (gap === 1) return 'substitute'
  return 'no'
}

/* ------------------------------------------------------------- swatches -- */

/**
 * Tap-to-pick palette for the Add Yarn sheet.
 *
 * Every name deliberately contains a word `colorFamily()` recognises, so
 * picking from here can never produce the "unrecognised colour" state that
 * makes a ball invisible to the craft engine. `hex` is only ever used for
 * display — matching still runs on the name.
 */
export const YARN_SWATCHES = [
  { name: 'Cherry Red', hex: '#d62828' },
  { name: 'Burgundy', hex: '#7b2d3b' },
  { name: 'Dusty Rose', hex: '#d98098' },
  { name: 'Bubblegum Pink', hex: '#f48fb1' },
  { name: 'Blush', hex: '#f2c4c8' },
  { name: 'Terracotta', hex: '#c96f4a' },
  { name: 'Pumpkin Orange', hex: '#e8833a' },
  { name: 'Mustard Yellow', hex: '#d9a326' },
  { name: 'Buttercup', hex: '#f6d365' },
  { name: 'Sage Green', hex: '#9caf88' },
  { name: 'Forest Green', hex: '#2f6b4f' },
  { name: 'Lime Green', hex: '#a8c66c' },
  { name: 'Deep Teal', hex: '#17877f' },
  { name: 'Mint', hex: '#9fdfcd' },
  { name: 'Turquoise', hex: '#3ec6c0' },
  { name: 'Cobalt Blue', hex: '#2f6fd0' },
  { name: 'Navy Blue', hex: '#23345c' },
  { name: 'Baby Blue', hex: '#a8c8e8' },
  { name: 'Denim', hex: '#5b7fa6' },
  { name: 'Lavender', hex: '#b39ddb' },
  { name: 'Plum', hex: '#6b3f6e' },
  { name: 'Violet', hex: '#8257c9' },
  { name: 'Chocolate Brown', hex: '#5b3a26' },
  { name: 'Coffee', hex: '#7a5238' },
  { name: 'Camel Tan', hex: '#c8a678' },
  { name: 'Beige', hex: '#d9c7ac' },
  { name: 'Caramel', hex: '#b9814a' },
  { name: 'Cream', hex: '#f0e4cf' },
  { name: 'Ivory', hex: '#f5efe2' },
  { name: 'White', hex: '#fbfbfb' },
  { name: 'Off White', hex: '#f4f2ec' },
  { name: 'Heather Grey', hex: '#a8a4a0' },
  { name: 'Silver Grey', hex: '#cfd2d6' },
  { name: 'Charcoal Grey', hex: '#55555c' },
  { name: 'Soft Black', hex: '#262229' },
  { name: 'Variegated', hex: '#b06ab3' },
]

/** Display colour for a stash entry: its picked hex, else its family swatch. */
export function yarnSwatch(yarn) {
  return yarn?.hex || familySwatch(yarn?.color)
}
