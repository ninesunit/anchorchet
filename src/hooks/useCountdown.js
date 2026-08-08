import { useEffect, useState } from 'react'

import { toDate } from '../lib/utils'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (n) => String(n).padStart(2, '0')

/**
 * Live countdown to a target date.
 *
 * Accepts anything `toDate` understands — a Firestore Timestamp, a plain
 * {seconds} snapshot, a Date, or an ISO string — and ticks once a second for as
 * long as the target is in the future.
 *
 * It used to back off to once a minute when the event was more than a day away,
 * on the theory that a countdown three weeks out has no reason to re-render
 * 86,400 times. That was wrong in practice: the seconds box just sat there
 * frozen, which reads as a broken clock rather than a considered optimisation.
 * It always ticks per second now, and the cost is paid back the honest way —
 * the interval is torn down while the tab is hidden and again the moment the
 * target passes, so a phone in a pocket is doing nothing at all.
 *
 * @param {*} target
 * @returns {{
 *   days:number, hours:number, minutes:number, seconds:number,
 *   dd:string, hh:string, mm:string, ss:string,
 *   started:boolean, past:boolean, totalMs:number, sinceMs:number
 * } | null} null only when there is no usable date
 */
export function useCountdown(target) {
  const time = toDate(target)?.getTime() ?? null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (time === null) return

    // Resync on mount and whenever the target changes, so the first paint after
    // a route change is never a second stale.
    setNow(Date.now())

    let id = null
    const stop = () => {
      if (id !== null) {
        clearInterval(id)
        id = null
      }
    }
    const tick = () => {
      const t = Date.now()
      setNow(t)
      // Nothing left to count. Everything is clamped at zero from here, so the
      // interval has no more work to do.
      if (t >= time) stop()
    }
    const start = () => {
      if (id === null && Date.now() < time) id = setInterval(tick, SECOND)
    }

    // A backgrounded tab gets throttled by the browser anyway; dropping the
    // interval outright means an installed app left open overnight is not
    // holding a timer at all, and the resync on return covers the gap.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [time])

  if (time === null) return null

  const diff = time - now
  const started = diff <= 0
  // Clamped rather than negative: once it has started every box reads 00 and
  // the caller shows an "in progress" state instead of a countdown.
  const remaining = started ? 0 : diff

  const days = Math.floor(remaining / DAY)
  const hours = Math.floor((remaining % DAY) / HOUR)
  const minutes = Math.floor((remaining % HOUR) / MINUTE)
  const seconds = Math.floor((remaining % MINUTE) / SECOND)

  return {
    days,
    hours,
    minutes,
    seconds,
    // Pre-padded so no box changes width as it ticks from 10 to 9.
    dd: pad(days),
    hh: pad(hours),
    mm: pad(minutes),
    ss: pad(seconds),
    started,
    past: started,
    totalMs: remaining,
    sinceMs: started ? -diff : 0,
  }
}
