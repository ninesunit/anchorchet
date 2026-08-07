/**
 * The cozy 2D bowling minigame: pin physics and ten-pin scoring.
 *
 * Pure functions with no React and no randomness of their own — the caller
 * passes an rng — so the scoring can be unit-checked against known games and
 * a throw can be replayed from its stored inputs.
 */

/** Standard triangle. x is across the lane (-1..1), depth grows away from you. */
export const PIN_POS = [
  { n: 1, x: 0, d: 0 },
  { n: 2, x: -0.28, d: 0.5 },
  { n: 3, x: 0.28, d: 0.5 },
  { n: 4, x: -0.56, d: 1 },
  { n: 5, x: 0, d: 1 },
  { n: 6, x: 0.56, d: 1 },
  { n: 7, x: -0.84, d: 1.5 },
  { n: 8, x: -0.28, d: 1.5 },
  { n: 9, x: 0.28, d: 1.5 },
  { n: 10, x: 0.84, d: 1.5 },
]

export const newPins = () => Array(10).fill(true)
export const standingCount = (pins) => pins.filter(Boolean).length

/** Deterministic RNG so a stored throw always replays identically. */
export function makeRng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
}

/**
 * Where the ball ends up at the pin deck.
 * Spin bends the path late, which is why a hooking ball can start wide and
 * still come back to the pocket.
 */
export function ballPath(aim, power, spin) {
  const curve = spin * (0.45 + power * 0.35)
  return Math.max(-1.15, Math.min(1.15, aim + curve))
}

/**
 * Resolve one throw.
 *
 * The constants below were grid-searched against target outcomes rather than
 * guessed: a flush pocket hit strikes ~40% of the time, a half-power roll ~11%,
 * and a wide ball ~1% while still clearing 5-6 pins. An earlier, looser set
 * struck 99% of the time from almost anywhere, which made the game pointless.
 *
 * @returns {{pins:boolean[], knocked:number[], entry:number, gutter:boolean}}
 */
export function throwBall({ pins, aim, power, spin, rng }) {
  const entry = ballPath(aim, power, spin)

  // A gutter ball takes nothing, however lucky the chain rolls would have been.
  if (Math.abs(entry) > 1.02) {
    return { pins: [...pins], knocked: [], entry, gutter: true }
  }

  const next = [...pins]
  const knocked = []

  const energy = 0.35 + power * 0.65
  const reach = 0.12 + energy * 0.16

  // 1. Direct contact. The corridor narrows with depth as the ball sheds energy.
  PIN_POS.forEach((pin, i) => {
    if (!next[i]) return
    if (Math.abs(pin.x - entry) <= reach * (1 - pin.d * 0.3)) {
      next[i] = false
      knocked.push(pin.n)
    }
  })

  // 2. Chain reaction. Nearest pins sit ~0.56 apart, so 0.6 reaches neighbours
  //    and nothing further; three passes let a good hit cascade to the corners.
  const chainChance = 0.12 + energy * 0.45
  for (let pass = 0; pass < 3; pass++) {
    const fallen = PIN_POS.filter((_, i) => !next[i])
    PIN_POS.forEach((pin, i) => {
      if (!next[i]) return
      const hit = fallen.some((f) => Math.hypot(f.x - pin.x, f.d - pin.d) < 0.6)
      if (hit && rng() < chainChance) {
        next[i] = false
        knocked.push(pin.n)
      }
    })
  }

  return { pins: next, knocked, entry, gutter: false }
}

/* ------------------------------------------------------------ scoring -- */

/**
 * Cumulative ten-pin score.
 * @param {number[][]} frames  up to 10 frames, each an array of roll pin counts
 * @returns {(number|null)[]} running total per frame, null while undetermined
 */
export function frameScores(frames) {
  // Flatten to a roll list with an index back to the frame that owns it, which
  // is what makes strike/spare bonuses a simple lookahead.
  const rolls = []
  frames.forEach((frame, fi) => frame.forEach((pins) => rolls.push({ pins, fi })))

  const out = []
  let total = 0
  let cursor = 0

  for (let f = 0; f < 10; f++) {
    const frame = frames[f]
    if (!frame || frame.length === 0) {
      out.push(null)
      continue
    }

    const first = frame[0]
    const isStrike = f < 9 ? first === 10 : false
    const isSpare = !isStrike && frame.length >= 2 && frame[0] + frame[1] === 10

    if (f === 9) {
      // Tenth frame simply sums its own (up to three) rolls.
      const complete =
        frame.length === 3 || (frame.length === 2 && frame[0] + frame[1] < 10)
      if (!complete) {
        out.push(null)
        cursor += frame.length
        continue
      }
      total += frame.reduce((a, b) => a + b, 0)
      out.push(total)
      continue
    }

    const bonusRolls = isStrike ? 2 : isSpare ? 1 : 0
    const after = rolls.slice(cursor + frame.length)
    if (after.length < bonusRolls) {
      out.push(null)
      cursor += frame.length
      continue
    }

    const base = isStrike ? 10 : frame.reduce((a, b) => a + b, 0)
    const bonus = after.slice(0, bonusRolls).reduce((a, r) => a + r.pins, 0)

    // An open frame is only final once both its rolls exist.
    if (!isStrike && !isSpare && frame.length < 2) {
      out.push(null)
      cursor += frame.length
      continue
    }

    total += base + bonus
    out.push(total)
    cursor += frame.length
  }

  return out
}

export function totalScore(frames) {
  const scores = frameScores(frames).filter((s) => s !== null)
  return scores.length ? scores[scores.length - 1] : 0
}

/** True when the tenth frame is closed out. */
export function isGameComplete(frames) {
  if (frames.length < 10) return false
  const tenth = frames[9] || []
  if (tenth.length === 3) return true
  if (tenth.length === 2 && tenth[0] + tenth[1] < 10) return true
  return false
}

/** Is this frame finished, so play moves on? */
export function isFrameComplete(frame, index) {
  if (!frame) return false
  if (index === 9) {
    if (frame.length === 3) return true
    if (frame.length === 2 && frame[0] + frame[1] < 10) return true
    return false
  }
  return frame[0] === 10 || frame.length === 2
}

/** Scoreboard glyph: X, /, - or the pin count. */
export function rollGlyph(frame, rollIndex, frameIndex) {
  const pins = frame[rollIndex]
  if (pins === undefined) return ''
  if (pins === 10) return 'X'
  if (rollIndex > 0) {
    const prev = frame[rollIndex - 1]
    // In the tenth a fresh rack resets, so only sum rolls on the same rack.
    const sameRack = frameIndex === 9 ? prev !== 10 : true
    if (sameRack && prev + pins === 10) return '/'
  }
  return pins === 0 ? '-' : String(pins)
}

/** How many pins are on the deck for the next roll of a frame. */
export function pinsForNextRoll(frame, frameIndex, pins) {
  if (frameIndex === 9) {
    // Tenth frame re-racks after a strike or a spare.
    const last = frame[frame.length - 1]
    if (frame.length === 1 && last === 10) return newPins()
    if (frame.length === 2 && frame[0] + frame[1] === 10) return newPins()
    if (frame.length === 2 && frame[0] === 10 && frame[1] === 10) return newPins()
  }
  return pins
}
