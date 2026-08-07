import { useState } from 'react'

import { Badge, ColorDot } from '../../components/ui/Badge'
import { Button, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, Stat } from '../../components/ui/Card'
import { Chip, ChipRow, Field, Input, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import { yarnSwatch } from '../../data/colors'
import { cx, fmtQty, timeAgo } from '../../lib/utils'

export function Projects() {
  const { projects, stash, addProject, updateProject, removeProject, updateYarn } = useData()

  const [editing, setEditing] = useState(null)
  const [logging, setLogging] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filter, setFilter] = useState('in_progress')

  const live = projects.filter((p) => p.status !== 'completed')
  const done = projects.filter((p) => p.status === 'completed')
  const visible = filter === 'in_progress' ? live : filter === 'completed' ? done : projects

  const totalUsed = projects.reduce(
    (n, p) => n + (p.yarns_used || []).reduce((m, y) => m + (Number(y.quantity_used) || 0), 0),
    0
  )

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
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="On the hook" value={live.length} tone="amber" />
        <Stat label="Finished" value={done.length} tone="mint" />
        <Stat label="Skeins used" value={fmtQty(totalUsed)} />
      </div>

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
          body="Anything you are making that is not from the catalogue lives here — your own patterns, gifts, experiments."
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
              onToggleDone={() =>
                updateProject(project.id, {
                  status: project.status === 'completed' ? 'in_progress' : 'completed',
                  completed_at: project.status === 'completed' ? null : new Date(),
                })
              }
            />
          ))}
        </div>
      )}

      <FloatingButton onClick={() => setEditing({})} aria-label="New project">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </FloatingButton>

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
    </div>
  )
}

function ProjectCard({ project, onEdit, onLog, onToggleDone }) {
  const used = project.yarns_used || []
  const cover = project.progress_photos?.[0] || project.reference_images?.[0]
  const done = project.status === 'completed'

  return (
    <Card className="flex flex-col overflow-hidden">
      {cover && (
        <img src={cover} alt="" className="max-h-48 w-full bg-surface-2 object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onEdit} className="min-w-0 flex-1 text-left">
            <h3 className={cx('truncate font-extrabold leading-tight', done && 'line-through')}>
              {project.title}
            </h3>
            <p className="mt-0.5 text-[12px] text-faint">{timeAgo(project.created_at)}</p>
          </button>
          <Badge tone={done ? 'mint' : 'amber'} dot>
            {done ? 'Finished' : 'In progress'}
          </Badge>
        </div>

        {project.note && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-muted">{project.note}</p>
        )}

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

        <div className="mt-4 flex gap-2">
          <Button variant="soft" size="sm" full onClick={onLog}>
            <Icon name="yarn" size={15} />
            Log yarn
          </Button>
          <Button variant={done ? 'soft' : 'mint'} size="sm" full onClick={onToggleDone}>
            {done ? 'Reopen' : 'Finish'}
          </Button>
        </div>
      </div>
    </Card>
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
