import { useRef, useState } from 'react'

import { PixelBall } from '../components/PixelBall'
import { PixelLane } from '../components/PixelLane'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../components/ui/Card'
import { Field, Input } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import {
  PIN_POS,
  frameScores,
  isFrameComplete,
  isGameComplete,
  makeRng,
  rollGlyph,
  throwBall,
  totalScore,
} from '../data/bowlingGame'
import { buzz, cx, timeAgo } from '../lib/utils'

const other = (side) => (side === 'player1' ? 'player2' : 'player1')

/**
 * Firestore forbids an array whose elements are arrays, so a game is stored as
 * one flat list of rolls per player and the ten frames are derived from it.
 * That is lossless for ten-pin: the frame boundaries follow from the rolls.
 */
export function framesFromRolls(rolls = []) {
  const frames = []
  let i = 0
  for (let f = 0; f < 10 && i < rolls.length; f++) {
    if (f === 9) {
      frames.push(rolls.slice(i))
      break
    }
    if (rolls[i] === 10) {
      frames.push([10])
      i += 1
    } else {
      frames.push(rolls.slice(i, i + 2))
      i += 2
    }
  }
  return frames
}

/** Index of the frame currently being bowled (0-9), or 10 when the game is done. */
function activeFrame(rolls) {
  const frames = framesFromRolls(rolls)
  for (let f = 0; f < 10; f++) {
    if (!frames[f] || !isFrameComplete(frames[f], f)) return f
  }
  return 10
}

export function Alley() {
  const { matches, arsenal, addMatch, updateMatch, removeMatch } = useData()
  const { profile, isPlayer2 } = useAuth()
  const me = isPlayer2 ? 'player2' : 'player1'

  const [openId, setOpenId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const active = matches.filter((m) => m.status !== 'complete')
  const done = matches.filter((m) => m.status === 'complete')
  const match = matches.find((m) => m.id === openId) || null

  if (match) {
    return (
      <MatchView
        match={match}
        me={me}
        arsenal={arsenal}
        onBack={() => setOpenId(null)}
        onUpdate={(patch) => updateMatch(match.id, patch)}
      />
    )
  }

  return (
    <div className="animate-fade-up">
      <Card className="mb-5 flex items-start gap-3 border-violet/35 bg-violet-soft/25 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet text-white">
          <Icon name="bowling" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">The Cozy Alley</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            Ten frames each, one at a time. Bowl your frame whenever you like — the other
            player picks it up on their phone. Her arsenal balls are the skins.
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            New match
          </Button>
        </div>
      </Card>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Icon name="bowling" size={30} />}
          title="No matches yet"
          body="Start one and set a wager. Loser owes something small."
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-7">
              <SectionTitle>In progress · {active.length}</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {active.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    me={me}
                    arsenal={arsenal}
                    onOpen={() => setOpenId(m.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <SectionTitle>Finished · {done.length}</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {done.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    me={me}
                    arsenal={arsenal}
                    onOpen={() => setOpenId(m.id)}
                    onDelete={() => setConfirmDelete(m)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <NewMatchModal
        open={creating}
        me={me}
        myName={profile?.name}
        arsenal={arsenal}
        onClose={() => setCreating(false)}
        onCreate={async (data) => {
          const id = await addMatch(data)
          setCreating(false)
          setOpenId(id)
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeMatch(confirmDelete.id)}
        title="Delete this match?"
        body="The scorecard goes with it."
      />
    </div>
  )
}

/* ----------------------------------------------------------- match row -- */

function MatchRow({ match, me, arsenal, onOpen, onDelete }) {
  const mine = totalScore(framesFromRolls(match.rolls?.[me]))
  const theirs = totalScore(framesFromRolls(match.rolls?.[other(me)]))
  const myTurn = match.turn === me && match.status !== 'complete'

  return (
    <Card
      className={cx('flex items-center gap-3 p-3.5', myTurn && 'border-ember/50 bg-ember-soft/15')}
    >
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PixelBall
          grid={arsenal.find((b) => b.id === match.ball_ids?.[me])?.pixel_art_grid}
          size={40}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold leading-tight">
            {match.wager ? match.wager : 'Friendly match'}
          </span>
          <span className="mt-0.5 block text-[12px] text-faint">{timeAgo(match.created_at)}</span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[15px] font-extrabold tabular-nums">
            {mine} <span className="text-faint">·</span> {theirs}
          </span>
          <span className="block text-[11px] text-faint">you · them</span>
        </span>
      </button>

      {match.status === 'complete' ? (
        <Badge tone={match.winner === me ? 'mint' : match.winner === 'tie' ? 'neutral' : 'ember'}>
          {match.winner === 'tie' ? 'Tie' : match.winner === me ? 'Won' : 'Lost'}
        </Badge>
      ) : myTurn ? (
        <Button variant="primary" size="sm" onClick={onOpen}>
          Bowl
        </Button>
      ) : (
        <Badge>Their turn</Badge>
      )}

      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete match">
          <Icon name="trash" size={16} />
        </Button>
      )}
    </Card>
  )
}

/* ---------------------------------------------------------- match view -- */

/**
 * Swipe tuning.
 *
 * FLICK_REF is the upward speed (px/ms) that counts as a full-power throw;
 * HOOK_REF is how far sideways the swipe must drift to reach maximum hook.
 * Both are expressed against the lane's own height/width below so the feel is
 * identical on a small iPhone and an iPad.
 */
const FLICK_REF = 1.5
const HOOK_REF = 0.34
const MIN_SWIPE = 28 // px of upward travel before it counts as a throw at all

function MatchView({ match, me, arsenal, onBack, onUpdate }) {
  const them = other(me)
  const myRolls = match.rolls?.[me] || []
  const theirRolls = match.rolls?.[them] || []
  const myFrames = framesFromRolls(myRolls)
  const theirFrames = framesFromRolls(theirRolls)

  const myTurn = match.turn === me && match.status !== 'complete'
  const standing = match.standing?.[me] ?? PIN_POS.map((p) => p.n)
  const frameIndex = activeFrame(myRolls)
  const ball = arsenal.find((b) => b.id === match.ball_ids?.[me])

  const [aiming, setAiming] = useState(null)
  const [throwing, setThrowing] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const surface = useRef(null)
  const gesture = useRef(null)

  /* ------------------------------------------------------------ swipe -- */

  function pointFrom(e) {
    const rect = surface.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      w: rect.width,
      h: rect.height,
      t: performance.now(),
    }
  }

  function onPointerDown(e) {
    if (!myTurn || busy) return
    // Capture keeps the gesture alive if the finger leaves the lane mid-swipe.
    // It can throw InvalidPointerId on some engines; a failure there must not
    // abort the throw, so swallow it and carry on uncaptured.
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {
      /* uncaptured is still perfectly playable */
    }
    const p = pointFrom(e)
    gesture.current = { start: p, last: p }
    // Aim is where the finger lands: that is your stance on the approach.
    setAiming({ aim: p.x * 2 - 1, spin: 0 })
  }

  function onPointerMove(e) {
    if (!gesture.current) return
    const p = pointFrom(e)
    gesture.current.last = p
    const g = gesture.current
    // Sideways drift over the swipe is the hook. A dead-straight flick has none.
    const drift = (p.x - g.start.x) / HOOK_REF
    setAiming({
      aim: g.start.x * 2 - 1,
      spin: Math.max(-1, Math.min(1, drift)),
    })
  }

  async function onPointerUp() {
    const g = gesture.current
    gesture.current = null
    if (!g || busy) return

    const dyPx = (g.start.y - g.last.y) * g.start.h
    if (dyPx < MIN_SWIPE) {
      // A tap or a downward drag is not a throw — reset rather than lob one.
      setAiming(null)
      return
    }

    const dt = Math.max(16, g.last.t - g.start.t)
    const speed = dyPx / dt
    const power = Math.max(0.15, Math.min(1, speed / FLICK_REF))
    const aim = g.start.x * 2 - 1
    const spin = Math.max(-1, Math.min(1, (g.last.x - g.start.x) / HOOK_REF))

    await roll({ aim, power, spin })
  }

  async function roll(inputs) {
    setBusy(true)
    buzz(14)

    const pins = PIN_POS.map((p) => standing.includes(p.n))
    const rng = makeRng(Date.now() ^ (myRolls.length * 2654435761))
    const outcome = throwBall({ pins, ...inputs, rng })
    const downed = pins.filter(Boolean).length - outcome.pins.filter(Boolean).length

    setThrowing({ entry: outcome.entry, pins: outcome.pins })
    setResult({ ...outcome, downed })
    await new Promise((r) => setTimeout(r, 1500))

    const nextRolls = [...myRolls, downed]
    const nextFrames = framesFromRolls(nextRolls)
    const frameDone = isFrameComplete(nextFrames[frameIndex], frameIndex)
    const gameDone = isGameComplete(nextFrames)

    let nextStanding = outcome.pins.map((up, i) => (up ? PIN_POS[i].n : null)).filter(Boolean)
    if (frameDone) nextStanding = PIN_POS.map((p) => p.n)
    else if (frameIndex === 9 && outcome.pins.every((x) => !x)) {
      nextStanding = PIN_POS.map((p) => p.n)
    }

    const bothDone = gameDone && isGameComplete(framesFromRolls(theirRolls))
    const patch = {
      rolls: { ...match.rolls, [me]: nextRolls },
      standing: { ...match.standing, [me]: nextStanding },
      turn: frameDone ? them : match.turn,
    }
    if (bothDone) {
      const a = totalScore(nextFrames)
      const bScore = totalScore(framesFromRolls(theirRolls))
      patch.status = 'complete'
      patch.winner = a === bScore ? 'tie' : a > bScore ? me : them
      patch.final = { [me]: a, [them]: bScore }
    }

    await onUpdate(patch)
    setThrowing(null)
    setResult(null)
    setAiming(null)
    setBusy(false)
  }

  const myScore = totalScore(myFrames)
  const theirScore = totalScore(theirFrames)

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Icon name="back" size={17} />
          Matches
        </Button>
        {match.wager && (
          <Badge tone="amber" className="ml-auto">
            {match.wager}
          </Badge>
        )}
      </div>

      <Card className="mb-4 p-3.5">
        <div className="flex items-center justify-around gap-2 text-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">You</p>
            <p className="text-3xl font-extrabold tabular-nums leading-none text-mint">{myScore}</p>
          </div>
          <div className="text-[13px] font-bold text-faint">vs</div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Them</p>
            <p className="text-3xl font-extrabold tabular-nums leading-none">{theirScore}</p>
          </div>
        </div>
      </Card>

      <div
        ref={surface}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          gesture.current = null
          setAiming(null)
        }}
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ aspectRatio: '96 / 128', touchAction: 'none' }}
      >
        <PixelLane
          standing={standing}
          ballGrid={ball?.pixel_art_grid}
          aiming={aiming}
          throwing={throwing}
          dragging={Boolean(aiming)}
        />

        {/* Overlay copy sits on the lane so the canvas stays pure pixels. */}
        {match.status !== 'complete' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-center">
            {result ? (
              <p className="text-[15px] font-extrabold text-white drop-shadow">
                {result.gutter ? 'Gutter…' : result.downed === 10 ? 'Strike!' : `${result.downed} down`}
              </p>
            ) : myTurn ? (
              <p className="text-[13px] font-semibold text-white/80 drop-shadow">
                {aiming ? 'Flick up to throw — curve your swipe to hook' : 'Swipe up the lane to bowl'}
              </p>
            ) : (
              <p className="text-[13px] font-semibold text-white/80 drop-shadow">Their turn</p>
            )}
          </div>
        )}

        {myTurn && !aiming && !busy && (
          <div className="pointer-events-none absolute inset-x-0 top-2 text-center">
            <span className="rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/90">
              Frame {frameIndex + 1}
            </span>
          </div>
        )}
      </div>

      {aiming && (
        <div className="mt-2 flex justify-center gap-4 text-[12px] font-semibold text-muted">
          <span>
            Line <span className="tabular-nums text-text">{aiming.aim.toFixed(2)}</span>
          </span>
          <span>
            Hook{' '}
            <span className="tabular-nums text-text">
              {aiming.spin > 0.05 ? 'right' : aiming.spin < -0.05 ? 'left' : 'straight'}
            </span>
          </span>
        </div>
      )}

      {match.status === 'complete' ? (
        <Card className="mt-4 p-4 text-center">
          <p className="text-lg font-extrabold">
            {match.winner === 'tie' ? 'Dead tie.' : match.winner === me ? 'You won.' : 'They won.'}
          </p>
          {match.wager && (
            <p className="mt-1 text-[14px] text-muted">
              {match.winner === me ? 'Collect: ' : 'You owe: '}
              <strong className="text-text">{match.wager}</strong>
            </p>
          )}
        </Card>
      ) : !myTurn ? (
        <Card className="mt-4 flex items-center gap-3 p-4">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-violet opacity-70" />
            <span className="relative inline-flex size-2.5 rounded-full bg-violet" />
          </span>
          <p className="text-[14px] font-semibold">Their turn. It will be here when they bowl.</p>
        </Card>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        <Scoreboard label="You" frames={myFrames} highlight={myTurn} />
        <Scoreboard
          label="Them"
          frames={theirFrames}
          highlight={!myTurn && match.status !== 'complete'}
        />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- scoreboard -- */

function Scoreboard({ label, frames, highlight }) {
  const scores = frameScores(frames)
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
      <div
        className={cx(
          'no-scrollbar overflow-x-auto rounded-xl border',
          highlight ? 'border-ember/50' : 'border-border'
        )}
      >
        <div className="flex min-w-max">
          {Array.from({ length: 10 }, (_, f) => {
            const frame = frames[f] || []
            const rolls = f === 9 ? 3 : 2
            return (
              <div
                key={f}
                className="min-w-[42px] flex-1 border-r border-border last:border-r-0"
              >
                <div className="flex border-b border-border">
                  {Array.from({ length: rolls }, (_, r) => (
                    <span
                      key={r}
                      className="flex-1 border-r border-border py-0.5 text-center text-[11px] font-bold last:border-r-0"
                    >
                      {rollGlyph(frame, r, f) || ' '}
                    </span>
                  ))}
                </div>
                <div className="py-1 text-center text-[12px] font-extrabold tabular-nums">
                  {scores[f] ?? ' '}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ new match -- */

function NewMatchModal({ open, me, myName, arsenal, onClose, onCreate }) {
  const [wager, setWager] = useState('')
  const [ballId, setBallId] = useState('')
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setWager('')
    setBallId(arsenal[0]?.id || '')
  }
  if (!open && wasOpen) setWasOpen(false)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New match"
      subtitle="Ten frames each, taken in turns"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await onCreate({
                wager: wager.trim(),
                status: 'active',
                turn: me,
                started_by: myName || me,
                rolls: { player1: [], player2: [] },
                standing: {
                  player1: PIN_POS.map((p) => p.n),
                  player2: PIN_POS.map((p) => p.n),
                },
                ball_ids: { [me]: ballId || null, [other(me)]: ballId || null },
                winner: null,
              })
              setBusy(false)
            }}
          >
            Start
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="Wager" hint="optional, keep it small" htmlFor="wager">
          <Input
            id="wager"
            value={wager}
            onChange={(e) => setWager(e.target.value)}
            placeholder="Loser buys boba"
            autoCapitalize="sentences"
          />
        </Field>

        {arsenal.length > 0 ? (
          <Field label="Your ball skin">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {arsenal.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBallId(b.id)}
                  aria-pressed={ballId === b.id}
                  className={cx(
                    'flex shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2 transition',
                    ballId === b.id ? 'border-ember bg-ember-soft/40' : 'border-border bg-surface'
                  )}
                >
                  <PixelBall grid={b.pixel_art_grid} size={44} />
                  <span className="max-w-[64px] truncate text-[11px] font-semibold">
                    {b.nickname || b.name}
                  </span>
                </button>
              ))}
            </div>
          </Field>
        ) : (
          <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-[13px] leading-snug text-muted">
            No balls in the arsenal yet — the match still works, it just uses a plain ball. Add
            one in <strong className="text-text">Arsenal</strong> to use your own design as a skin.
          </p>
        )}
      </div>
    </Modal>
  )
}
