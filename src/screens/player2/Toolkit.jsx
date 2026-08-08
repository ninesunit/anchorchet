import { useState } from 'react'

import { Badge } from '../../components/ui/Badge'
import { Button, FabSpacer } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import { MAX_SECONDS, useRecorder } from '../../hooks/useRecorder'
import { uploadMedia } from '../../lib/media'
import { cx, timeAgo } from '../../lib/utils'

/**
 * Everything the Anchor records or writes for her ahead of time.
 *
 * The whole premise is that the worst moment is the wrong moment to be asking
 * for help — so this is where he puts it in place beforehand, calmly, on a
 * normal Tuesday. Two kinds of recording, because they are for two different
 * bad states: grounding notes play during a panic episode, lifeline notes play
 * when she is stuck on a task and cannot start.
 */

const KINDS = {
  grounding: {
    id: 'grounding',
    label: 'Grounding',
    blurb: 'Plays on a loop when she taps Anchor mid-panic. Slow, low, unhurried.',
    prompt: '"I\'m here. You\'re not in danger. Breathe with the circle."',
    tone: 'mint',
  },
  lifeline: {
    id: 'lifeline',
    label: 'Lifeline',
    blurb: 'Plays when she is frozen in front of a task. Permission, not motivation.',
    prompt: '"Just pick up three things and stop. That counts."',
    tone: 'amber',
  },
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Toolkit() {
  const {
    breathingAudios,
    permissionSlips,
    addBreathingAudio,
    removeBreathingAudio,
    addPermissionSlip,
    removePermissionSlip,
  } = useData()

  const [recording, setRecording] = useState(null) // kind id
  const [writing, setWriting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const byKind = (kind) => breathingAudios.filter((a) => (a.kind ?? 'grounding') === kind)

  return (
    <div className="animate-fade-up">
      <Card className="mb-6 flex items-start gap-3 border-mint/35 bg-mint-soft/20 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint text-[#05231f]">
          <Icon name="anchor" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-bold leading-tight">Put it in place before she needs it</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            When she is mid-panic or stuck on a chore, that is the worst possible moment to have
            to ask. Record it now and it is already waiting.
          </p>
        </div>
      </Card>

      {Object.values(KINDS).map((kind) => {
        const rows = byKind(kind.id)
        return (
          <section key={kind.id} className="mb-7">
            <SectionTitle
              action={
                <button
                  onClick={() => setRecording(kind.id)}
                  className="text-[13px] font-bold text-muted hover:text-text"
                >
                  Record
                </button>
              }
            >
              {kind.label} notes
            </SectionTitle>
            <p className="-mt-2 mb-3 text-[12px] leading-snug text-faint">{kind.blurb}</p>

            {rows.length === 0 ? (
              <EmptyState
                icon={<Icon name="mic" size={26} />}
                title={`No ${kind.label.toLowerCase()} notes yet`}
                body={kind.prompt}
                action={
                  <Button variant="primary" onClick={() => setRecording(kind.id)}>
                    <Icon name="mic" size={17} />
                    Record one
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {rows.map((audio) => (
                  <AudioRow
                    key={audio.id}
                    audio={audio}
                    tone={kind.tone}
                    onDelete={() => setConfirmDelete(audio)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      <section>
        <SectionTitle
          action={
            <button
              onClick={() => setWriting(true)}
              className="text-[13px] font-bold text-muted hover:text-text"
            >
              Write one
            </button>
          }
        >
          Permission slips
        </SectionTitle>
        <p className="-mt-2 mb-3 text-[12px] leading-snug text-faint">
          One sentence, in your words, lowering the bar. She gets a random one each time she taps
          the lifeline.
        </p>

        {permissionSlips.length === 0 ? (
          <EmptyState
            icon={<Icon name="note" size={26} />}
            title="Using the defaults"
            body='She will see stock ones like "Do it terribly. 50% effort counts today." until you write your own.'
            action={
              <Button variant="primary" onClick={() => setWriting(true)}>
                <Icon name="plus" size={17} />
                Write one
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
            {permissionSlips.map((slip) => (
              <Card key={slip.id} className="flex items-start gap-3 p-3.5">
                <Icon name="note" size={17} className="mt-0.5 shrink-0 text-amber" />
                <p className="min-w-0 flex-1 text-[14px] leading-snug">{slip.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePermissionSlip(slip.id)}
                  aria-label="Delete slip"
                >
                  <Icon name="trash" size={16} />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <FabSpacer />

      <RecorderModal
        kind={recording ? KINDS[recording] : null}
        onClose={() => setRecording(null)}
        onSave={async ({ title, blob, seconds }) => {
          const { url } = await uploadMedia(blob, {
            folder: 'breathing_audios',
            contentType: blob.type,
          })
          await addBreathingAudio({
            title,
            audio_url: url,
            kind: recording,
            duration_sec: seconds,
          })
          setRecording(null)
        }}
      />

      <SlipModal
        open={writing}
        onClose={() => setWriting(false)}
        onSave={async (text) => {
          await addPermissionSlip({ text })
          setWriting(false)
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeBreathingAudio(confirmDelete.id)}
        title="Delete this recording?"
        body={`"${confirmDelete?.title}" will stop playing for her.`}
      />
    </div>
  )
}

/* ------------------------------------------------------------- audio row -- */

function AudioRow({ audio, tone, onDelete }) {
  const [playing, setPlaying] = useState(false)
  const [el, setEl] = useState(null)

  const toggle = () => {
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  return (
    <Card className="flex items-center gap-3 p-3.5">
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Play'}
        className={cx(
          'grid size-11 shrink-0 place-items-center rounded-full transition active:scale-95',
          tone === 'mint' ? 'bg-mint text-[#05231f]' : 'bg-amber text-[#2a1a00]'
        )}
      >
        <Icon name={playing ? 'pause' : 'play2'} size={19} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold leading-tight">{audio.title}</p>
        <p className="mt-0.5 text-[12px] text-faint">
          {audio.duration_sec ? `${fmt(audio.duration_sec)} · ` : ''}
          {timeAgo(audio.created_at)}
        </p>
      </div>

      <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete recording">
        <Icon name="trash" size={16} />
      </Button>

      <audio
        ref={setEl}
        src={audio.audio_url}
        preload="none"
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </Card>
  )
}

/* -------------------------------------------------------------- recorder -- */

function RecorderModal({ kind, onClose, onSave }) {
  const rec = useRecorder()
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const open = Boolean(kind)
  const [seed, setSeed] = useState(null)
  if (open && seed !== kind) {
    setSeed(kind)
    setTitle('')
    setSaveError(null)
    rec.reset()
  }
  if (!open && seed !== null) setSeed(null)

  const pct = Math.min(100, (rec.seconds / MAX_SECONDS) * 100)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record a ${kind?.label.toLowerCase() ?? ''} note`}
      subtitle={kind?.prompt}
      size="sm"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="mint"
            full
            loading={busy}
            disabled={rec.state !== 'done' || !rec.blob}
            onClick={async () => {
              setBusy(true)
              setSaveError(null)
              try {
                await onSave({
                  title: title.trim() || `${kind.label} note`,
                  blob: rec.blob,
                  seconds: rec.seconds,
                })
              } catch (err) {
                setSaveError(err?.message || 'Could not save that recording.')
              }
              setBusy(false)
            }}
          >
            Save it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {!rec.supported && (
          <p className="rounded-xl border border-amber/45 bg-amber-soft/35 px-3.5 py-3 text-[13px] leading-snug">
            This browser cannot record audio. Safari on iOS 14.3 or later, or any recent Chrome,
            can.
          </p>
        )}

        <div className="rounded-2xl border border-border bg-surface-2/60 p-5 text-center">
          <p className="text-4xl font-extralight tabular-nums leading-none">
            {fmt(rec.seconds)}
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-faint">
            {rec.state === 'recording'
              ? 'Recording'
              : rec.state === 'done'
                ? 'Have a listen'
                : `Up to ${MAX_SECONDS} seconds`}
          </p>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
            <div
              className={cx(
                'h-full rounded-full transition-[width] duration-200',
                pct > 85 ? 'bg-ember' : 'bg-mint'
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-4 flex justify-center">
            {rec.state === 'recording' ? (
              <button
                onClick={rec.stop}
                aria-label="Stop recording"
                className="grid size-16 place-items-center rounded-full bg-ember text-white shadow-pop transition active:scale-95"
              >
                <Icon name="stop" size={26} filled />
              </button>
            ) : (
              <button
                onClick={rec.state === 'done' ? rec.reset : rec.start}
                disabled={!rec.supported}
                aria-label={rec.state === 'done' ? 'Record again' : 'Start recording'}
                className="grid size-16 place-items-center rounded-full bg-mint text-[#05231f] shadow-pop transition active:scale-95 disabled:opacity-40"
              >
                <Icon name="mic" size={26} />
              </button>
            )}
          </div>

          {rec.state === 'done' && (
            <>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio src={rec.url} controls className="mt-4 w-full" />
              <button
                onClick={rec.reset}
                className="mt-2 text-[12px] font-bold text-muted underline-offset-2 hover:underline"
              >
                Record it again
              </button>
            </>
          )}
        </div>

        {rec.error && (
          <p className="rounded-xl border border-ember/45 bg-ember-soft/30 px-3.5 py-3 text-[13px] leading-snug">
            {rec.error}
          </p>
        )}
        {saveError && (
          <p className="rounded-xl border border-ember/45 bg-ember-soft/30 px-3.5 py-3 text-[13px] leading-snug">
            {saveError}
          </p>
        )}

        <Field label="Name it" hint="she sees this" htmlFor="rec-title">
          <Input
            id="rec-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind?.id === 'lifeline' ? 'Three things then stop' : 'Just breathe'}
            autoCapitalize="sentences"
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------------ slip -- */

function SlipModal({ open, onClose, onSave }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setText('')
  }
  if (!open && wasOpen) setWasOpen(false)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write a permission slip"
      size="sm"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!text.trim()}
            onClick={async () => {
              setBusy(true)
              await onSave(text.trim())
              setBusy(false)
            }}
          >
            Save it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="What do you want to tell her?" htmlFor="slip-text">
          <Textarea
            id="slip-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Do it terribly. 50% effort counts today."
            autoCapitalize="sentences"
          />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {[
            'Do it terribly. 50% effort counts today.',
            'Just pick up three things, then stop.',
            'Set a timer for five minutes. That is the whole ask.',
            'Leaving it is allowed. So is doing it badly.',
          ].map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-left text-[12px] font-semibold text-muted transition hover:text-text"
            >
              {s}
            </button>
          ))}
        </div>
        <Badge tone="amber" className="self-start">
          Shown at random
        </Badge>
      </div>
    </Modal>
  )
}
