import { useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge'
import { Button, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Field, Input, Segmented, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Sparkline } from '../../components/ui/Sparkline'
import { PixelBall } from '../../components/PixelBall'
import { useData } from '../../context/DataContext'
import { OIL_ORDER, OIL_PATTERNS, ROLES } from '../../data/arsenal'
import { benchmarkStanding } from '../../data/bowlingStats'
import {
  cx,
  formatDateLong,
  overallAverage,
  personalBest,
  seriesTotal,
  sessionAverage,
} from '../../lib/utils'

/**
 * Is this session still being bowled?
 *
 * Driven by an explicit status rather than the date. Dating alone had two
 * problems: a session could never be closed early, and one running past
 * midnight lost its live card mid-tournament — precisely when she is still
 * bowling. Sessions saved before this field existed fall back to the old
 * date check so nothing in history suddenly reopens.
 */
const isLive = (session) => {
  if (!session) return false
  if (session.status === 'ended') return false
  if (session.status === 'live') return true
  return isToday(session.date)
}

const isToday = (d) => {
  if (!d) return false
  const a = new Date(d)
  const b = new Date()
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

const localDateValue = (d) => {
  const x = d ? new Date(d) : new Date()
  const off = x.getTimezoneOffset()
  return new Date(x.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function BowlingSessions() {
  const { sessions, arsenal, addSession, updateSession, removeSession } = useData()

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [justEnded, setJustEnded] = useState(null)

  const stats = useMemo(
    () => ({
      average: overallAverage(sessions),
      best: personalBest(sessions),
      games: sessions.reduce((n, s) => n + (s.game_scores?.length || 0), 0),
      lastSeries: sessions[0]?.series_total ?? 0,
    }),
    [sessions]
  )

  // Oldest -> newest so the trend line reads left to right.
  const trend = useMemo(
    () => [...sessions].reverse().map((s) => Number(s.session_average) || 0),
    [sessions]
  )

  const live = sessions.find(isLive) || null
  const rest = sessions.filter((s) => s.id !== live?.id)
  // Offer a way back for a session closed by mistake, but only for today's —
  // a "reopen" on a match from three weeks ago is just clutter.
  const reopenable = rest.find((s) => s.status === 'ended' && isToday(s.date))

  async function endSession(session) {
    await updateSession(session.id, { status: 'ended' })
    setJustEnded(session.id)
    // The undo bar is a safety net for a mis-tap, not a permanent control;
    // the Reopen button on today's card covers the rest of the day.
    setTimeout(() => setJustEnded((id) => (id === session.id ? null : id)), 12000)
  }

  async function reopenSession(session) {
    // Only one session can be live at a time or two quick-add boxes appear.
    if (live) await updateSession(live.id, { status: 'ended' })
    await updateSession(session.id, { status: 'live' })
    setJustEnded(null)
  }

  async function saveGame(session, score) {
    const scores = [...(session.game_scores || []), score]
    await updateSession(session.id, {
      game_scores: scores,
      series_total: seriesTotal(scores),
      session_average: sessionAverage(scores),
    })
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Stat label="Average" value={stats.average || '—'} tone="mint" sub={`${stats.games} games`} />
        <Stat label="Personal best" value={stats.best || '—'} tone="amber" />
        <Stat label="Last series" value={stats.lastSeries || '—'} />
        <Stat label="Sessions" value={sessions.length} />
      </div>

      {trend.length >= 2 && (
        <Card className="mb-5 p-4">
          <SectionTitle>Session average over time</SectionTitle>
          <Sparkline values={trend} height={56} />
          <div className="mt-2 flex justify-between text-[11px] font-medium text-faint">
            <span>{formatDateLong(sessions[sessions.length - 1]?.date)}</span>
            <span>{formatDateLong(sessions[0]?.date)}</span>
          </div>
        </Card>
      )}

      {justEnded && (
        <Card className="mb-4 flex items-center gap-3 border-amber/45 bg-amber-soft/30 p-3.5">
          <Icon name="check" size={18} className="shrink-0 text-amber" strokeWidth={2.6} />
          <p className="min-w-0 flex-1 text-[13px] font-semibold">Session ended.</p>
          <Button
            variant="soft"
            size="sm"
            onClick={() => reopenSession(sessions.find((s) => s.id === justEnded))}
          >
            Undo
          </Button>
        </Card>
      )}

      {!live && reopenable && !justEnded && (
        <Card className="mb-4 flex items-center gap-3 p-3.5">
          <Icon name="bowling" size={18} className="shrink-0 text-muted" />
          <p className="min-w-0 flex-1 text-[13px] text-muted">
            Ended today&rsquo;s session at {reopenable.location || 'the lanes'}.
          </p>
          <Button variant="soft" size="sm" onClick={() => reopenSession(reopenable)}>
            Reopen
          </Button>
        </Card>
      )}

      {live && (
        <section className="mb-6">
          <SectionTitle>Today</SectionTitle>
          <LiveSession
            session={live}
            onAddGame={(score) => saveGame(live, score)}
            onEdit={() => setEditing(live)}
            onEnd={() => endSession(live)}
          />
        </section>
      )}

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Icon name="bowling" size={30} />}
          title="No sessions logged"
          body="Start a session when you get to the lanes, then punch in each game total as it finishes."
          action={
            <Button variant="primary" onClick={() => setEditing({})}>
              <Icon name="plus" size={18} />
              New session
            </Button>
          }
        />
      ) : (
        rest.length > 0 && (
          <section>
            <SectionTitle>History</SectionTitle>
            <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
              {rest.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  balls={arsenal}
                  onEdit={() => setEditing(session)}
                />
              ))}
            </div>
          </section>
        )
      )}

      <FloatingButton onClick={() => setEditing({})} aria-label="New session">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </FloatingButton>

      <SessionEditor
        session={editing}
        arsenal={arsenal}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing?.id) {
            await updateSession(editing.id, data)
          } else {
            // Starting a session closes any other, so there is only ever one
            // quick-add box on screen.
            if (live) await updateSession(live.id, { status: 'ended' })
            await addSession({ ...data, status: 'live' })
          }
          setEditing(null)
        }}
        onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeSession(confirmDelete.id)
          setEditing(null)
        }}
        title="Delete this session?"
        body="The games logged in it will be removed from your averages."
      />
    </div>
  )
}

/** The at-the-alley view: one tap, type a number, done. */
function LiveSession({ session, onAddGame, onEdit, onEnd }) {
  const [score, setScore] = useState('')
  const [busy, setBusy] = useState(false)

  const scores = session.game_scores || []
  const valid = score !== '' && Number(score) >= 0 && Number(score) <= 300

  async function submit(e) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    await onAddGame(Number(score))
    setScore('')
    setBusy(false)
  }

  return (
    <Card className="border-mint/45 bg-mint-soft/20 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-70" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            <h3 className="truncate font-extrabold">
              {session.type === 'tournament' ? 'Tournament' : 'Training'} in progress
            </h3>
          </div>
          <p className="mt-0.5 text-[12px] text-muted">{session.location || 'The lanes'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit session">
            <Icon name="edit" size={17} />
          </Button>
          <Button variant="soft" size="sm" onClick={onEnd}>
            End
          </Button>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl bg-surface px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Series</p>
          <p className="text-2xl font-extrabold tabular-nums leading-tight text-mint">
            {session.series_total || 0}
          </p>
        </div>
        <div className="rounded-xl bg-surface px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Average</p>
          <p className="text-2xl font-extrabold tabular-nums leading-tight">
            {session.session_average || 0}
          </p>
        </div>
      </div>

      {scores.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {scores.map((s, i) => (
            <GameChip key={i} index={i} score={s} />
          ))}
        </div>
      )}

      <BenchmarkPanel scores={scores} benchmark={session.benchmark_target} />

      <form onSubmit={submit} className="mt-3.5 flex gap-2">
        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min="0"
          max="300"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder={`Game ${scores.length + 1} score`}
          className="text-center text-lg font-bold"
          aria-label={`Score for game ${scores.length + 1}`}
        />
        <Button type="submit" variant="mint" disabled={!valid} loading={busy} className="px-5">
          Save
        </Button>
      </form>
      <p className="mt-2 text-center text-[12px] text-faint">
        Saves instantly — Player 2 sees it on his phone. Tap{' '}
        <strong className="text-muted">End</strong> when you are done for the day.
      </p>
    </Card>
  )
}

/**
 * Over/under against a per-game benchmark, plus what the next game has to be to
 * pull the series level. The cumulative framing is the one that matters
 * mid-series: 200 across two games is a 400 target, so 386 pins reads "under 14".
 */
function BenchmarkPanel({ scores, benchmark, compact = false }) {
  const standing = benchmarkStanding(scores, benchmark)
  if (!standing || standing.played === 0) return null

  const { diff, needNext, benchmark: mark, targetSoFar, pins, reachable, banked, ahead } = standing
  const level = diff === 0

  return (
    <div
      className={cx(
        'mt-3 rounded-xl border px-3.5 py-3',
        level
          ? 'border-border bg-surface-2'
          : ahead
            ? 'border-mint/45 bg-mint-soft/30'
            : 'border-amber/45 bg-amber-soft/25'
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
          vs {mark} pace
        </p>
        <p className="text-[11px] tabular-nums text-faint">
          {pins} / {targetSoFar}
        </p>
      </div>

      <p
        className={cx(
          'mt-0.5 text-2xl font-extrabold leading-none tabular-nums',
          level ? 'text-text' : ahead ? 'text-mint' : 'text-amber'
        )}
      >
        {level ? 'Level' : ahead ? `Over ${diff}` : `Under ${Math.abs(diff)}`}
      </p>

      {!compact && (
        <p className="mt-2 text-[13px] leading-snug text-text">
          {banked ? (
            <>Anything next game keeps you at {mark}.</>
          ) : reachable ? (
            <>
              Target for game {standing.played + 1}:{' '}
              <strong className="tabular-nums">{needNext}</strong> pins
            </>
          ) : (
            <span className="text-muted">
              Needs {needNext} next game to level up — not catchable in one. Chip at it.
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function GameChip({ index, score }) {
  return (
    <span
      className={cx(
        'inline-flex items-baseline gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1',
        score >= 200 && 'border-amber/50 bg-amber-soft/40'
      )}
    >
      <span className="text-[10px] font-bold uppercase text-faint">G{index + 1}</span>
      <span className="text-[15px] font-extrabold tabular-nums">{score}</span>
    </span>
  )
}

function SessionCard({ session, balls, onEdit }) {
  const scores = session.game_scores || []
  return (
    <Card as="button" interactive onClick={onEdit} className="w-full p-4 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold leading-tight">
            {session.location || 'Bowling session'}
          </h3>
          <p className="mt-0.5 text-[12px] text-faint">{formatDateLong(session.date)}</p>
        </div>
        <Badge tone={session.type === 'tournament' ? 'ember' : 'neutral'}>
          {session.type === 'tournament' ? 'Tournament' : 'Training'}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {scores.map((s, i) => (
          <GameChip key={i} index={i} score={s} />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Series</p>
          <p className="text-lg font-extrabold tabular-nums leading-tight">
            {session.series_total || 0}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Average</p>
          <p className="text-lg font-extrabold tabular-nums leading-tight text-mint">
            {session.session_average || 0}
          </p>
        </div>
      </div>

      {Number(session.benchmark_target) > 0 && (
        <BenchmarkPanel
          scores={session.game_scores || []}
          benchmark={session.benchmark_target}
          compact
        />
      )}

      {(session.oil_pattern || (session.ball_ids || []).length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {session.oil_pattern && OIL_PATTERNS[session.oil_pattern] && (
            <Badge>{OIL_PATTERNS[session.oil_pattern].label}</Badge>
          )}
          {(session.ball_ids || []).map((id) => {
            const ball = balls?.find((b) => b.id === id)
            return ball ? (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted"
              >
                <PixelBall grid={ball.pixel_art_grid} size={14} holes={false} ring={false} />
                {ball.nickname || ball.name}
              </span>
            ) : null
          })}
        </div>
      )}

      {session.note && (
        <p className="mt-2.5 text-[13px] leading-snug text-muted">{session.note}</p>
      )}
    </Card>
  )
}

function SessionEditor({ session, arsenal, onClose, onSave, onDelete }) {
  const open = Boolean(session)
  const isEdit = Boolean(session?.id)

  const [type, setType] = useState('training')
  const [date, setDate] = useState(localDateValue())
  const [location, setLocation] = useState('')
  const [scores, setScores] = useState([''])
  const [note, setNote] = useState('')
  const [ballIds, setBallIds] = useState([])
  const [oil, setOil] = useState('house')
  const [benchmark, setBenchmark] = useState('')
  const [sparesMade, setSparesMade] = useState('')
  const [spareTries, setSpareTries] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== session) {
    setSeed(session)
    setType(session.type || 'training')
    setDate(localDateValue(session.date))
    setLocation(session.location || '')
    setScores(session.game_scores?.length ? session.game_scores.map(String) : [''])
    setNote(session.note || '')
    setBallIds(session.ball_ids || [])
    setOil(session.oil_pattern || 'house')
    setBenchmark(session.benchmark_target ? String(session.benchmark_target) : '')
    setSparesMade(session.spares_converted != null ? String(session.spares_converted) : '')
    setSpareTries(session.spare_attempts != null ? String(session.spare_attempts) : '')
  }
  if (!open && seed !== null) setSeed(null)

  const numeric = scores.map(Number).filter((n) => !Number.isNaN(n) && n >= 0)
  const standing = benchmarkStanding(
    scores.filter((x) => x !== '').map(Number),
    Number(benchmark) || 0
  )
  const filled = scores.filter((s) => s !== '')
  const total = seriesTotal(filled)
  const average = sessionAverage(filled)

  async function submit() {
    setBusy(true)
    // Preserve the time-of-day when editing so a session logged at 8pm doesn't
    // silently jump to midnight on every save.
    const existing = session?.date ? new Date(session.date) : new Date()
    const [y, m, d] = date.split('-').map(Number)
    const when = new Date(y, m - 1, d, existing.getHours(), existing.getMinutes())

    await onSave({
      type,
      date: when,
      location: location.trim(),
      game_scores: filled.map(Number),
      series_total: total,
      session_average: average,
      note: note.trim(),
      ball_ids: ballIds,
      oil_pattern: oil,
      benchmark_target: benchmark === '' ? null : Number(benchmark),
      // Denormalised so Player 2's dashboard can show the standing without
      // recomputing, and so the numbers are frozen with the session.
      current_over_under: standing ? standing.diff : null,
      pins_needed_next_game: standing && !standing.banked ? standing.needNext : null,
      // Left blank means "not tracked" rather than zero, so an untracked
      // session cannot drag the spare percentage down.
      spares_converted: sparesMade === '' ? null : Number(sparesMade),
      spare_attempts: spareTries === '' ? null : Number(spareTries),
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit session' : 'New session'}
      subtitle={isEdit ? undefined : 'Log the games as they finish — you can add more later.'}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete} aria-label="Delete session">
              <Icon name="trash" size={18} />
            </Button>
          )}
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" full loading={busy} onClick={submit}>
            {isEdit ? 'Save' : 'Start session'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Session type">
          <Segmented
            value={type}
            onChange={setType}
            options={[
              { value: 'training', label: 'Training' },
              { value: 'tournament', label: 'Tournament' },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="session-date">
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Location" htmlFor="session-location">
            <Input
              id="session-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Uni Lanes"
              autoCapitalize="words"
            />
          </Field>
        </div>

        <Field label="Game scores" hint={`${numeric.length} game${numeric.length === 1 ? '' : 's'}`}>
          <div className="flex flex-col gap-2">
            {scores.map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-11 shrink-0 text-[12px] font-bold uppercase tracking-wide text-faint">
                  G{i + 1}
                </span>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  max="300"
                  value={value}
                  onChange={(e) => {
                    const next = [...scores]
                    next[i] = e.target.value
                    setScores(next)
                  }}
                  placeholder="—"
                  className="text-center font-bold"
                  aria-label={`Game ${i + 1} score`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScores(scores.filter((_, j) => j !== i))}
                  disabled={scores.length === 1}
                  aria-label={`Remove game ${i + 1}`}
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            full
            className="mt-2"
            onClick={() => setScores([...scores, ''])}
          >
            <Icon name="plus" size={16} />
            Add game
          </Button>
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
              Series total
            </p>
            <p className="text-2xl font-extrabold tabular-nums leading-tight">{total}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Average</p>
            <p className="text-2xl font-extrabold tabular-nums leading-tight text-mint">
              {average}
            </p>
          </div>
        </div>

        <Field
          label="Benchmark average"
          hint="optional — the number you are chasing"
          htmlFor="session-benchmark"
        >
          <Input
            id="session-benchmark"
            type="number"
            inputMode="numeric"
            min="0"
            max="300"
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            placeholder="200"
            className="text-center font-bold"
          />
          {standing && standing.played > 0 && (
            <p className="mt-1.5 text-[12px] leading-snug text-muted">
              {standing.played} game{standing.played === 1 ? '' : 's'} against a target of{' '}
              {standing.targetSoFar} —{' '}
              <strong className={standing.diff >= 0 ? 'text-mint' : 'text-ember'}>
                {standing.diff >= 0 ? `over ${standing.diff}` : `under ${Math.abs(standing.diff)}`}
              </strong>
            </p>
          )}
        </Field>

        <Field label="Lane condition" hint="powers the oil matcher">
          <div className="grid grid-cols-2 gap-2">
            {OIL_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setOil(id)}
                aria-pressed={oil === id}
                className={cx(
                  'min-h-11 rounded-xl border-2 px-2 text-[13px] font-bold transition',
                  oil === id
                    ? 'border-ember bg-ember-soft/40 text-ember'
                    : 'border-border bg-surface text-muted hover:border-border-strong'
                )}
              >
                {OIL_PATTERNS[id].label}
              </button>
            ))}
          </div>
        </Field>

        {arsenal.length > 0 && (
          <Field
            label="Balls you threw"
            hint={ballIds.length ? `${ballIds.length} selected` : 'tap to select'}
          >
            <div className="flex flex-col gap-2">
              {arsenal.map((ball) => {
                const on = ballIds.includes(ball.id)
                const role = ROLES[ball.role] ?? ROLES.strike_ball
                return (
                  <button
                    key={ball.id}
                    type="button"
                    onClick={() =>
                      setBallIds(
                        on ? ballIds.filter((x) => x !== ball.id) : [...ballIds, ball.id]
                      )
                    }
                    aria-pressed={on}
                    className={cx(
                      'flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 text-left transition',
                      on
                        ? 'border-ember bg-ember-soft/40'
                        : 'border-border bg-surface hover:border-border-strong'
                    )}
                  >
                    <PixelBall grid={ball.pixel_art_grid} size={30} holes={false} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">
                        {ball.nickname || ball.name}
                      </span>
                      <span className="block text-[11px]" style={{ color: role.color }}>
                        {role.short}
                      </span>
                    </span>
                    {on && <Icon name="check" size={18} className="text-ember" strokeWidth={2.6} />}
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[12px] leading-snug text-faint">
              Tagging one ball gives exact per-ball averages. Tag two and the games count toward
              both.
            </p>
          </Field>
        )}

        <Field label="Spares" hint="optional — powers your conversion rate">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={sparesMade}
              onChange={(e) => setSparesMade(e.target.value)}
              placeholder="made"
              className="text-center font-bold"
              aria-label="Spares converted"
            />
            <span className="text-[13px] font-bold text-faint">of</span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              value={spareTries}
              onChange={(e) => setSpareTries(e.target.value)}
              placeholder="chances"
              className="text-center font-bold"
              aria-label="Spare attempts"
            />
          </div>
        </Field>

        <Field label="Note" hint="optional" htmlFor="session-note">
          <Textarea
            id="session-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How the lanes played, what to work on…"
          />
        </Field>
      </div>
    </Modal>
  )
}
