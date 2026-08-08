import { useMemo, useState } from 'react'

import { Badge } from '../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../components/ui/Button'
import { Card, EmptyState, Stat } from '../components/ui/Card'
import { Chip, ChipRow, Field, Input, Select, Textarea } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ImagePicker } from '../components/ui/ImagePicker'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { cx, formatDateLong, timeAgo } from '../lib/utils'

const KIND = {
  finished: { label: 'Finished', tone: 'mint', icon: 'trophy' },
  in_use: { label: 'In the wild', tone: 'ember', icon: 'flame' },
}

/**
 * Shared between both players. She posts the finished object; he posts proof
 * that it's being used — which is the whole point of the module, so the two
 * kinds are filterable but deliberately live in one stream.
 */
export function HallOfFame() {
  const { hallOfFame, quests, addTrophy, removeTrophy } = useData()
  const { profile, isPlayer2 } = useAuth()

  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const visible = useMemo(
    () => (filter === 'all' ? hallOfFame : hallOfFame.filter((t) => t.kind === filter)),
    [hallOfFame, filter]
  )

  const counts = {
    finished: hallOfFame.filter((t) => t.kind === 'finished').length,
    inUse: hallOfFame.filter((t) => t.kind === 'in_use').length,
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Trophies" value={hallOfFame.length} tone="amber" />
        <Stat label="Finished" value={counts.finished} tone="mint" />
        <Stat label="In the wild" value={counts.inUse} tone="ember" />
      </div>

      {isPlayer2 && (
        <Card className="mb-4 flex items-start gap-3 border-ember/35 bg-ember-soft/25 p-3.5">
          <Icon name="flame" size={19} className="mt-0.5 shrink-0 text-ember" />
          <p className="text-[13px] leading-snug text-text">
            Post a photo of yourself actually <strong>using</strong> something she made. That is
            the part that makes the hours count.
          </p>
        </Card>
      )}

      <ChipRow className="mb-4">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          Everything
        </Chip>
        <Chip active={filter === 'finished'} onClick={() => setFilter('finished')}>
          Finished pieces
        </Chip>
        <Chip active={filter === 'in_use'} onClick={() => setFilter('in_use')}>
          In the wild
        </Chip>
      </ChipRow>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="trophy" size={30} />}
          title={hallOfFame.length === 0 ? 'Nothing in here yet' : 'Nothing under that filter'}
          body={
            hallOfFame.length === 0
              ? 'Finished projects land here automatically when a quest is completed. You can also add one by hand.'
              : 'Try another filter.'
          }
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Icon name="plus" size={18} />
              Add a photo
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-3">
          {visible.map((trophy) => (
            <TrophyTile key={trophy.id} trophy={trophy} onClick={() => setViewing(trophy)} />
          ))}
        </div>
      )}

      <FabSpacer />

      <FloatingButton onClick={() => setAdding(true)} aria-label="Add to Hall of Fame">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </FloatingButton>

      <AddTrophyModal
        open={adding}
        onClose={() => setAdding(false)}
        quests={quests}
        defaultKind={isPlayer2 ? 'in_use' : 'finished'}
        onSubmit={async (data) => {
          await addTrophy({ ...data, uploaded_by: profile?.role || 'player1' })
          setAdding(false)
        }}
      />

      <TrophyViewer
        trophy={viewing}
        onClose={() => setViewing(null)}
        onDelete={() => setConfirmDelete(viewing)}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeTrophy(confirmDelete.id)
          setViewing(null)
        }}
        title="Remove from the Hall of Fame?"
        body="The photo and caption will be deleted."
        confirmLabel="Remove"
      />
    </div>
  )
}

function TrophyTile({ trophy, onClick }) {
  const meta = KIND[trophy.kind] ?? KIND.finished

  return (
    <Card
      as="button"
      interactive
      onClick={onClick}
      className="flex w-full flex-col overflow-hidden text-left"
    >
      <div className="relative aspect-square w-full bg-surface-2">
        {trophy.image_url ? (
          <img src={trophy.image_url} alt={trophy.title} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-faint">
            <Icon name="image" size={28} />
          </div>
        )}
        <span
          className={cx(
            'absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur',
            trophy.kind === 'in_use'
              ? 'bg-ember/90 text-white'
              : 'bg-mint/90 text-[#05231f]'
          )}
        >
          <Icon name={meta.icon} size={11} strokeWidth={2.4} />
          {meta.label}
        </span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-[13px] font-bold leading-tight">{trophy.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-faint">{timeAgo(trophy.created_at)}</p>
      </div>
    </Card>
  )
}

function TrophyViewer({ trophy, onClose, onDelete }) {
  if (!trophy) return <Modal open={false} onClose={onClose} title="" />

  const meta = KIND[trophy.kind] ?? KIND.finished

  return (
    <Modal
      open
      onClose={onClose}
      title={trophy.title}
      subtitle={formatDateLong(trophy.created_at)}
      footer={
        <>
          <Button variant="danger" onClick={onDelete} aria-label="Remove">
            <Icon name="trash" size={18} />
          </Button>
          <Button variant="soft" full onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 pb-2">
        {trophy.image_url && (
          <img
            src={trophy.image_url}
            alt={trophy.title}
            className="w-full rounded-xl border border-border bg-surface-2 object-contain"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>
            {meta.label}
          </Badge>
          <Badge>
            {trophy.uploaded_by === 'player2' ? 'Posted by Player 2' : 'Posted by Player 1'}
          </Badge>
        </div>
        {trophy.caption && (
          <p className="text-[15px] leading-relaxed text-muted">{trophy.caption}</p>
        )}
      </div>
    </Modal>
  )
}

function AddTrophyModal({ open, onClose, onSubmit, quests, defaultKind }) {
  const [kind, setKind] = useState(defaultKind)
  const [title, setTitle] = useState('')
  const [questId, setQuestId] = useState('')
  const [caption, setCaption] = useState('')
  const [photo, setPhoto] = useState('')
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setKind(defaultKind)
    setTitle('')
    setQuestId('')
    setCaption('')
    setPhoto('')
  }
  if (!open && wasOpen) setWasOpen(false)

  const completed = quests.filter((q) => q.status === 'completed')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add to the Hall of Fame"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!title.trim() && !questId}
            onClick={async () => {
              setBusy(true)
              const linked = completed.find((q) => q.id === questId)
              await onSubmit({
                kind,
                title: title.trim() || linked?.title || 'Untitled',
                quest_id: questId || null,
                caption: caption.trim(),
                image_url: photo,
              })
              setBusy(false)
            }}
          >
            Post it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="What kind of photo?">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(KIND).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setKind(key)}
                className={cx(
                  'flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 text-[13px] font-bold transition',
                  kind === key
                    ? 'border-ember bg-ember-soft/50 text-ember'
                    : 'border-border bg-surface text-muted hover:border-border-strong'
                )}
              >
                <Icon name={meta.icon} size={16} />
                {meta.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-faint">
            {kind === 'in_use'
              ? 'A photo of the thing being worn, carried, or sat on a desk.'
              : 'The freshly finished piece.'}
          </p>
        </Field>

        <ImagePicker value={photo} onChange={setPhoto} label="Add photo" />

        {completed.length > 0 && (
          <Field label="Link to a completed quest" hint="optional" htmlFor="hof-quest">
            <Select
              id="hof-quest"
              value={questId}
              onChange={(e) => {
                setQuestId(e.target.value)
                const q = completed.find((x) => x.id === e.target.value)
                if (q && !title.trim()) setTitle(q.title)
              }}
            >
              <option value="">Not linked</option>
              {completed.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Title" htmlFor="hof-title">
          <Input
            id="hof-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Blue Tactibear"
            autoCapitalize="words"
          />
        </Field>

        <Field label="Caption" hint="optional" htmlFor="hof-caption">
          <Textarea
            id="hof-caption"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              kind === 'in_use'
                ? 'Where it lives now, who noticed it…'
                : 'How it went, what you learned…'
            }
          />
        </Field>
      </div>
    </Modal>
  )
}
