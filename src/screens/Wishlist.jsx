import { useMemo, useState } from 'react'

import { Badge, ColorDot } from '../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../components/ui/Button'
import { Card, EmptyState, Stat } from '../components/ui/Card'
import { Chip, ChipRow, Field, Input, Select, Textarea } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { WEIGHTS, YARN_SWATCHES, yarnSwatch } from '../data/colors'
import { cx, timeAgo } from '../lib/utils'

const KINDS = {
  yarn: { id: 'yarn', label: 'Yarn', icon: 'yarn' },
  kit: { id: 'kit', label: 'Kit', icon: 'quest' },
  tool: { id: 'tool', label: 'Tool', icon: 'target' },
  other: { id: 'other', label: 'Other', icon: 'cart' },
}

/** Shopee / TikTok links are long and ugly; show the shop, not the tracking soup. */
function shopLabel(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('shopee')) return 'Shopee'
    if (host.includes('tiktok')) return 'TikTok Shop'
    if (host.includes('lazada')) return 'Lazada'
    if (host.includes('shope.ee')) return 'Shopee'
    return host
  } catch {
    return 'Link'
  }
}

function normalizeUrl(raw) {
  const t = (raw || '').trim()
  if (!t) return ''
  // People paste "shopee.com.my/..." without a scheme; an href without one is
  // treated as a relative path and navigates inside the app.
  if (!/^https?:\/\//i.test(t)) return `https://${t}`
  return t
}

/**
 * One list, two framings. She adds things she wants; he sees the same documents
 * as a buying queue. Sharing the component means the two views can never drift.
 */
export function Wishlist() {
  const { wishlist, addWish, updateWish, removeWish, addYarn } = useData()
  const { isPlayer2 } = useAuth()

  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [filter, setFilter] = useState('pending')

  const pending = wishlist.filter((w) => w.status !== 'purchased')
  const purchased = wishlist.filter((w) => w.status === 'purchased')
  const visible = filter === 'pending' ? pending : filter === 'purchased' ? purchased : wishlist

  const totalGuess = useMemo(
    () => pending.reduce((n, w) => n + (Number(w.price) || 0), 0),
    [pending]
  )

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Wanted" value={pending.length} tone="ember" />
        <Stat label="Bought" value={purchased.length} tone="mint" />
        <Stat
          label="Rough total"
          value={totalGuess ? `RM${Math.round(totalGuess)}` : '—'}
        />
      </div>

      {isPlayer2 && pending.length > 0 && (
        <Card className="mb-4 flex items-start gap-3 border-ember/35 bg-ember-soft/25 p-3.5">
          <Icon name="cart" size={19} className="mt-0.5 shrink-0 text-ember" />
          <p className="text-[13px] leading-snug text-text">
            Tap a link to open the shop. Marking it bought moves it out of her list, and yarn
            items drop straight into her stash.
          </p>
        </Card>
      )}

      <ChipRow className="mb-4">
        <Chip active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Wanted · {pending.length}
        </Chip>
        <Chip active={filter === 'purchased'} onClick={() => setFilter('purchased')}>
          Bought · {purchased.length}
        </Chip>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Everything
        </Chip>
      </ChipRow>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="cart" size={30} />}
          title={filter === 'purchased' ? 'Nothing bought yet' : 'Nothing on the list'}
          body={
            isPlayer2
              ? 'When she adds something she wants, it lands here with the link.'
              : 'Paste a Shopee or TikTok link for the exact yarn or kit you want and it goes straight to Player 2.'
          }
          action={
            !isPlayer2 && (
              <Button variant="primary" onClick={() => setEditing({})}>
                <Icon name="plus" size={18} />
                Add something
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
          {visible.map((item) => (
            <WishRow
              key={item.id}
              item={item}
              isPlayer2={isPlayer2}
              onEdit={() => setEditing(item)}
              onToggle={async () => {
                const nowPurchased = item.status !== 'purchased'
                await updateWish(item.id, {
                  status: nowPurchased ? 'purchased' : 'pending',
                  purchased_date: nowPurchased ? new Date() : null,
                })
                // Buying yarn should land in the stash without a second step —
                // that is the whole point of the pipeline.
                if (nowPurchased && item.kind === 'yarn' && item.color) {
                  await addYarn({
                    color: item.color,
                    hex: item.hex || '',
                    weight: item.weight || 'DK',
                    quantity: Number(item.quantity) || 1,
                    status: 'in_stock',
                    note: `From the wishlist${item.title ? ` — ${item.title}` : ''}`,
                  })
                }
              }}
            />
          ))}
        </div>
      )}

      {!isPlayer2 && (
        <>
          <FabSpacer />
          <FloatingButton onClick={() => setEditing({})} aria-label="Add to wishlist">
            <Icon name="plus" size={26} strokeWidth={2.4} />
          </FloatingButton>
        </>
      )}

      <WishEditor
        item={editing}
        onClose={() => setEditing(null)}
        onSave={async (data) => {
          if (editing?.id) await updateWish(editing.id, data)
          else await addWish(data)
          setEditing(null)
        }}
        onDelete={editing?.id ? () => setConfirmDelete(editing) : null}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeWish(confirmDelete.id)
          setEditing(null)
        }}
        title="Remove from the list?"
        body={`"${confirmDelete?.title}" comes off the wishlist.`}
        confirmLabel="Remove"
      />
    </div>
  )
}

function WishRow({ item, isPlayer2, onEdit, onToggle }) {
  const bought = item.status === 'purchased'
  const shop = shopLabel(item.url)
  const kind = KINDS[item.kind] ?? KINDS.other

  return (
    <Card className={cx('flex items-center gap-3 p-3.5', bought && 'opacity-70')}>
      {item.kind === 'yarn' ? (
        <ColorDot color={yarnSwatch({ color: item.color, hex: item.hex })} size="lg" />
      ) : (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
          <Icon name={kind.icon} size={18} />
        </span>
      )}

      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className={cx('truncate font-bold leading-tight', bought && 'line-through')}>
          {item.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
          {item.kind === 'yarn' && item.weight && <span>{item.weight}</span>}
          {item.price ? <span className="text-faint">RM{item.price}</span> : null}
          <span className="text-faint">{timeAgo(item.added_date)}</span>
        </p>
        {item.note && (
          <p className="mt-1 truncate text-[12px] text-faint">{item.note}</p>
        )}
      </button>

      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[12px] font-bold text-muted transition hover:text-text"
        >
          {shop}
          <Icon name="share" size={13} />
        </a>
      )}

      {isPlayer2 ? (
        <Button variant={bought ? 'soft' : 'mint'} size="sm" onClick={onToggle}>
          {bought ? 'Undo' : 'Bought'}
        </Button>
      ) : (
        bought && <Badge tone="mint">Bought</Badge>
      )}
    </Card>
  )
}

function WishEditor({ item, onClose, onSave, onDelete }) {
  const open = Boolean(item)
  const isEdit = Boolean(item?.id)

  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [kind, setKind] = useState('yarn')
  const [color, setColor] = useState('')
  const [hex, setHex] = useState('')
  const [weight, setWeight] = useState('DK')
  const [quantity, setQuantity] = useState('1')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== item) {
    setSeed(item)
    setTitle(item.title || '')
    setUrl(item.url || '')
    setKind(item.kind || 'yarn')
    setColor(item.color || '')
    setHex(item.hex || '')
    setWeight(item.weight || 'DK')
    setQuantity(String(item.quantity ?? 1))
    setPrice(item.price ? String(item.price) : '')
    setNote(item.note || '')
  }
  if (!open && seed !== null) setSeed(null)

  async function submit() {
    setBusy(true)
    await onSave({
      title: title.trim(),
      url: normalizeUrl(url),
      kind,
      color: kind === 'yarn' ? color.trim() : '',
      hex: kind === 'yarn' ? hex : '',
      weight: kind === 'yarn' ? weight : '',
      quantity: Number(quantity) || 1,
      price: price === '' ? null : Number(price),
      note: note.trim(),
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit item' : 'Add to wishlist'}
      subtitle={isEdit ? undefined : 'Player 2 sees this straight away'}
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete} aria-label="Remove item">
              <Icon name="trash" size={18} />
            </Button>
          )}
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" full loading={busy} disabled={!title.trim()} onClick={submit}>
            {isEdit ? 'Save' : 'Add it'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="What is it?" htmlFor="wish-title">
          <Input
            id="wish-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ricorumi DK — Lavender"
            autoCapitalize="sentences"
          />
        </Field>

        <Field
          label="Link"
          hint="Shopee, TikTok Shop, anywhere"
          htmlFor="wish-url"
        >
          <Input
            id="wish-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://shopee.com.my/..."
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            type="url"
          />
          <p className="mt-1.5 text-[12px] leading-snug text-faint">
            Paste straight from the share sheet — https:// gets added if you leave it off.
          </p>
        </Field>

        <Field label="Type">
          <div className="grid grid-cols-4 gap-2">
            {Object.values(KINDS).map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                aria-pressed={kind === k.id}
                className={cx(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-[12px] font-bold transition',
                  kind === k.id
                    ? 'border-ember bg-ember-soft/40 text-ember'
                    : 'border-border bg-surface text-muted'
                )}
              >
                <Icon name={k.icon} size={16} />
                {k.label}
              </button>
            ))}
          </div>
        </Field>

        {kind === 'yarn' && (
          <>
            <Field
              label="Colour"
              hint="so it can drop into your stash when bought"
              htmlFor="wish-color"
            >
              <div className="flex items-center gap-2.5">
                <ColorDot color={yarnSwatch({ color, hex })} size="lg" />
                <Input
                  id="wish-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Lavender"
                  autoCapitalize="words"
                />
              </div>
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {YARN_SWATCHES.map((sw) => (
                  <button
                    key={sw.name}
                    type="button"
                    onClick={() => {
                      setColor(sw.name)
                      setHex(sw.hex)
                    }}
                    aria-label={sw.name}
                    className={cx(
                      'size-8 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15',
                      color === sw.name && 'ring-2 ring-ember'
                    )}
                    style={{ background: sw.hex }}
                  />
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Weight" htmlFor="wish-weight">
                <Select id="wish-weight" value={weight} onChange={(e) => setWeight(e.target.value)}>
                  {WEIGHTS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="How many" htmlFor="wish-qty">
                <Input
                  id="wish-qty"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
            </div>
          </>
        )}

        <Field label="Rough price" hint="optional, RM" htmlFor="wish-price">
          <Input
            id="wish-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="18.90"
          />
        </Field>

        <Field label="Note" hint="optional" htmlFor="wish-note">
          <Textarea
            id="wish-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="The 25g one, not the big skein"
          />
        </Field>
      </div>
    </Modal>
  )
}
