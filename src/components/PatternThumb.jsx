import { FAMILY_SWATCH, colorFamily } from '../data/colors'
import { renderShape } from '../data/shapes'
import { cx } from '../lib/utils'

/**
 * Visual for a pattern.
 *
 * Prefers a real photo you have attached to the pattern. Falls back to an
 * archetype silhouette tinted with the actual yarn that matched — so even the
 * placeholder answers "what colours would MY version be?", which is the part a
 * generic stock photo could not tell her anyway.
 */
export function PatternThumb({ pattern, slots, photo, className, ratio = 'square' }) {
  // Matched stash colour first; otherwise the slot's first acceptable family.
  const colors = (slots ?? pattern.colors).slice(0, 3).map((slot) => {
    if (slot.matched && slot.stash) {
      return slot.stash.hex || FAMILY_SWATCH[colorFamily(slot.stash.color)] || '#c9c2d1'
    }
    const fam = slot.families?.[0]
    return FAMILY_SWATCH[fam] || '#c9c2d1'
  })

  return (
    <div
      className={cx(
        'relative overflow-hidden bg-surface-2',
        ratio === 'square' ? 'aspect-square' : 'aspect-[4/3]',
        className
      )}
    >
      {photo ? (
        <img src={photo} alt={pattern.name} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="grid size-full place-items-center p-2">{renderShape(pattern.shape, colors)}</div>
      )}
    </div>
  )
}

/**
 * Real reference photos live on the web, so link straight out to them. Search
 * URLs rather than curated links: they never rot, and they surface far more
 * variety than anything that could be bundled.
 */
export function referenceLinks(pattern) {
  const q = encodeURIComponent(`${pattern.name} crochet amigurumi pattern`)
  return [
    { label: 'Google Images', href: `https://www.google.com/search?tbm=isch&q=${q}` },
    { label: 'Pinterest', href: `https://www.pinterest.com/search/pins/?q=${q}` },
    { label: 'Ravelry', href: `https://www.ravelry.com/patterns/search#query=${encodeURIComponent(pattern.name)}` },
    { label: 'YouTube', href: `https://www.youtube.com/results?search_query=${q}+tutorial` },
  ]
}
