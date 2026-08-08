import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Icon } from './ui/Icon'
import { useData } from '../context/DataContext'
import { cx } from '../lib/utils'

/**
 * The Anchor Protocol.
 *
 * A full-screen, deliberately dark, deliberately slow place to land during a
 * panic episode. Everything on it is subtractive: no navigation, no counters
 * counting up, no badges, nothing that can be got wrong. One circle, one line
 * of text, and his voice.
 *
 * 4-7-8 breathing: in for four, hold for seven, out for eight. The phase
 * lengths are the whole point of the exercise, so the circle is driven off the
 * same numbers rather than an approximation that looks about right.
 */
const PHASES = [
  { id: 'in', label: 'Breathe in', seconds: 4, scale: 1 },
  { id: 'hold', label: 'Hold', seconds: 7, scale: 1 },
  { id: 'out', label: 'Breathe out', seconds: 8, scale: 0.45 },
]

const CYCLE_SECONDS = PHASES.reduce((n, p) => n + p.seconds, 0)

export function AnchorProtocol({ open, onClose }) {
  const { breathingAudios } = useData()
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)

  const grounding = useMemo(
    () => breathingAudios.filter((a) => (a.kind ?? 'grounding') === 'grounding' && a.audio_url),
    [breathingAudios]
  )

  /**
   * Which recording plays.
   *
   * Picked once per opening rather than per render, so it does not swap
   * mid-breath. Random on purpose: hearing the identical sentence every single
   * time turns his voice into a ringtone, and the point is that it should feel
   * like him being there.
   */
  const [pickedId, setPickedId] = useState(null)
  const picked = grounding.find((a) => a.id === pickedId) ?? null

  useEffect(() => {
    if (!open) {
      setPickedId(null)
      return
    }
    if (grounding.length === 0) return
    setPickedId((current) => {
      if (current && grounding.some((a) => a.id === current)) return current
      return grounding[Math.floor(Math.random() * grounding.length)].id
    })
  }, [open, grounding])

  /* -------------------------------------------------------------- timer -- */
  useEffect(() => {
    if (!open) {
      setElapsed(0)
      return
    }
    const startedAt = Date.now()
    const id = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 100)
    return () => clearInterval(id)
  }, [open])

  /* -------------------------------------------------------------- audio -- */
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!open || muted || !picked) {
      el.pause()
      return
    }
    // The panic button is itself a user gesture, which is what lets this play
    // at all — iOS blocks audio that is not traceable to a tap. If it is
    // blocked anyway, staying silent is fine; the breathing still works.
    el.volume = 0.9
    el.play().catch(() => {})
  }, [open, muted, picked])

  /* --------------------------------------------- escape hatch + scroll -- */
  const close = useCallback(() => {
    audioRef.current?.pause()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  if (!open) return null

  /* -------------------------------------------------------------- phase -- */
  const inCycle = elapsed % CYCLE_SECONDS
  let acc = 0
  let phase = PHASES[0]
  let phaseElapsed = 0
  for (const p of PHASES) {
    if (inCycle < acc + p.seconds) {
      phase = p
      phaseElapsed = inCycle - acc
      break
    }
    acc += p.seconds
  }
  const remaining = Math.ceil(phase.seconds - phaseElapsed)
  const cycles = Math.floor(elapsed / CYCLE_SECONDS)

  return createPortal(
    <div
      className="anchor-protocol fixed inset-0 z-[90] flex flex-col items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Grounding"
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] grid size-11 place-items-center rounded-full text-white/45 transition hover:text-white/80"
      >
        <Icon name="close" size={22} />
      </button>

      {picked && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top,0px))] flex min-h-11 items-center gap-2 rounded-full px-3 text-[13px] font-semibold text-white/45 transition hover:text-white/80"
        >
          <Icon name={muted ? 'volumeOff' : 'volume'} size={19} />
          <span className="max-w-32 truncate">{muted ? 'Muted' : picked.title}</span>
        </button>
      )}

      {/* the circle */}
      <div className="relative grid size-72 place-items-center sm:size-80">
        <span
          className="absolute inset-0 rounded-full bg-[#4fd1c5]/10 blur-2xl"
          style={{
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.seconds}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
        <span
          className="absolute inset-4 rounded-full border border-[#4fd1c5]/25"
          style={{
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.seconds}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
        <span
          className="absolute inset-8 rounded-full bg-gradient-to-b from-[#4fd1c5]/30 to-[#4fd1c5]/5"
          style={{
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.seconds}s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        />
        <div className="relative text-center">
          <p className="text-[26px] font-light tracking-wide text-white/90">{phase.label}</p>
          <p className="mt-1 text-6xl font-extralight tabular-nums text-white/70">{remaining}</p>
        </div>
      </div>

      <p className="mt-10 max-w-xs text-center text-[15px] leading-relaxed text-white/45">
        {picked
          ? 'That is him. Nothing to do but breathe with the circle.'
          : 'In for four, hold for seven, out for eight. Nothing else to do.'}
      </p>

      {cycles > 0 && (
        <p className="mt-3 text-[13px] text-white/25">
          {cycles} round{cycles === 1 ? '' : 's'}
        </p>
      )}

      {grounding.length === 0 && (
        <p className="mt-6 max-w-xs text-center text-[12px] leading-snug text-white/25">
          No voice notes saved yet — ask him to record one from his dashboard and it will play
          here next time.
        </p>
      )}

      <button
        onClick={close}
        className="mt-10 min-h-11 rounded-full border border-white/15 px-6 text-[14px] font-semibold text-white/55 transition hover:border-white/30 hover:text-white/85"
      >
        I&rsquo;m okay
      </button>

      {picked && (
        <audio
          ref={audioRef}
          src={picked.audio_url}
          loop
          preload="auto"
          className="hidden"
        />
      )}
    </div>,
    document.body
  )
}

/** The button itself — calm, unlabelled-ish, and always in the same place. */
export function AnchorProtocolButton({ onClick, variant = 'tab' }) {
  if (variant === 'rail') {
    return (
      <button
        onClick={onClick}
        aria-label="Anchor — grounding"
        className={cx(
          'mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition',
          'justify-center xl:justify-start',
          'text-mint hover:bg-mint-soft/40'
        )}
      >
        <Icon name="anchor" size={22} strokeWidth={1.9} />
        <span className="hidden text-[14px] xl:block">Anchor</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-label="Anchor — grounding"
      className="flex min-h-[52px] flex-1 flex-col items-center gap-1 pb-1.5 pt-2 text-mint transition"
    >
      <Icon name="anchor" size={23} strokeWidth={1.9} />
      <span className="text-[10px] font-bold tracking-tight">Anchor</span>
    </button>
  )
}
