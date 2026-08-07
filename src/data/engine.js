/**
 * The Ready-to-Craft engine.
 *
 * Answers "what can she start right now, without buying anything?" by matching
 * the live yarn stash against every pattern in the catalogue.
 *
 * The matching is a small best-fit allocation rather than a per-slot lookup,
 * because slots compete: a pattern needing cream for both the body and the trim
 * must not match the same single ball of cream twice.
 */

import { colorFamily, weightFit } from './colors'
import { PATTERNS } from './patterns'

/** Stash entries that can actually be used right now. */
function usablePool(stash) {
  return stash
    .filter((s) => s.status !== 'empty' && Number(s.quantity) > 0)
    .map((s) => ({
      ref: s,
      family: colorFamily(s.color),
      weight: s.weight,
      remaining: Number(s.quantity) || 0,
    }))
    .filter((s) => s.family)
}

/**
 * Match one pattern against the stash.
 * @returns {{pattern:object,status:'ready'|'close'|'blocked',slots:Array,missing:Array,substitutions:number,readyCount:number}}
 */
export function evaluatePattern(pattern, stash) {
  const pool = usablePool(stash)

  // Most-constrained-first: a slot accepting only "black" must get first pick
  // over one that accepts nine different families, or the greedy pass can
  // strand it behind a wide slot that ate the only black ball.
  const order = pattern.colors
    .map((slot, index) => {
      const candidates = pool.filter(
        (item) =>
          slot.families.includes(item.family) &&
          weightFit(item.weight, pattern.weight) !== 'no'
      )
      return { slot, index, candidateCount: candidates.length }
    })
    .sort((a, b) => a.candidateCount - b.candidateCount)

  const slots = Array.from({ length: pattern.colors.length })
  let substitutions = 0

  for (const { slot, index } of order) {
    const need = slot.skeins || 1

    const viable = pool
      .filter((item) => slot.families.includes(item.family))
      .map((item) => ({ item, fit: weightFit(item.weight, pattern.weight) }))
      .filter((c) => c.fit !== 'no')

    const sufficient = viable.filter((c) => c.item.remaining >= need)

    // Prefer an exact weight match; among equals take the smallest ball that
    // still covers the slot, leaving the big ones free for later slots.
    sufficient.sort((a, b) => {
      if (a.fit !== b.fit) return a.fit === 'exact' ? -1 : 1
      return a.item.remaining - b.item.remaining
    })

    const chosen = sufficient[0]

    if (chosen) {
      chosen.item.remaining -= need
      if (chosen.fit === 'substitute') substitutions += 1
      slots[index] = {
        ...slot,
        matched: true,
        fit: chosen.fit,
        stash: chosen.item.ref,
        need,
      }
      continue
    }

    // Nothing worked — work out *why*, so the UI can say something useful.
    const haveColourWrongWeight = pool.some(
      (item) => slot.families.includes(item.family) && weightFit(item.weight, pattern.weight) === 'no'
    )
    const shortfall = viable.reduce((max, c) => Math.max(max, c.item.remaining), 0)

    let reason = 'none'
    if (viable.length > 0) reason = 'quantity'
    else if (haveColourWrongWeight) reason = 'weight'

    slots[index] = {
      ...slot,
      matched: false,
      reason,
      need,
      short: Math.max(0, need - shortfall),
    }
  }

  const missing = slots.filter((s) => !s.matched)
  const status = missing.length === 0 ? 'ready' : missing.length === 1 ? 'close' : 'blocked'

  return {
    pattern,
    status,
    slots,
    missing,
    substitutions,
    readyCount: slots.length - missing.length,
  }
}

const STATUS_RANK = { ready: 0, close: 1, blocked: 2 }

/**
 * Evaluate the whole catalogue, sorted so the craftable things float to the top.
 * @param {Array} stash
 * @param {{series?:string,tier?:string,query?:string}} filters
 */
export function evaluateAll(stash, filters = {}) {
  const { series, tier, query } = filters
  const q = (query || '').trim().toLowerCase()

  return PATTERNS.filter((pat) => {
    if (series && pat.series !== series) return false
    if (tier && pat.tier !== tier) return false
    if (q && !`${pat.name} ${pat.blurb} ${pat.series}`.toLowerCase().includes(q)) return false
    return true
  })
    .map((pat) => evaluatePattern(pat, stash))
    .sort((a, b) => {
      const s = STATUS_RANK[a.status] - STATUS_RANK[b.status]
      if (s !== 0) return s
      // Within a bucket, fewer substitutions and shorter builds first.
      if (a.substitutions !== b.substitutions) return a.substitutions - b.substitutions
      return a.pattern.hours - b.pattern.hours
    })
}

/**
 * What should Player 2 actually buy?
 *
 * Scores every (family, weight) gap by how many patterns it would unlock,
 * weighting near-misses heavily — one ball that finishes three half-done
 * patterns beats one that chips away at a dozen impossible ones.
 */
export function suggestPurchases(stash, limit = 6) {
  const evaluations = PATTERNS.map((pat) => evaluatePattern(pat, stash))
  const scores = new Map()

  for (const evaluation of evaluations) {
    if (evaluation.status === 'ready') continue
    // Only near-misses are actionable; a pattern missing four colours is not
    // going to be unlocked by a single supply drop.
    const weight = evaluation.status === 'close' ? 5 : 1
    if (evaluation.missing.length > 2) continue

    for (const slot of evaluation.missing) {
      for (const family of slot.families) {
        const key = `${family}|${evaluation.pattern.weight}`
        const entry = scores.get(key) || {
          family,
          weight: evaluation.pattern.weight,
          score: 0,
          unlocks: [],
        }
        // Divide by the number of alternatives so a slot accepting nine
        // families doesn't inflate all nine equally with a full point.
        entry.score += weight / slot.families.length
        if (evaluation.status === 'close' && !entry.unlocks.includes(evaluation.pattern.name)) {
          entry.unlocks.push(evaluation.pattern.name)
        }
        scores.set(key, entry)
      }
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score || b.unlocks.length - a.unlocks.length)
    .slice(0, limit)
}

/** Headline counts for the dashboard tiles. */
export function stashSummary(stash) {
  const ready = evaluateAll(stash).filter((e) => e.status === 'ready')
  return {
    craftable: ready.length,
    balls: stash.reduce((n, s) => n + (Number(s.quantity) || 0), 0),
    colors: new Set(stash.map((s) => colorFamily(s.color)).filter(Boolean)).size,
    empty: stash.filter((s) => s.status === 'empty').length,
    low: stash.filter((s) => s.status === 'low').length,
  }
}
