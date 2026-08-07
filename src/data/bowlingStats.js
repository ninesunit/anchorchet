/**
 * Per-ball and per-lane-condition analytics.
 *
 * Attribution note: scores are logged per *session*, not per throw, so a
 * session's games are credited to every ball listed on it. With one ball that
 * is exact; with two it means "your average in sessions where this ball was in
 * play". The UI says so rather than implying per-throw precision, and
 * `soloSessions` is tracked so a clean number can be preferred when it exists.
 */

import { OIL_ORDER, OIL_PATTERNS } from './arsenal'
import { round1 } from '../lib/utils'

/** Minimum sessions before a recommendation is worth making. */
export const MIN_SESSIONS = 2

const games = (s) => (s.game_scores || []).map(Number).filter((n) => !Number.isNaN(n))

function blank() {
  return { games: 0, pins: 0, sessions: 0, soloSessions: 0, best: 0 }
}

function fold(acc, session) {
  const g = games(session)
  if (!g.length) return acc
  acc.games += g.length
  acc.pins += g.reduce((a, b) => a + b, 0)
  acc.sessions += 1
  if ((session.ball_ids || []).length === 1) acc.soloSessions += 1
  acc.best = Math.max(acc.best, ...g)
  return acc
}

const finish = (acc) => ({
  ...acc,
  average: acc.games ? round1(acc.pins / acc.games) : 0,
})

/** Stats for every ball in the arsenal, best average first. */
export function ballStats(sessions, arsenal) {
  const byBall = new Map(arsenal.map((b) => [b.id, blank()]))

  for (const session of sessions) {
    for (const id of session.ball_ids || []) {
      if (byBall.has(id)) fold(byBall.get(id), session)
    }
  }

  return arsenal
    .map((ball) => ({ ball, ...finish(byBall.get(ball.id)) }))
    .sort((a, b) => b.average - a.average || b.games - a.games)
}

/** Average per (ball, oil pattern) pair — the raw grid behind the matcher. */
export function oilMatrix(sessions, arsenal) {
  const key = (ballId, oil) => `${ballId}|${oil}`
  const cells = new Map()

  for (const session of sessions) {
    const oil = OIL_PATTERNS[session.oil_pattern] ? session.oil_pattern : 'unknown'
    for (const id of session.ball_ids || []) {
      const k = key(id, oil)
      if (!cells.has(k)) cells.set(k, blank())
      fold(cells.get(k), session)
    }
  }

  return {
    get: (ballId, oil) => {
      const c = cells.get(key(ballId, oil))
      return c ? finish(c) : null
    },
    /** Every oil pattern that actually has data, in dry -> heavy order. */
    patternsUsed: OIL_ORDER.filter((oil) =>
      arsenal.some((b) => cells.has(key(b.id, oil)))
    ),
  }
}

/**
 * "On Heavy Oil, your best average is 212 with The Purple Gem."
 * Only returns a pick where the sample is big enough to mean something.
 */
export function oilRecommendations(sessions, arsenal) {
  const matrix = oilMatrix(sessions, arsenal)

  return OIL_ORDER.map((oil) => {
    const ranked = arsenal
      .map((ball) => ({ ball, stat: matrix.get(ball.id, oil) }))
      .filter((r) => r.stat && r.stat.games > 0)
      .sort((a, b) => b.stat.average - a.stat.average)

    const top = ranked[0]
    return {
      oil: OIL_PATTERNS[oil],
      best: top || null,
      runnerUp: ranked[1] || null,
      // A single session is an anecdote, not a pattern.
      confident: Boolean(top && top.stat.sessions >= MIN_SESSIONS),
      contenders: ranked.length,
    }
  }).filter((r) => r.best)
}

/**
 * Spare conversion. Tracked per session as converted/attempts, which is the
 * most she can realistically tally between frames at a tournament.
 */
export function spareStats(sessions, ballId = null) {
  let converted = 0
  let attempts = 0
  let counted = 0

  for (const s of sessions) {
    if (ballId && !(s.ball_ids || []).includes(ballId)) continue
    const a = Number(s.spare_attempts) || 0
    const c = Number(s.spares_converted) || 0
    if (a <= 0) continue
    attempts += a
    converted += Math.min(c, a)
    counted += 1
  }

  return {
    converted,
    attempts,
    sessions: counted,
    rate: attempts ? Math.round((converted / attempts) * 100) : null,
  }
}

/** Headline numbers for the arsenal screen. */
export function arsenalSummary(sessions, arsenal) {
  const stats = ballStats(sessions, arsenal)
  const used = stats.filter((s) => s.games > 0)
  return {
    balls: arsenal.length,
    tracked: used.length,
    bestBall: used[0] || null,
    untracked: arsenal.length - used.length,
  }
}

/* ---------------------------------------------------- benchmark engine -- */

/** Highest possible single game — used to flag an unreachable catch-up target. */
export const MAX_GAME = 300

/**
 * The benchmark every series is measured against. Fixed at 200 rather than
 * per-session: it is the number she is actually chasing, and a per-session
 * field made the comparison between sessions meaningless.
 */
export const BENCHMARK = 200

/**
 * Where she stands against a per-game benchmark across a series.
 *
 * The target is cumulative: a 200 benchmark over 2 games is 400, so 386 pins is
 * "under 14". `needNext` is what the next game must be to pull the whole series
 * back to level, which is the number she actually wants mid-series.
 */
export function benchmarkStanding(scores, benchmark = BENCHMARK) {
  const games = (scores || []).map(Number).filter((n) => !Number.isNaN(n))
  const target = Number(benchmark) || 0
  if (!target) return null

  const played = games.length
  const pins = games.reduce((a, b) => a + b, 0)
  const targetSoFar = target * played
  const diff = pins - targetSoFar
  const needNext = target * (played + 1) - pins

  return {
    played,
    pins,
    benchmark: target,
    targetSoFar,
    // Positive is over the benchmark, negative is under.
    diff,
    needNext,
    // 300 is the ceiling; past that the series cannot be rescued in one game.
    reachable: needNext <= MAX_GAME,
    // Already over the benchmark. Note this is not the same as needNext <= 0,
    // which would mean she could bowl a zero and still hold the average.
    ahead: diff > 0,
    // A cushion big enough that the next game genuinely cannot drop her under.
    banked: needNext <= 0,
  }
}
