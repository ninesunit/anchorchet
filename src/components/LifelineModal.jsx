import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { Modal } from './ui/Modal'
import { useData } from '../context/DataContext'
import { cx } from '../lib/utils'

/**
 * The Executive Dysfunction Lifeline.
 *
 * For the specific failure where the task is not hard and she knows exactly
 * what to do and still cannot start. Nothing here nags or tracks: the three
 * options are his voice, his handwriting, and his phone number, and every one
 * of them is a way of lowering the bar rather than raising the stakes.
 *
 * Deliberately absent: any streak, any timer, any "you've opened this 4 times
 * today". Instrumenting a bad day makes it worse.
 */

const FALLBACK_SLIPS = [
  { id: 'fallback-1', text: 'Do it terribly. 50% effort counts today.' },
  { id: 'fallback-2', text: 'Just pick up three things, then stop. That is the whole job.' },
  { id: 'fallback-3', text: 'Set it down. It will still be there, and so will I.' },
]

export function LifelineButton({ onClick, className, label = 'Stuck?' }) {
  return (
    <button
      onClick={onClick}
      aria-label="Lifeline — stuck on this?"
      className={cx(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-mint/45 bg-mint-soft/35 px-2.5 text-[12px] font-bold text-mint transition active:scale-[0.97]',
        className
      )}
    >
      <Icon name="lifeline" size={15} strokeWidth={1.9} />
      {label}
    </button>
  )
}

export function LifelineModal({ open, onClose, task }) {
  const { breathingAudios, permissionSlips } = useData()
  const [tab, setTab] = useState(null)

  const audios = useMemo(
    () => breathingAudios.filter((a) => a.kind === 'lifeline' && a.audio_url),
    [breathingAudios]
  )
  const slips = permissionSlips.length > 0 ? permissionSlips : FALLBACK_SLIPS

  // A different slip and a different recording each time it opens, so it does
  // not become a thing she has memorised and stopped hearing.
  const [seed, setSeed] = useState(0)
  useEffect(() => {
    if (open) {
      setSeed(Math.random())
      setTab(null)
    }
  }, [open])

  const slip = slips[Math.floor(seed * slips.length) % slips.length]
  const audio = audios.length ? audios[Math.floor(seed * audios.length) % audios.length] : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Stuck on this?"
      subtitle={task?.title}
      size="sm"
      footer={
        <Button variant="soft" full onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-3 pb-2">
        <p className="text-[14px] leading-relaxed text-muted">
          Not a nudge. Pick whichever one you can actually take right now.
        </p>

        <AudioLifeline audio={audio} active={tab === 'audio'} onPlay={() => setTab('audio')} />

        <PermissionSlip slip={slip} onAnother={() => setSeed(Math.random())} />

        <CallAnchor />
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- option A -- */

function AudioLifeline({ audio, active, onPlay }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onEnd = () => setPlaying(false)
    el.addEventListener('ended', onEnd)
    return () => el.removeEventListener('ended', onEnd)
  }, [audio])

  // Stop the audio when the modal unmounts, or it keeps playing behind a
  // closed sheet.
  useEffect(() => () => ref.current?.pause(), [])

  if (!audio) {
    return (
      <Card tone="mint" icon="mic" title="Hear him say it">
        <p className="text-[13px] leading-snug text-muted">
          No lifeline recordings saved yet. Ask him to record one from his dashboard — thirty
          seconds of &ldquo;you can do a bad job of this&rdquo; in his own voice.
        </p>
      </Card>
    )
  }

  const toggle = () => {
    const el = ref.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      onPlay()
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  return (
    <Card tone="mint" icon="mic" title={audio.title || 'A word from him'} highlight={active}>
      <Button variant="mint" size="sm" className="mt-1" onClick={toggle}>
        <Icon name={playing ? 'pause' : 'play2'} size={16} />
        {playing ? 'Pause' : 'Play it'}
      </Button>
      <audio ref={ref} src={audio.audio_url} preload="none" className="hidden" />
    </Card>
  )
}

/* -------------------------------------------------------------- option B -- */

function PermissionSlip({ slip, onAnother }) {
  return (
    <Card tone="amber" icon="note" title="Permission slip">
      <p className="text-[16px] font-semibold leading-relaxed">&ldquo;{slip.text}&rdquo;</p>
      <button
        onClick={onAnother}
        className="mt-2 text-[12px] font-bold text-muted underline-offset-2 hover:underline"
      >
        Another one
      </button>
    </Card>
  )
}

/* -------------------------------------------------------------- option C -- */

function CallAnchor() {
  const { profile } = useAnchorContact()

  const tel = profile?.phone ? `tel:${profile.phone}` : null
  const sms = profile?.phone ? `sms:${profile.phone}` : null

  return (
    <Card tone="ember" icon="phone" title="Call him">
      {tel ? (
        <div className="mt-1 flex gap-2">
          <Button as="a" href={tel} variant="primary" size="sm">
            <Icon name="phone" size={15} />
            Call
          </Button>
          <Button as="a" href={sms} variant="soft" size="sm">
            Text
          </Button>
        </div>
      ) : (
        <p className="text-[13px] leading-snug text-muted">
          He has not saved a number yet — he can add one in Settings and this becomes a one-tap
          call.
        </p>
      )}
    </Card>
  )
}

/**
 * His contact details live on his own user document, which she can read but
 * not write. Looked up here rather than passed down so every caller of the
 * modal gets it for free.
 */
function useAnchorContact() {
  const { anchorProfile } = useData()
  return { profile: anchorProfile }
}

/* ----------------------------------------------------------------- shell -- */

const TONES = {
  mint: 'border-mint/40 bg-mint-soft/25 text-mint',
  amber: 'border-amber/40 bg-amber-soft/30 text-amber',
  ember: 'border-ember/35 bg-ember-soft/25 text-ember',
}

function Card({ tone, icon, title, children, highlight = false }) {
  return (
    <div
      className={cx(
        'rounded-2xl border p-3.5 transition',
        TONES[tone],
        highlight && 'ring-2 ring-current/25'
      )}
    >
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
        <Icon name={icon} size={15} />
        {title}
      </p>
      <div className="mt-1.5 text-text">{children}</div>
    </div>
  )
}
