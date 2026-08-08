import { useMemo, useState } from 'react'

import { LifelineButton, LifelineModal } from '../../components/LifelineModal'
import { StitchQuickView } from '../../components/StitchQuickView'
import { StitchSymbol } from '../../components/StitchSymbol'
import { Badge, ColorDot, QuestStatusBadge, TierBadge } from '../../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Chip, ChipRow, Field, Input, Segmented, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { yarnSwatch } from '../../data/colors'
import { stitchFromLabel } from '../../data/crochetSymbols'
import { evaluatePattern } from '../../data/engine'
import { PATTERNS_BY_ID, SERIES } from '../../data/patterns'
import { cx, fmtQty, timeAgo } from '../../lib/utils'

/**
 * A bounty she has not dealt with yet.
 *
 * Deliberately "anything not finished" rather than a status allowlist: the
 * board carries documents written before this tab existed, with statuses like
 * `accepted` and `in_progress` that no longer have a home of their own. Keying
 * off completion means an old quest surfaces instead of silently vanishing.
 */
const isOpenQuest = (q) => q.status !== 'completed'

export function Projects() {
  const {
    projects,
    quests,
    stash,
    addProject,
    updateProject,
    removeProject,
    updateQuest,
    updateYarn,
    addTrophy,
  } = useData()
  const { profile } = useAuth()

  const [view, setView] = useState('projects')
  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filter, setFilter] = useState('in_progress')
  const [openStitch, setOpenStitch] = useState(null)
  const [completing, setCompleting] = useState(null)
  const [lifeline, setLifeline] = useState(null)

  const live = projects.filter((p) => p.status !== 'completed')
  const done = projects.filter((p) => p.status === 'completed')
  const visible = filter === 'in_progress' ? live : filter === 'completed' ? done : projects

  // A quest she has already turned into a project must not offer "Accept" again.
  const acceptedIds = new Set(projects.map((p) => p.linked_quest_id).filter(Boolean))
  const openQuests = quests.filter((q) => isOpenQuest(q) && !acceptedIds.has(q.id))
  const questsDone = quests.filter((q) => q.status === 'completed')

  const totalUsed = projects.reduce(
    (n, p) => n + (p.yarns_used || []).reduce((m, y) => m + (Number(y.quantity_used) || 0), 0),
    0
  )

  /**
   * Accepting a bounty.
   *
   * Two writes, deliberately: the quest is marked accepted so it leaves his
   * board, and a project is created carrying the title, the reference photo and
   * the analyzer's stitch tags. From that point she works the project — the
   * quest is only the request that started it.
   */
  async function acceptQuest(quest) {
    await addProject({
      title: quest.title,
      note: quest.note || '',
      linked_quest_id: quest.id,
      required_stitches: quest.suggested_stitches || [],
      reference_images: quest.reference_image_url ? [quest.reference_image_url] : [],
    })
    await updateQuest(quest.id, { status: 'accepted' })
    setView('projects')
  }

  /**
   * Logging usage does two writes: it appends to the project's ledger and
   * subtracts the same amount from the stash ball. Quantity is clamped at zero
   * so a mis-typed number can never drive the stash negative, and status is
   * kept in step so the craft engine and the Supply Drop stay honest.
   */
  async function logUsage(project, entries) {
    const merged = [...(project.yarns_used || [])]

    for (const entry of entries) {
      const amount = Number(entry.quantity_used) || 0
      if (amount <= 0) continue

      const ball = stash.find((s) => s.id === entry.stash_id)
      if (!ball) continue

      const remaining = Math.max(0, Math.round(((Number(ball.quantity) || 0) - amount) * 100) / 100)
      await updateYarn(ball.id, {
        quantity: remaining,
        status: remaining === 0 ? 'empty' : remaining <= 1 ? 'low' : 'in_stock',
      })

      const existing = merged.find((y) => y.stash_id === entry.stash_id)
      if (existing) {
        existing.quantity_used =
          Math.round(((Number(existing.quantity_used) || 0) + amount) * 100) / 100
      } else {
        merged.push({
          stash_id: entry.stash_id,
          color: ball.color,
          hex: ball.hex || '',
          quantity_used: amount,
        })
      }
    }

    await updateProject(project.id, { yarns_used: merged })
  }

  return (
    <div className="animate-fade-up">
      <Segmented
        className="mb-4"
        value={view}
        onChange={setView}
        options={[
          { value: 'projects', label: `Active · ${live.length}` },
          {
            value: 'quests',
            label: openQuests.length ? `Anchor quests · ${openQuests.length}` : 'Anchor quests',
          },
        ]}
      />

      {view === 'projects' ? (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <Stat label="On the hook" value={live.length} tone="amber" />
            <Stat label="Finished" value={done.length} tone="mint" />
            <Stat label="Skeins used" value={fmtQty(totalUsed)} />
          </div>

          {openQuests.length > 0 && (
            <button
              onClick={() => setView('quests')}
              className="mb-4 flex w-full items-center gap-3 rounded-xl border border-ember/40 bg-ember-soft/25 p-3.5 text-left"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ember text-white">
                <Icon name="quest" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-tight">
                  {openQuests.length} bount{openQuests.length === 1 ? 'y' : 'ies'} waiting
                </span>
                <span className="block truncate text-[12px] text-muted">
                  {openQuests[0].title}
                  {openQuests.length > 1 ? ` +${openQuests.length - 1} more` : ''}
                </span>
              </span>
              <Icon name="chevron" size={17} className="shrink-0 text-ember" />
            </button>
          )}

          <ChipRow className="mb-4">
            <Chip active={filter === 'in_progress'} onClick={() => setFilter('in_progress')}>
              In progress · {live.length}
            </Chip>
            <Chip active={filter === 'completed'} onClick={() => setFilter('completed')}>
              Finished · {done.length}
            </Chip>
            <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
              Everything
            </Chip>
          </ChipRow>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Icon name="yarn" size={30} />}
              title="No projects yet"
              body="Everything you are making lives here — your own patterns, gifts, experiments, and any bounty you accept from Player 2."
              action={
                <Button variant="primary" onClick={() => setEditing({})}>
                  <Icon name="plus" size={18} />
                  Start a project
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
              {visible.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={() => setEditing(project)}
                  onLog={() => setLogging(project)}
                  onStitch={setOpenStitch}
                  onLifeline={() => setLifeline(project)}
                  onToggleDone={() => {
                    const finishing = project.status !== 'completed'
                    // Finishing a bounty is also finishing the quest, and that
                    // is what earns the Hall of Fame entry — so ask for the
                    // photo rather than silently closing it.
                    if (finishing && project.linked_quest_id) {
                      setCompleting(project)
                      return
                    }
                    updateProject(project.id, {
                      status: finishing ? 'completed' : 'in_progress',
                      completed_at: finishing ? new Date() : null,
                    })
                  }}
                />
              ))}
            </div>
          )}

          <FabSpacer />

          <FloatingButton onClick={() => setEditing({})} aria-label="New project">
            <Icon name="plus" size={26} strokeWidth={2.4} />
          </FloatingButton>
        </>
      ) : (
        <QuestSection
          open={openQuests}
          done={questsDone}
          stash={stash}
          onAccept={acceptQuest}
          onStitch={setOpenStitch}
        />
      )}

      <ProjectEditor
        project={editing}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing?.id) await updateProject(editing.id, data)
          else await addProject(data)
          setEditing(null)
        }}
        onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
      />

      <UsageLogger
        project={logging}
        stash={stash}
        onClose={() => setLogging(null)}
        onSubmit={async (entries) => {
          await logUsage(logging, entries)
          setLogging(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeProject(confirmDelete.id)
          setEditing(null)
        }}
        title="Delete this project?"
        body="Yarn already logged against it stays deducted from your stash."
      />

      <LifelineModal
        open={Boolean(lifeline)}
        onClose={() => setLifeline(null)}
        task={lifeline}
      />

      <StitchQuickView
        stitch={openStitch?.stitch}
        label={openStitch?.label}
        onClose={() => setOpenStitch(null)}
      />

      <CompleteQuestModal
        project={completing}
        onClose={() => setCompleting(null)}
        onSubmit={async ({ photo, caption }) => {
          await updateProject(completing.id, {
            status: 'completed',
            completed_at: new Date(),
            progress_photos: photo
              ? [photo, ...(completing.progress_photos || [])]
              : completing.progress_photos || [],
          })
          await updateQuest(completing.linked_quest_id, {
            status: 'completed',
            completion_photo_url: photo || '',
            date_completed: new Date(),
          })
          await addTrophy({
            title: completing.title,
            quest_id: completing.linked_quest_id,
            kind: 'finished',
            caption,
            image_url: photo || '',
            uploaded_by: profile?.role || 'player1',
          })
          setCompleting(null)
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------- suggested stitches -- */

/**
 * The pills on a bounty.
 *
 * Player 2 cannot tell her which stitches a thing needs, so the analyzer does
 * it from the title when he files it. Tapping one opens the Manual entry for
 * that stitch without leaving the project.
 */
function StitchPills({ labels, onStitch, className }) {
  if (!labels?.length) return null

  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">
        Suggested stitches
      </p>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => {
          const stitch = stitchFromLabel(label)
          return (
            <button
              key={label}
              onClick={() => onStitch({ stitch, label })}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-violet/45 bg-violet-soft/40 px-2.5 text-[12px] font-bold text-violet transition active:scale-[0.97]"
            >
              {stitch && <StitchSymbol name={stitch.symbol} size={13} />}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProjectCard({ project, onEdit, onLog, onToggleDone, onStitch, onLifeline }) {
  const used = project.yarns_used || []
  const cover = project.progress_photos?.[0] || project.reference_images?.[0]
  const done = project.status === 'completed'

  return (
    <Card className="flex flex-col overflow-hidden">
      {cover && (
        <img src={cover} alt="" className="max-h-48 w-full bg-surface-2 object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <button onClick={onEdit} className="w-full text-left">
          {/* Two badges on the title line left about six characters of a real
              project name visible on a phone, so they get their own row. */}
          <h3 className={cx('font-extrabold leading-tight', done && 'line-through')}>
            {project.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {project.linked_quest_id && <Badge tone="ember">Bounty</Badge>}
            <Badge tone={done ? 'mint' : 'amber'} dot>
              {done ? 'Finished' : 'In progress'}
            </Badge>
            <span className="text-[12px] text-faint">{timeAgo(project.created_at)}</span>
          </div>
        </button>

        {project.note && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-muted">{project.note}</p>
        )}

        <StitchPills labels={project.required_stitches} onStitch={onStitch} className="mt-3" />

        {used.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {used.map((y) => (
              <span
                key={y.stash_id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted"
              >
                <ColorDot color={yarnSwatch(y)} size="sm" />
                {y.color} · {fmtQty(y.quantity_used)}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button variant="soft" size="sm" full onClick={onLog}>
            <Icon name="yarn" size={15} />
            Log yarn
          </Button>
          <Button variant={done ? 'soft' : 'mint'} size="sm" full onClick={onToggleDone}>
            {done ? 'Reopen' : 'Finish'}
          </Button>
          {/* Sat next to the task rather than in a menu: the moment she needs
              it is the moment she is already staring at this card. */}
          {!done && onLifeline && <LifelineButton onClick={onLifeline} label="" />}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------- anchor quests -- */

function QuestSection({ open, done, stash, onAccept, onStitch }) {
  return (
    <div className="animate-fade-up">
      {open.length === 0 && done.length === 0 ? (
        <EmptyState
          icon={<Icon name="quest" size={30} />}
          title="No bounties yet"
          body="Player 2 fills this board. When a request lands, it shows up here with the reward attached — accept it and it becomes a project."
        />
      ) : (
        <>
          {open.length > 0 && (
            <section className="mb-7">
              <SectionTitle>Waiting on you · {open.length}</SectionTitle>
              <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
                {open.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    stash={stash}
                    onAccept={() => onAccept(quest)}
                    onStitch={onStitch}
                  />
                ))}
              </div>
            </section>
          )}

          {open.length === 0 && (
            <EmptyState
              icon={<Icon name="check" size={30} />}
              title="All caught up"
              body="Every bounty he has sent is either on your hook or already finished."
            />
          )}

          {done.length > 0 && (
            <section>
              <SectionTitle>Completed · {done.length}</SectionTitle>
              <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
                {done.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} stash={stash} onStitch={onStitch} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function QuestCard({ quest, stash, onAccept, onStitch }) {
  const pattern = quest.pattern_id ? PATTERNS_BY_ID[quest.pattern_id] : null

  // Tells her at a glance whether she can start this one without shopping.
  const craftable = useMemo(
    () => (pattern ? evaluatePattern(pattern, stash) : null),
    [pattern, stash]
  )

  return (
    <Card
      className={cx(
        'flex flex-col overflow-hidden',
        quest.priority === 'high' && quest.status !== 'completed' && 'border-ember/45'
      )}
    >
      {(quest.reference_image_url || quest.completion_photo_url) && (
        <img
          src={quest.completion_photo_url || quest.reference_image_url}
          alt=""
          className="max-h-48 w-full bg-surface-2 object-cover"
        />
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[16px] font-extrabold leading-tight">{quest.title}</h3>
          <QuestStatusBadge status={quest.status} />
        </div>

        <p className="mt-1 text-[12px] text-faint">
          {quest.requested_by || 'Player 2'} · {timeAgo(quest.date_requested || quest.created_at)}
        </p>

        {quest.note && (
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted">{quest.note}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pattern && (
            <>
              <TierBadge tier={pattern.tier} />
              <Badge>{SERIES[pattern.series].label}</Badge>
              <Badge>~{pattern.hours}h</Badge>
            </>
          )}
          {quest.priority === 'high' && quest.status !== 'completed' && (
            <Badge tone="ember" dot>
              Priority
            </Badge>
          )}
        </div>

        <StitchPills labels={quest.suggested_stitches} onStitch={onStitch} className="mt-3.5" />

        {quest.reward && (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber/40 bg-amber-soft/40 px-3 py-2.5">
            <Icon name="trophy" size={17} className="mt-0.5 shrink-0 text-amber" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber">Reward</p>
              <p className="text-[14px] leading-snug text-text">{quest.reward}</p>
            </div>
          </div>
        )}

        {craftable && quest.status !== 'completed' && (
          <div
            className={cx(
              'mt-2.5 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium',
              craftable.status === 'ready' ? 'bg-mint-soft/50 text-mint' : 'bg-surface-2 text-muted'
            )}
          >
            <Icon name={craftable.status === 'ready' ? 'check' : 'cart'} size={15} strokeWidth={2.4} />
            {craftable.status === 'ready'
              ? 'You already have all the yarn for this'
              : `Missing ${craftable.missing.length} colour${craftable.missing.length > 1 ? 's' : ''}`}
          </div>
        )}

        {onAccept && (
          <Button variant="primary" full className="mt-4" onClick={onAccept}>
            <Icon name="check" size={17} strokeWidth={2.4} />
            Accept — start a project
          </Button>
        )}
      </div>
    </Card>
  )
}

/** Finishing a bounty: photo, caption, Hall of Fame. */
function CompleteQuestModal({ project, onClose, onSubmit }) {
  const [photo, setPhoto] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (project && seed !== project) {
    setSeed(project)
    setPhoto('')
    setCaption('')
  }
  if (!project && seed !== null) setSeed(null)

  return (
    <Modal
      open={Boolean(project)}
      onClose={onClose}
      title="Finished it?"
      subtitle={project?.title}
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Not yet
          </Button>
          <Button
            variant="mint"
            full
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await onSubmit({ photo, caption: caption.trim() })
              setBusy(false)
            }}
          >
            Complete it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[15px] leading-relaxed text-muted">
          This closes the bounty too. Add a photo and it goes straight into the Hall of Fame —
          Player 2 sees it the moment you save.
        </p>

        <ImagePicker
          value={photo}
          onChange={setPhoto}
          label="Photo of the finished thing"
          hint="Optional, but this is the fun part"
        />

        <Field label="Caption" hint="optional" htmlFor="complete-caption">
          <Textarea
            id="complete-caption"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="How it went, what fought you, how long it took…"
          />
        </Field>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------- usage logger -- */

const QUICK = [0.25, 0.5, 1, 2]

function UsageLogger({ project, stash, onClose, onSubmit }) {
  const open = Boolean(project)
  const [amounts, setAmounts] = useState({})
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== project) {
    setSeed(project)
    setAmounts({})
  }
  if (!open && seed !== null) setSeed(null)

  const available = stash.filter((s) => (Number(s.quantity) || 0) > 0)
  const entries = Object.entries(amounts)
    .map(([stash_id, quantity_used]) => ({ stash_id, quantity_used: Number(quantity_used) }))
    .filter((e) => e.quantity_used > 0)

  const bump = (id, delta) =>
    setAmounts((a) => {
      const ball = stash.find((s) => s.id === id)
      const cap = Number(ball?.quantity) || 0
      const next = Math.max(0, Math.min(cap, Math.round(((Number(a[id]) || 0) + delta) * 100) / 100))
      return { ...a, [id]: next }
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log yarn used"
      subtitle={project?.title}
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={entries.length === 0}
            onClick={async () => {
              setBusy(true)
              await onSubmit(entries)
              setBusy(false)
            }}
          >
            Subtract from stash
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[13px] leading-relaxed text-muted">
          Half a skein, a quarter — whatever you actually got through. It comes off your stash
          immediately, so Ready to Craft stays truthful.
        </p>

        {available.length === 0 ? (
          <EmptyState
            icon={<Icon name="yarn" size={26} />}
            title="Nothing in the stash"
            body="Add yarn before logging what a project ate."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {available.map((ball) => {
              const value = Number(amounts[ball.id]) || 0
              const left = Math.round(((Number(ball.quantity) || 0) - value) * 100) / 100
              return (
                <div
                  key={ball.id}
                  className={cx(
                    'rounded-xl border p-3 transition',
                    value > 0 ? 'border-ember bg-ember-soft/25' : 'border-border bg-surface'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ColorDot color={yarnSwatch(ball)} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold leading-tight">{ball.color}</p>
                      <p className="text-[12px] text-muted">
                        {ball.weight} · {fmtQty(ball.quantity)} in stash
                        {value > 0 && (
                          <span className={cx('font-bold', left === 0 ? 'text-ember' : 'text-amber')}>
                            {' '}
                            → {fmtQty(left)} left
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-bg p-0.5">
                      <button
                        onClick={() => bump(ball.id, -0.25)}
                        disabled={value === 0}
                        aria-label={`Use less ${ball.color}`}
                        className="grid size-9 place-items-center rounded-lg text-muted disabled:opacity-30"
                      >
                        <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
                          <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                      <span className="w-10 text-center text-[14px] font-extrabold tabular-nums">
                        {fmtQty(value)}
                      </span>
                      <button
                        onClick={() => bump(ball.id, 0.25)}
                        aria-label={`Use more ${ball.color}`}
                        className="grid size-9 place-items-center rounded-lg text-muted"
                      >
                        <Icon name="plus" size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-1.5">
                    {QUICK.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() =>
                          setAmounts((a) => ({
                            ...a,
                            [ball.id]: Math.min(Number(ball.quantity) || 0, q),
                          }))
                        }
                        className="min-h-8 flex-1 rounded-lg border border-border bg-surface-2 text-[12px] font-bold text-muted transition hover:text-text"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}

/* -------------------------------------------------------------- editor -- */

function ProjectEditor({ project, onClose, onSave, onDelete }) {
  const open = Boolean(project)
  const isEdit = Boolean(project?.id)

  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [refs, setRefs] = useState([])
  const [photos, setPhotos] = useState([])
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== project) {
    setSeed(project)
    setTitle(project.title || '')
    setNote(project.note || '')
    setRefs(project.reference_images || [])
    setPhotos(project.progress_photos || [])
  }
  if (!open && seed !== null) setSeed(null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'New project'}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete} aria-label="Delete project">
              <Icon name="trash" size={18} />
            </Button>
          )}
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!title.trim()}
            onClick={async () => {
              setBusy(true)
              await onSave({
                title: title.trim(),
                note: note.trim(),
                reference_images: refs,
                progress_photos: photos,
              })
              setBusy(false)
            }}
          >
            {isEdit ? 'Save' : 'Start it'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="What are you making?" htmlFor="proj-title">
          <Input
            id="proj-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bee keychain for Mira"
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="Notes" hint="optional" htmlFor="proj-note">
          <Textarea
            id="proj-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hook size, where the pattern came from, changes you made…"
          />
        </Field>

        <PhotoStrip
          label="Reference images"
          hint="what you are aiming at"
          value={refs}
          onChange={setRefs}
        />
        <PhotoStrip
          label="Progress photos"
          hint="the first one becomes the cover"
          value={photos}
          onChange={setPhotos}
        />
      </div>
    </Modal>
  )
}

function PhotoStrip({ label, hint, value, onChange }) {
  const [adding, setAdding] = useState(false)

  return (
    <Field label={label} hint={hint}>
      {value.length > 0 && (
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
          {value.map((src, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={src}
                alt=""
                className="size-24 rounded-xl border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full border-2 border-bg-elevated bg-ember text-white"
              >
                <svg viewBox="0 0 20 20" className="size-3" aria-hidden="true">
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <ImagePicker
          value=""
          label="Choose a photo"
          onChange={(url) => {
            if (url) onChange([...value, url])
            setAdding(false)
          }}
        />
      ) : (
        <Button variant="outline" size="sm" full onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} />
          Add photo
        </Button>
      )}
    </Field>
  )
}
