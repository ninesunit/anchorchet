import { useMemo, useState } from 'react'

import { PixelBall } from '../../components/PixelBall'
import { PixelEditor } from '../../components/PixelEditor'
import { Badge } from '../../components/ui/Badge'
import { Button, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import {
  COVERSTOCKS,
  OIL_PATTERNS,
  ROLES,
  WEIGHTS,
  defaultBallGrid,
} from '../../data/arsenal'
import {
  MIN_SESSIONS,
  arsenalSummary,
  ballStats,
  oilMatrix,
  oilRecommendations,
  spareStats,
} from '../../data/bowlingStats'
import { cx } from '../../lib/utils'

export function Arsenal({ readOnly = false }) {
  const { arsenal, sessions, addBall, updateBall, removeBall } = useData()

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [tab, setTab] = useState('bag')

  const stats = useMemo(() => ballStats(sessions, arsenal), [sessions, arsenal])
  const summary = useMemo(() => arsenalSummary(sessions, arsenal), [sessions, arsenal])

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="In the bag" value={summary.balls} />
        <Stat label="With data" value={summary.tracked} tone="mint" />
        <Stat
          label="Best average"
          value={summary.bestBall?.average || '—'}
          tone="amber"
          sub={summary.bestBall?.ball.nickname || summary.bestBall?.ball.name}
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {[
          { id: 'bag', label: 'The bag' },
          { id: 'stats', label: 'Per-ball stats' },
          { id: 'oil', label: 'Oil matcher' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cx(
              'no-select inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-bold transition',
              tab === t.id
                ? 'border-transparent bg-text text-bg'
                : 'border-border bg-surface text-muted hover:text-text'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bag' && (
        <BagTab
          arsenal={arsenal}
          stats={stats}
          readOnly={readOnly}
          onEdit={setEditing}
        />
      )}
      {tab === 'stats' && <StatsTab stats={stats} sessions={sessions} />}
      {tab === 'oil' && <OilTab arsenal={arsenal} sessions={sessions} />}

      {!readOnly && (
        <>
          <FloatingButton onClick={() => setEditing({})} aria-label="Add a ball">
            <Icon name="plus" size={26} strokeWidth={2.4} />
          </FloatingButton>

          <BallEditor
            ball={editing}
            onClose={() => setEditing(null)}
            onSave={async (data) => {
              if (editing?.id) await updateBall(editing.id, data)
              else await addBall(data)
              setEditing(null)
            }}
            onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
          />

          <ConfirmDialog
            open={Boolean(confirmDelete)}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => {
              removeBall(confirmDelete.id)
              setEditing(null)
            }}
            title="Remove this ball?"
            body={`"${confirmDelete?.nickname || confirmDelete?.name}" leaves the bag. Sessions that used it keep their scores.`}
            confirmLabel="Remove"
          />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- the bag -- */

function BagTab({ arsenal, stats, readOnly, onEdit }) {
  const byId = Object.fromEntries(stats.map((s) => [s.ball.id, s]))

  if (arsenal.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="bowling" size={30} />}
        title="No balls in the bag"
        body={
          readOnly
            ? 'Once she adds her gear it shows up here.'
            : 'Add your gear, draw its colours, and every session can be tagged with what you threw.'
        }
        action={
          !readOnly && (
            <Button variant="primary" onClick={() => onEdit({})}>
              <Icon name="plus" size={18} />
              Add a ball
            </Button>
          )
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
      {arsenal.map((ball) => {
        const role = ROLES[ball.role] ?? ROLES.strike_ball
        const stat = byId[ball.id]
        return (
          <Card
            key={ball.id}
            as={readOnly ? 'div' : 'button'}
            interactive={!readOnly}
            onClick={readOnly ? undefined : () => onEdit(ball)}
            className="flex w-full items-center gap-3.5 p-3.5 text-left"
          >
            <PixelBall grid={ball.pixel_art_grid} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold leading-tight">
                {ball.nickname || ball.name || 'Unnamed ball'}
              </p>
              {ball.nickname && ball.name && (
                <p className="truncate text-[12px] text-faint">{ball.name}</p>
              )}
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                {ball.weight_lbs ? <span>{ball.weight_lbs} lbs</span> : null}
                {ball.coverstock ? <span className="text-faint">· {ball.coverstock}</span> : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{
                  color: role.color,
                  background: `color-mix(in srgb, ${role.color} 14%, transparent)`,
                }}
              >
                {role.short}
              </span>
              {stat?.games > 0 && (
                <span className="text-[13px] font-extrabold tabular-nums">{stat.average}</span>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------- statistics -- */

function StatsTab({ stats, sessions }) {
  const tracked = stats.filter((s) => s.games > 0)

  if (tracked.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="target" size={30} />}
        title="No per-ball data yet"
        body="Tag the balls you threw when you log a session and the averages build themselves."
      />
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {tracked.map(({ ball, average, games, sessions: n, best, soloSessions }) => {
        const role = ROLES[ball.role] ?? ROLES.strike_ball
        const spares = ball.role === 'spare_ball' ? spareStats(sessions, ball.id) : null
        return (
          <Card key={ball.id} className="p-3.5">
            <div className="flex items-center gap-3">
              <PixelBall grid={ball.pixel_art_grid} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold leading-tight">
                  {ball.nickname || ball.name}
                </p>
                <p className="text-[12px]" style={{ color: role.color }}>
                  {role.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold leading-none tabular-nums text-mint">
                  {average}
                </p>
                <p className="text-[11px] text-faint">average</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <div>
                <p className="text-[15px] font-extrabold tabular-nums">{games}</p>
                <p className="text-[11px] text-faint">games</p>
              </div>
              <div>
                <p className="text-[15px] font-extrabold tabular-nums">{best}</p>
                <p className="text-[11px] text-faint">best</p>
              </div>
              <div>
                <p className="text-[15px] font-extrabold tabular-nums">
                  {spares?.rate !== null && spares?.rate !== undefined ? `${spares.rate}%` : n}
                </p>
                <p className="text-[11px] text-faint">
                  {spares?.rate !== null && spares?.rate !== undefined ? 'spares' : 'sessions'}
                </p>
              </div>
            </div>

            {soloSessions < n && (
              <p className="mt-2 text-[11px] leading-snug text-faint">
                {n - soloSessions} of these sessions used more than one ball, so those games
                count toward each ball in play.
              </p>
            )}
          </Card>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------- oil matching -- */

function OilTab({ arsenal, sessions }) {
  const recs = useMemo(() => oilRecommendations(sessions, arsenal), [sessions, arsenal])
  const matrix = useMemo(() => oilMatrix(sessions, arsenal), [sessions, arsenal])

  if (arsenal.length === 0 || recs.length === 0) {
    return (
      <EmptyState
        icon={<Icon name="sparkle" size={30} />}
        title="Nothing to match yet"
        body="Log the lane condition and which balls you threw, and after a couple of sessions this starts telling you what works where."
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {recs.map((rec) => (
        <Card
          key={rec.oil.id}
          className={cx('p-4', rec.confident && 'border-mint/45 bg-mint-soft/15')}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-extrabold leading-tight">{rec.oil.label}</p>
              <p className="text-[12px] text-faint">{rec.oil.blurb}</p>
            </div>
            {rec.confident ? (
              <Badge tone="mint" dot>
                Recommended
              </Badge>
            ) : (
              <Badge tone="amber">Early read</Badge>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-2/60 p-2.5">
            <PixelBall grid={rec.best.ball.pixel_art_grid} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold">
                {rec.best.ball.nickname || rec.best.ball.name}
              </p>
              <p className="text-[12px] text-muted">
                {rec.best.stat.sessions} session{rec.best.stat.sessions === 1 ? '' : 's'} ·{' '}
                {rec.best.stat.games} games
              </p>
            </div>
            <p className="text-2xl font-extrabold tabular-nums text-mint">
              {rec.best.stat.average}
            </p>
          </div>

          {rec.runnerUp && (
            <p className="mt-2 text-[12px] text-muted">
              Next best: {rec.runnerUp.ball.nickname || rec.runnerUp.ball.name} at{' '}
              <strong className="text-text">{rec.runnerUp.stat.average}</strong>
            </p>
          )}

          {!rec.confident && (
            <p className="mt-2 text-[12px] leading-snug text-amber">
              Based on {rec.best.stat.sessions} session
              {rec.best.stat.sessions === 1 ? '' : 's'} — {MIN_SESSIONS}+ before this means much.
            </p>
          )}
        </Card>
      ))}

      {matrix.patternsUsed.length > 1 && (
        <section className="mt-2">
          <SectionTitle>Full grid</SectionTitle>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 font-bold">Ball</th>
                  {matrix.patternsUsed.map((oil) => (
                    <th key={oil} className="px-3 py-2 text-right font-bold">
                      {OIL_PATTERNS[oil].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arsenal.map((ball) => (
                  <tr key={ball.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <PixelBall grid={ball.pixel_art_grid} size={22} holes={false} />
                        <span className="truncate font-semibold">
                          {ball.nickname || ball.name}
                        </span>
                      </span>
                    </td>
                    {matrix.patternsUsed.map((oil) => {
                      const cell = matrix.get(ball.id, oil)
                      return (
                        <td
                          key={oil}
                          className="px-3 py-2 text-right font-extrabold tabular-nums"
                        >
                          {cell?.games ? cell.average : <span className="text-faint">—</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </div>
  )
}

/* -------------------------------------------------------------- editor -- */

function BallEditor({ ball, onClose, onSave, onDelete }) {
  const open = Boolean(ball)
  const isEdit = Boolean(ball?.id)

  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState('strike_ball')
  const [weight, setWeight] = useState(15)
  const [coverstock, setCoverstock] = useState(COVERSTOCKS[0])
  const [grid, setGrid] = useState(defaultBallGrid)
  const [busy, setBusy] = useState(false)
  const [showArt, setShowArt] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== ball) {
    setSeed(ball)
    setName(ball.name || '')
    setNickname(ball.nickname || '')
    setRole(ball.role || 'strike_ball')
    setWeight(ball.weight_lbs || 15)
    setCoverstock(ball.coverstock || COVERSTOCKS[0])
    setGrid(ball.pixel_art_grid?.length ? ball.pixel_art_grid : defaultBallGrid())
    setShowArt(false)
  }
  if (!open && seed !== null) setSeed(null)

  async function submit() {
    setBusy(true)
    await onSave({
      name: name.trim(),
      nickname: nickname.trim(),
      role,
      weight_lbs: Number(weight) || null,
      coverstock,
      pixel_art_grid: grid,
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit ball' : 'Add a ball'}
      subtitle={showArt ? 'Draw the real thing' : undefined}
      size="md"
      footer={
        <>
          {onDelete && !showArt && (
            <Button variant="danger" onClick={onDelete} aria-label="Remove ball">
              <Icon name="trash" size={18} />
            </Button>
          )}
          {showArt ? (
            <Button variant="primary" full onClick={() => setShowArt(false)}>
              Done drawing
            </Button>
          ) : (
            <>
              <Button variant="soft" full onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                full
                loading={busy}
                disabled={!name.trim() && !nickname.trim()}
                onClick={submit}
              >
                {isEdit ? 'Save' : 'Add to bag'}
              </Button>
            </>
          )}
        </>
      }
    >
      {showArt ? (
        <div className="pb-2">
          <PixelEditor value={grid} onChange={setGrid} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          <button
            type="button"
            onClick={() => setShowArt(true)}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/50 p-3.5 text-left transition hover:border-border-strong"
          >
            <PixelBall grid={grid} size={72} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold">Design the ball</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                Draw its colours pixel by pixel, or start from a preset.
              </span>
            </span>
            <Icon name="chevron" size={18} className="text-faint" />
          </button>

          <Field label="Nickname" hint="what you actually call it" htmlFor="ball-nick">
            <Input
              id="ball-nick"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="The Purple Gem"
              autoCapitalize="words"
            />
          </Field>

          <Field label="Model" hint="optional" htmlFor="ball-name">
            <Input
              id="ball-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Storm Phaze II"
              autoCapitalize="words"
            />
          </Field>

          <Field label="Role in the bag">
            <div className="flex flex-col gap-2">
              {Object.values(ROLES).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  aria-pressed={role === r.id}
                  className={cx(
                    'flex min-h-12 items-center gap-3 rounded-xl border-2 px-3 text-left transition',
                    role === r.id
                      ? 'border-ember bg-ember-soft/40'
                      : 'border-border bg-surface hover:border-border-strong'
                  )}
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: r.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold">{r.label}</span>
                    <span className="block text-[12px] text-muted">{r.blurb}</span>
                  </span>
                  {role === r.id && (
                    <Icon name="check" size={18} className="text-ember" strokeWidth={2.6} />
                  )}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight" htmlFor="ball-weight">
              <Select
                id="ball-weight"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              >
                {WEIGHTS.map((w) => (
                  <option key={w} value={w}>
                    {w} lbs
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Coverstock" htmlFor="ball-cover">
              <Select
                id="ball-cover"
                value={coverstock}
                onChange={(e) => setCoverstock(e.target.value)}
              >
                {COVERSTOCKS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
