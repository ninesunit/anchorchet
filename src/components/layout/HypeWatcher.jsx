import { useEffect, useRef, useState } from 'react'

import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { notify } from '../../lib/notify'
import { Confetti } from '../ui/Confetti'
import { Icon } from '../ui/Icon'

/**
 * Watches for hype the current player hasn't seen yet and cashes it in:
 * confetti over the whole app plus a banner with Player 2's message.
 *
 * Mounted once in the shell so it fires on whichever screen she happens to
 * open — which is the point of the Hype Button. The event is marked seen only
 * after the animation finishes, so closing the app mid-confetti replays it.
 */
export function HypeWatcher() {
  const { role } = useAuth()
  const { hype, markHypeSeen, sessions } = useData()

  const [active, setActive] = useState(null)
  const seenSessions = useRef(null)

  /* -------------------------------------------------- inbound hype ----- */
  useEffect(() => {
    if (active || !role) return
    const next = hype.find((h) => !h.seen && h.to === role)
    if (next) setActive(next)
  }, [hype, role, active])

  /* -------------------------------- new score notification for P2 ------ */
  useEffect(() => {
    if (role !== 'player2') return

    const ids = new Set(sessions.map((s) => s.id))
    // First pass just records the baseline — otherwise every existing session
    // would fire a notification on page load.
    if (seenSessions.current === null) {
      seenSessions.current = ids
      return
    }

    const fresh = sessions.filter((s) => !seenSessions.current.has(s.id))
    seenSessions.current = ids

    for (const s of fresh) {
      const scores = s.game_scores || []
      if (scores.length === 0) continue
      notify(`She just bowled ${s.series_total}`, {
        body: `${scores.join(' · ')} — avg ${s.session_average} at ${s.location || 'the lanes'}`,
        tag: `session-${s.id}`,
      })
    }
  }, [sessions, role])

  return (
    <>
      <Confetti
        run={Boolean(active)}
        onDone={() => {
          if (active) markHypeSeen(active.id)
          setActive(null)
        }}
      />
      {active && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[61] flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
          <div className="animate-fade-up flex max-w-sm items-start gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 shadow-pop">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-ember text-white">
              <Icon name="flame" size={18} filled />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-ember">
                {active.headline || 'Player 2 is hyping you'}
              </p>
              <p className="mt-0.5 text-[14px] leading-snug text-text">{active.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
