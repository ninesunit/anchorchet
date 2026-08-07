import { useMemo, useState } from 'react'

import { ColorDot, StashStatusBadge } from '../../components/ui/Badge'
import { Button, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, Stat } from '../../components/ui/Card'
import { Chip, ChipRow, Field, Input, Select, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import {
  colorFamily,
  FAMILY_LABEL,
  WEIGHTS,
  YARN_SWATCHES,
  yarnSwatch,
} from '../../data/colors'
import { stashSummary } from '../../data/engine'
import { cx } from '../../lib/utils'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in_stock', label: 'In stock' },
  { value: 'low', label: 'Low' },
  { value: 'empty', label: 'Empty' },
]

export function YarnStash() {
  const { stash, addYarn, updateYarn, removeYarn } = useData()

  const [statusFilter, setStatusFilter] = useState('all')
  const [weightFilter, setWeightFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const summary = useMemo(() => stashSummary(stash), [stash])

  const visible = useMemo(
    () =>
      stash.filter(
        (y) =>
          (statusFilter === 'all' || y.status === statusFilter) &&
          (weightFilter === 'all' || y.weight === weightFilter)
      ),
    [stash, statusFilter, weightFilter]
  )

  const weightsInUse = useMemo(
    () => WEIGHTS.filter((w) => stash.some((y) => y.weight === w)),
    [stash]
  )

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Balls" value={summary.balls} />
        <Stat label="Colours" value={summary.colors} />
        <Stat
          label="Need restock"
          value={summary.low + summary.empty}
          tone={summary.low + summary.empty > 0 ? 'amber' : 'default'}
        />
      </div>

      <ChipRow className="mb-2.5">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            active={statusFilter === f.value}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </ChipRow>

      {weightsInUse.length > 1 && (
        <ChipRow className="mb-4">
          <Chip active={weightFilter === 'all'} onClick={() => setWeightFilter('all')}>
            Any weight
          </Chip>
          {weightsInUse.map((w) => (
            <Chip key={w} active={weightFilter === w} onClick={() => setWeightFilter(w)}>
              {w}
            </Chip>
          ))}
        </ChipRow>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="yarn" size={30} />}
          title={stash.length === 0 ? 'No yarn logged yet' : 'Nothing matches that filter'}
          body={
            stash.length === 0
              ? 'Add what you already own and the Ready to Craft tab starts working immediately.'
              : 'Try a different status or weight.'
          }
          action={
            stash.length === 0 && (
              <Button variant="primary" onClick={() => setEditing({})}>
                <Icon name="plus" size={18} />
                Add yarn
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
          {visible.map((yarn) => (
            <YarnRow
              key={yarn.id}
              yarn={yarn}
              onEdit={() => setEditing(yarn)}
              onQuantity={(next) =>
                updateYarn(yarn.id, {
                  quantity: next,
                  // Keep status honest with the count so the Supply Drop and
                  // the craft engine never disagree with what's on screen.
                  status: next === 0 ? 'empty' : next <= 1 ? 'low' : 'in_stock',
                })
              }
            />
          ))}
        </div>
      )}

      <FloatingButton onClick={() => setEditing({})} aria-label="Add yarn">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </FloatingButton>

      <YarnEditor
        yarn={editing}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing?.id) await updateYarn(editing.id, data)
          else await addYarn(data)
          setEditing(null)
        }}
        onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeYarn(confirmDelete.id)
          setEditing(null)
        }}
        title="Remove this yarn?"
        body={`"${confirmDelete?.color}" will be deleted from your stash. This can't be undone.`}
        confirmLabel="Remove"
      />
    </div>
  )
}

function YarnRow({ yarn, onEdit, onQuantity }) {
  const family = colorFamily(yarn.color)
  const qty = Number(yarn.quantity) || 0

  return (
    <Card className="flex items-center gap-3 p-3">
      <ColorDot color={yarnSwatch(yarn)} size="lg" />

      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate font-bold leading-tight">{yarn.color}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
          <span>{yarn.weight}</span>
          {yarn.brand && <span className="text-faint">· {yarn.brand}</span>}
          {family && <span className="text-faint">· {FAMILY_LABEL[family]}</span>}
        </p>
      </button>

      {yarn.status !== 'in_stock' && <StashStatusBadge status={yarn.status} />}

      <div className="flex items-center gap-1 rounded-xl border border-border bg-bg p-0.5">
        <button
          onClick={() => onQuantity(Math.max(0, qty - 1))}
          disabled={qty === 0}
          aria-label={`Use one ball of ${yarn.color}`}
          className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text disabled:opacity-30"
        >
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
            <path d="M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="w-6 text-center text-[15px] font-extrabold tabular-nums">{qty}</span>
        <button
          onClick={() => onQuantity(qty + 1)}
          aria-label={`Add one ball of ${yarn.color}`}
          className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <Icon name="plus" size={16} strokeWidth={2.4} />
        </button>
      </div>
    </Card>
  )
}

function YarnEditor({ yarn, onClose, onSave, onDelete }) {
  const open = Boolean(yarn)
  const isEdit = Boolean(yarn?.id)

  const [color, setColor] = useState('')
  const [hex, setHex] = useState('')
  const [weight, setWeight] = useState('DK')
  const [quantity, setQuantity] = useState('1')
  const [status, setStatus] = useState('in_stock')
  const [brand, setBrand] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  // Re-seed the form each time a different yarn opens the sheet.
  const [seed, setSeed] = useState(null)
  if (open && seed !== yarn) {
    setSeed(yarn)
    setColor(yarn.color || '')
    setHex(yarn.hex || '')
    setWeight(yarn.weight || 'DK')
    setQuantity(String(yarn.quantity ?? 1))
    setStatus(yarn.status || 'in_stock')
    setBrand(yarn.brand || '')
    setNote(yarn.note || '')
  }
  if (!open && seed !== null) setSeed(null)

  const family = colorFamily(color)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    const qty = Math.max(0, Number(quantity) || 0)
    await onSave({
      color: color.trim(),
      hex,
      weight,
      quantity: qty,
      status: qty === 0 ? 'empty' : status,
      brand: brand.trim(),
      note: note.trim(),
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit yarn' : 'Add yarn'}
      subtitle={isEdit ? undefined : 'What do you already have in the basket?'}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" size="md" onClick={onDelete} aria-label="Remove yarn">
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
            disabled={!color.trim()}
            onClick={submit}
            type="submit"
          >
            {isEdit ? 'Save' : 'Add to stash'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4 pb-2">
        <Field
          label="Colour"
          // Nothing typed yet is not the same as "unrecognised" — stay quiet
          // until there is actually something to judge.
          hint={
            !color.trim()
              ? undefined
              : family
                ? `Reads as ${FAMILY_LABEL[family]}`
                : 'Unrecognised colour'
          }
          htmlFor="yarn-color"
        >
          <div className="flex items-center gap-2.5">
            <ColorDot color={yarnSwatch({ color, hex })} size="lg" />
            <Input
              id="yarn-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Dusty Rose, Cobalt Blue"
              required
              autoCapitalize="words"
            />
          </div>

          {color.trim() && !family && (
            <p className="mt-1.5 text-[12px] leading-snug text-amber">
              The craft engine matches on colour names — pick one below, or include a basic colour
              word like &ldquo;blue&rdquo; or &ldquo;cream&rdquo; so this ball gets counted.
            </p>
          )}

          <SwatchPicker
            color={color}
            hex={hex}
            onPick={(swatch) => {
              setColor(swatch.name)
              setHex(swatch.hex)
            }}
            onHex={setHex}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Weight" htmlFor="yarn-weight">
            <Select id="yarn-weight" value={weight} onChange={(e) => setWeight(e.target.value)}>
              {WEIGHTS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Balls" htmlFor="yarn-qty">
            <Input
              id="yarn-qty"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Status" htmlFor="yarn-status">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_FILTERS.slice(1).map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={cx(
                  'min-h-11 rounded-xl border-2 text-[13px] font-bold transition',
                  status === s.value
                    ? 'border-ember bg-ember-soft/50 text-ember'
                    : 'border-border bg-surface text-muted hover:border-border-strong'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {status === 'empty' && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-amber">
              <Icon name="cart" size={14} />
              This lands on Player 2&rsquo;s Supply Drop list.
            </p>
          )}
        </Field>

        <Field label="Brand" hint="optional" htmlFor="yarn-brand">
          <Input
            id="yarn-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Ricorumi, Paintbox"
            autoCapitalize="words"
          />
        </Field>

        <Field label="Note" hint="optional" htmlFor="yarn-note">
          <Textarea
            id="yarn-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Dye lot, where you bought it, what it's earmarked for…"
          />
        </Field>

        {/* Lets the iOS keyboard's "Go" key submit the form */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
      </form>
    </Modal>
  )
}

/**
 * Tap-to-pick colour palette.
 *
 * Picking sets the *name* as well as the shade, because the craft engine
 * matches on names — a bare hex would look right and silently never match a
 * pattern. The eyedropper is display-only polish on top of that.
 */
function SwatchPicker({ color, hex, onPick, onHex }) {
  const selected = YARN_SWATCHES.find((s) => s.name.toLowerCase() === color.trim().toLowerCase())

  return (
    <div className="mt-3 rounded-xl border border-border bg-surface-2/50 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <span className="text-[12px] font-semibold text-muted">Pick a colour</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-semibold text-muted">
          Exact shade
          <input
            type="color"
            value={hex || '#c9c2d1'}
            onChange={(e) => onHex(e.target.value)}
            aria-label="Fine-tune the exact shade"
            className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
          />
        </label>
      </div>

      <div className="scroll-y grid max-h-44 grid-cols-2 gap-1.5 sm:grid-cols-3">
        {YARN_SWATCHES.map((swatch) => {
          const active = selected?.name === swatch.name
          return (
            <button
              key={swatch.name}
              type="button"
              onClick={() => onPick(swatch)}
              aria-pressed={active}
              className={cx(
                'flex min-h-10 items-center gap-2 rounded-lg border px-2 text-left text-[12px] font-semibold transition',
                active
                  ? 'border-ember bg-ember-soft/50 text-text'
                  : 'border-transparent bg-surface text-muted hover:border-border-strong'
              )}
            >
              <span
                className="size-5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15"
                style={{ background: swatch.hex }}
              />
              <span className="truncate">{swatch.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
