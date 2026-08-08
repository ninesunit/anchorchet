import { useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useCountdown } from '../../hooks/useCountdown'
import { useData } from '../../context/DataContext'
import { cx, daysUntil, formatDateLong, timeAgo } from '../../lib/utils'

const localDateValue = (d) => {
  const x = d ? new Date(d) : new Date()
  return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const localTimeValue = (d) => {
  const x = d ? new Date(d) : new Date()
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`
}

/** A tournament day runs long, so an event stays "on now" for this much of it. */
const IN_PROGRESS_WINDOW = 8 * 60 * 60 * 1000

/**
 * The event the "Next up" card should show.
 *
 * Not simply the next future one: a tournament that started two hours ago is
 * far more interesting than the one three weeks out, and the countdown card has
 * an in-progress state for exactly that. Shared by both dashboards and the
 * calendar tab so all three agree on what "next" means.
 *
 * @param {Array} events  ascending by date
 */
export function pickNextEvent(events) {
  const now = Date.now()
  const started = [...events]
    .reverse()
    .find((e) => {
      const t = e.date?.getTime?.() ?? 0
      return t <= now && now - t < IN_PROGRESS_WINDOW
    })
  return started ?? events.find((e) => (e.date?.getTime?.() ?? 0) > now)
}

export function BowlingCalendar({ readOnly = false }) {
  const { events, addEvent, updateEvent, removeEvent } = useData()

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { upcoming, past } = useMemo(() => {
    const now = Date.now()
    return {
      upcoming: events.filter((e) => (e.date?.getTime?.() ?? 0) >= now),
      past: events.filter((e) => (e.date?.getTime?.() ?? 0) < now).reverse(),
    }
  }, [events])

  const next = pickNextEvent(events)
  const alsoComing = upcoming.filter((e) => e.id !== next?.id)

  return (
    <div className="animate-fade-up">
      {next && <NextUpCard event={next} />}

      {events.length === 0 ? (
        <EmptyState
          icon={<Icon name="calendar" size={30} />}
          title="Nothing on the calendar"
          body={
            readOnly
              ? 'Once she adds a tournament date it shows up here with a countdown.'
              : 'Add your next tournament and the countdown starts running.'
          }
          action={
            !readOnly && (
              <Button variant="primary" onClick={() => setEditing({})}>
                <Icon name="plus" size={18} />
                Add event
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Filtered by id, not slice(1): the hero can be an event that has
              already started, in which case every upcoming one is still to come. */}
          {alsoComing.length > 0 && (
            <section className="mb-7">
              <SectionTitle>Also coming up</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {alsoComing.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onClick={readOnly ? undefined : () => setEditing(event)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <SectionTitle>Past events</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {past.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    past
                    onClick={readOnly ? undefined : () => setEditing(event)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {!readOnly && (
        <>
          <FabSpacer />

          <FloatingButton onClick={() => setEditing({})} aria-label="Add event">
            <Icon name="plus" size={26} strokeWidth={2.4} />
          </FloatingButton>

          <EventEditor
            event={editing}
            onClose={() => setEditing(null)}
            onSave={async (data) => {
              if (editing?.id) await updateEvent(editing.id, data)
              else await addEvent(data)
              setEditing(null)
            }}
            onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
          />

          <ConfirmDialog
            open={Boolean(confirmDelete)}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => {
              removeEvent(confirmDelete.id)
              setEditing(null)
            }}
            title="Delete this event?"
            body={`"${confirmDelete?.title}" will be removed from the calendar.`}
          />
        </>
      )}
    </div>
  )
}

export function NextUpCard({ event, compact = false }) {
  const countdown = useCountdown(event?.date)
  if (!event || !countdown) return null

  const days = daysUntil(event.date)

  return (
    <Card
      className={cx(
        'relative mb-6 overflow-hidden border-ember/40 p-4',
        // Warm gradient so the hero reads as the most important thing on screen
        'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--ember)_10%,transparent),transparent_65%)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ember">Next up</p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight">
            {event.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar" size={14} />
              {formatDateLong(event.date)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <Icon name="pin" size={14} />
                {event.location}
              </span>
            )}
          </p>
        </div>
        {countdown.started ? (
          <Badge tone="mint" dot>
            In progress
          </Badge>
        ) : (
          days !== null &&
          days <= 7 && (
            <Badge tone="ember" dot>
              {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
            </Badge>
          )
        )}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <CountUnit value={countdown.dd} label="days" dim={countdown.started} />
        <CountUnit value={countdown.hh} label="hrs" dim={countdown.started} />
        <CountUnit value={countdown.mm} label="min" dim={countdown.started} />
        <CountUnit value={countdown.ss} label="sec" dim={countdown.started} />
      </div>

      {countdown.started && (
        <p className="mt-2.5 flex items-center justify-center gap-2 text-[13px] font-bold text-mint">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-mint" />
          </span>
          Started {timeAgo(event.date)}
        </p>
      )}

      {!compact && (event.call_time || event.notes) && (
        <div className="mt-3.5 flex flex-col gap-2 border-t border-border pt-3">
          {event.call_time && (
            <p className="flex items-center gap-2 text-[13px]">
              <Icon name="clock" size={15} className="text-amber" />
              <span className="font-semibold">Call time {event.call_time}</span>
            </p>
          )}
          {event.notes && <p className="text-[13px] leading-snug text-muted">{event.notes}</p>}
        </div>
      )}
    </Card>
  )
}

function CountUnit({ value, label, dim = false }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-2 py-2.5 text-center">
      {/* value arrives pre-padded, and tabular-nums keeps every digit the same
          width — together that is what stops the boxes twitching as it ticks */}
      <p
        className={cx(
          'text-2xl font-extrabold tabular-nums leading-none',
          dim && 'text-faint'
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-faint">{label}</p>
    </div>
  )
}

function EventRow({ event, past = false, onClick }) {
  const days = daysUntil(event.date)
  const Tag = onClick ? 'button' : 'div'

  return (
    <Card
      as={Tag}
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={cx('flex w-full items-center gap-3 p-3.5 text-left', past && 'opacity-60')}
    >
      <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-surface-2">
        <span className="text-[10px] font-bold uppercase leading-none text-faint">
          {event.date?.toLocaleDateString(undefined, { month: 'short' })}
        </span>
        <span className="text-lg font-extrabold leading-none tabular-nums">
          {event.date?.getDate()}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-bold leading-tight">{event.title}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {event.location || 'Location TBC'}
          {event.call_time && ` · call ${event.call_time}`}
        </p>
      </div>

      {!past && days !== null && (
        <span className="shrink-0 text-[12px] font-bold text-faint">
          {days === 0 ? 'Today' : `${days}d`}
        </span>
      )}
    </Card>
  )
}

function EventEditor({ event, onClose, onSave, onDelete }) {
  const open = Boolean(event)
  const isEdit = Boolean(event?.id)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(localDateValue())
  const [time, setTime] = useState('09:00')
  const [location, setLocation] = useState('')
  const [callTime, setCallTime] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== event) {
    setSeed(event)
    setTitle(event.title || '')
    setDate(localDateValue(event.date))
    setTime(event.date ? localTimeValue(event.date) : '09:00')
    setLocation(event.location || '')
    setCallTime(event.call_time || '')
    setNotes(event.notes || '')
  }
  if (!open && seed !== null) setSeed(null)

  async function submit() {
    setBusy(true)
    const [y, m, d] = date.split('-').map(Number)
    const [hh, mm] = time.split(':').map(Number)
    await onSave({
      title: title.trim(),
      date: new Date(y, m - 1, d, hh || 0, mm || 0),
      location: location.trim(),
      call_time: callTime.trim(),
      notes: notes.trim(),
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event' : 'Add to calendar'}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete} aria-label="Delete event">
              <Icon name="trash" size={18} />
            </Button>
          )}
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" full loading={busy} disabled={!title.trim()} onClick={submit}>
            {isEdit ? 'Save' : 'Add event'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Event" htmlFor="event-title">
          <Input
            id="event-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Inter-Uni Round 2"
            autoCapitalize="words"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="event-date">
            <Input
              id="event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Start time" htmlFor="event-time">
            <Input
              id="event-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Location" htmlFor="event-location">
          <Input
            id="event-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Sunway Megalanes"
            autoCapitalize="words"
          />
        </Field>

        <Field label="Call time" hint="optional" htmlFor="event-call">
          <Input
            id="event-call"
            value={callTime}
            onChange={(e) => setCallTime(e.target.value)}
            placeholder="08:00"
          />
        </Field>

        <Field label="Notes" hint="optional" htmlFor="event-notes">
          <Textarea
            id="event-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Squad, what to pack, who's driving…"
          />
        </Field>
      </div>
    </Modal>
  )
}
