import { useEffect, useState } from 'react'

import { toDate } from '../lib/utils'

const DAY = 86400000

/**
 * Live countdown to a target date. Ticks once a second while the target is
 * inside a day, then backs off to once a minute — a countdown three weeks out
 * has no reason to re-render 86,400 times.
 */
export function useCountdown(target) {
  const date = toDate(target)
  const time = date?.getTime() ?? null

  const [now, setNow] = useState(() => Date.now())

  // Recreated only when the target changes or we cross the one-day boundary,
  // not on every tick.
  const isNear = time !== null && time - now < DAY

  useEffect(() => {
    if (time === null || time <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), isNear ? 1000 : 60000)
    return () => clearInterval(id)
  }, [time, isNear])

  if (time === null) return null

  const diff = time - now
  const abs = Math.abs(diff)

  return {
    past: diff <= 0,
    days: Math.floor(abs / DAY),
    hours: Math.floor((abs % DAY) / 3600000),
    minutes: Math.floor((abs % 3600000) / 60000),
    seconds: Math.floor((abs % 60000) / 1000),
    totalMs: diff,
  }
}
