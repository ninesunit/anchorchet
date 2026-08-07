import { useMemo, useState } from 'react'

import { Button } from '../../components/ui/Button'
import { Field, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import { cx, overallAverage } from '../../lib/utils'

/** A single game at or above this is always worth a celebration. */
const BIG_GAME = 200

/**
 * Decides whether the Hype Button should be shouting.
 *
 * "Over a certain threshold" is relative, not absolute — beating her own
 * running average matters more than clearing an arbitrary number, so both
 * count, and the absolute one only kicks in at a genuinely good score.
 */
export function useHypeTrigger(sessions) {
  return useMemo(() => {
    const last = sessions[0]
    if (!last) return { hot: false, reason: '' }

    const scores = (last.game_scores || []).map(Number).filter((n) => !Number.isNaN(n))
    if (scores.length === 0) return { hot: false, reason: '' }

    // Average excluding the most recent session, so a great session doesn't
    // dilute the very benchmark it should be measured against.
    const baseline = overallAverage(sessions.slice(1))
    const best = Math.max(...scores)

    if (best >= BIG_GAME) {
      return { hot: true, reason: `She threw a ${best}. That is a big game.` }
    }
    if (baseline > 0 && last.session_average > baseline + 10) {
      return {
        hot: true,
        reason: `Session average ${last.session_average} — ${Math.round(
          last.session_average - baseline
        )} above her usual.`,
      }
    }
    if (last.type === 'tournament') {
      return { hot: true, reason: 'Tournament day. Say something.' }
    }
    return { hot: false, reason: '' }
  }, [sessions])
}

const PRESETS = [
  'That series was ridiculous. Genuinely.',
  'Watched every score come in. Proud of you.',
  'New personal best energy. Keep going.',
  'You made that look easy.',
  'Whatever you did in game 2 — do that again.',
]

export function HypeModal({ open, onClose, session }) {
  const { sendHype } = useData()
  const [message, setMessage] = useState(PRESETS[0])
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setMessage(PRESETS[0])
    setSent(false)
  }
  if (!open && wasOpen) setWasOpen(false)

  async function send() {
    setBusy(true)
    await sendHype({
      to: 'player1',
      from: 'player2',
      message: message.trim(),
      headline: 'Player 2 is hyping you',
      session_id: session?.id ?? null,
    })
    setBusy(false)
    setSent(true)
    setTimeout(onClose, 1400)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send the hype"
      subtitle={
        session
          ? `Series ${session.series_total} · average ${session.session_average}`
          : undefined
      }
      footer={
        sent ? null : (
          <>
            <Button variant="soft" full onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              full
              loading={busy}
              disabled={!message.trim()}
              onClick={send}
            >
              <Icon name="flame" size={18} filled />
              Fire it off
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-ember text-white">
            <Icon name="check" size={28} strokeWidth={3} />
          </span>
          <p className="mt-1 font-extrabold">Hype sent</p>
          <p className="max-w-xs text-[14px] leading-snug text-muted">
            Confetti drops across her screen the next time she opens the app.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          <div>
            <p className="mb-2 text-[13px] font-semibold">Pick one, or write your own</p>
            <div className="flex flex-col gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className={cx(
                    'rounded-xl border-2 px-3.5 py-2.5 text-left text-[14px] font-medium transition',
                    message === preset
                      ? 'border-ember bg-ember-soft/40 text-text'
                      : 'border-border bg-surface text-muted hover:border-border-strong'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <Field label="Your message" htmlFor="hype-message">
            <Textarea
              id="hype-message"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
          </Field>
        </div>
      )}
    </Modal>
  )
}
