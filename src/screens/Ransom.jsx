import { useState } from 'react'

import { LifelineButton, LifelineModal } from '../components/LifelineModal'
import { Badge } from '../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../components/ui/Card'
import { Field, Input, Textarea } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ImagePicker } from '../components/ui/ImagePicker'
import { ConfirmDialog, Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { cx, timeAgo } from '../lib/utils'

/**
 * The Mystery Ransom.
 *
 * A chore with something of his behind it — a photo she cannot see until it is
 * done. The two rules that make it work rather than just being a gimmick:
 *
 * She cannot unlock it herself. Self-marking a chore complete is exactly the
 * step that quietly stops happening, so the unlock is his to give, which turns
 * finishing into telling someone rather than ticking a box.
 *
 * And the blur is real. The photo URL is on the document from the start — this
 * is a game between two people who trust each other, not a security boundary,
 * and pretending otherwise would mean a round trip before the reveal could
 * animate. It is a curtain, and it is meant to feel like one.
 */

const STATUS = {
  pending: { label: 'Not started', tone: 'neutral' },
  submitted_for_approval: { label: 'Waiting on him', tone: 'amber' },
  revealed: { label: 'Unlocked', tone: 'mint' },
}

export function Ransom() {
  const { ransomTasks, addRansomTask, updateRansomTask, removeRansomTask } = useData()
  const { isPlayer2 } = useAuth()

  const [composing, setComposing] = useState(false)
  const [proving, setProving] = useState(null)
  const [reviewing, setReviewing] = useState(null)
  const [lifeline, setLifeline] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const open = ransomTasks.filter((t) => t.status === 'pending')
  const waiting = ransomTasks.filter((t) => t.status === 'submitted_for_approval')
  const done = ransomTasks.filter((t) => t.status === 'revealed')

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Locked" value={open.length} tone="ember" />
        <Stat label="Waiting" value={waiting.length} tone="amber" />
        <Stat label="Unlocked" value={done.length} tone="mint" />
      </div>

      {isPlayer2 && waiting.length > 0 && (
        <Card className="mb-5 flex items-start gap-3 border-amber/45 bg-amber-soft/30 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber text-[#2a1a00]">
            <Icon name="bell" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">
              Waiting for your approval · {waiting.length}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              She has sent proof. Have a look and let her see what is behind the blur.
            </p>
          </div>
        </Card>
      )}

      {ransomTasks.length === 0 ? (
        <EmptyState
          icon={<Icon name="lock" size={30} />}
          title={isPlayer2 ? 'No ransoms set' : 'Nothing locked up'}
          body={
            isPlayer2
              ? 'Pick a chore, hide a photo behind it, and she only gets to see the photo once it is done.'
              : 'When he hides a surprise behind a chore, it shows up here.'
          }
          action={
            isPlayer2 && (
              <Button variant="primary" onClick={() => setComposing(true)}>
                <Icon name="plus" size={18} />
                Set a ransom
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[
            ['On the hook', [...waiting, ...open]],
            ['Unlocked', done],
          ].map(([label, rows]) =>
            rows.length === 0 ? null : (
              <section key={label}>
                <SectionTitle>
                  {label} · {rows.length}
                </SectionTitle>
                <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2">
                  {rows.map((task) => (
                    <RansomCard
                      key={task.id}
                      task={task}
                      isPlayer2={isPlayer2}
                      onProve={() => setProving(task)}
                      onReview={() => setReviewing(task)}
                      onLifeline={() => setLifeline(task)}
                      onDelete={() => setConfirmDelete(task)}
                    />
                  ))}
                </div>
              </section>
            )
          )}
        </div>
      )}

      {isPlayer2 && (
        <>
          <FabSpacer />
          <FloatingButton onClick={() => setComposing(true)} aria-label="Set a ransom">
            <Icon name="plus" size={26} strokeWidth={2.4} />
          </FloatingButton>
        </>
      )}

      <ComposeRansom
        open={composing}
        onClose={() => setComposing(false)}
        onSave={async (data) => {
          await addRansomTask(data)
          setComposing(false)
        }}
      />

      <SubmitProof
        task={proving}
        onClose={() => setProving(null)}
        onSubmit={async (photo) => {
          await updateRansomTask(proving.id, {
            proof_photo_url: photo,
            status: 'submitted_for_approval',
            submitted_at: new Date(),
          })
          setProving(null)
        }}
      />

      <ReviewProof
        task={reviewing}
        onClose={() => setReviewing(null)}
        onApprove={async () => {
          await updateRansomTask(reviewing.id, {
            status: 'revealed',
            is_revealed: true,
            revealed_at: new Date(),
          })
          setReviewing(null)
        }}
        onSendBack={async () => {
          await updateRansomTask(reviewing.id, {
            status: 'pending',
            proof_photo_url: '',
          })
          setReviewing(null)
        }}
      />

      <LifelineModal
        open={Boolean(lifeline)}
        onClose={() => setLifeline(null)}
        task={lifeline}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => removeRansomTask(confirmDelete.id)}
        title="Delete this ransom?"
        body={`"${confirmDelete?.title}" and the photo behind it both go.`}
      />
    </div>
  )
}

/* ----------------------------------------------------------------- card -- */

function RansomCard({ task, isPlayer2, onProve, onReview, onLifeline, onDelete }) {
  const revealed = task.is_revealed === true || task.status === 'revealed'
  const submitted = task.status === 'submitted_for_approval'
  const meta = STATUS[task.status] ?? STATUS.pending

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {task.anchor_photo_url ? (
          <img
            src={task.anchor_photo_url}
            alt={revealed ? task.title : ''}
            className={cx(
              'size-full object-cover',
              revealed ? 'animate-unblur' : 'scale-110 blur-[20px] saturate-[0.7]'
            )}
          />
        ) : (
          <div className="grid size-full place-items-center text-faint">
            <Icon name="image" size={34} />
          </div>
        )}

        {!revealed && (
          <div className="absolute inset-0 grid place-items-center bg-black/25 px-5 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                <Icon name="lock" size={26} strokeWidth={1.9} />
              </span>
              <p className="mt-3 text-[15px] font-extrabold text-white drop-shadow">
                {isPlayer2 ? 'Hidden from her' : "Anchor's secret surprise"}
              </p>
              <p className="mt-0.5 text-[12px] font-semibold text-white/75 drop-shadow">
                {submitted
                  ? isPlayer2
                    ? 'She has sent proof — your call'
                    : 'Proof sent. Waiting on him.'
                  : 'Complete the chore to unlock'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 font-extrabold leading-tight">{task.title}</h3>
          <Badge tone={meta.tone} dot={!revealed}>
            {meta.label}
          </Badge>
        </div>

        {task.description && (
          <p className="mt-1.5 text-[13px] leading-snug text-muted">{task.description}</p>
        )}
        <p className="mt-1 text-[12px] text-faint">{timeAgo(task.created_at)}</p>

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          {!isPlayer2 && !revealed && !submitted && (
            <>
              <Button variant="primary" size="sm" onClick={onProve}>
                <Icon name="image" size={15} />
                Submit proof
              </Button>
              {/* The lifeline sits next to the task, not buried in a menu —
                  the moment she needs it is the moment she is looking at it. */}
              <LifelineButton onClick={onLifeline} />
            </>
          )}

          {!isPlayer2 && submitted && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber">
              <Icon name="clock" size={15} />
              Sent — he unlocks it
            </p>
          )}

          {isPlayer2 && submitted && (
            <Button variant="mint" size="sm" onClick={onReview}>
              <Icon name="unlock" size={15} />
              Review &amp; reveal
            </Button>
          )}

          {isPlayer2 && !submitted && (
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Delete ransom">
              <Icon name="trash" size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------- compose -- */

function ComposeRansom({ open, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState('')
  const [busy, setBusy] = useState(false)

  const [wasOpen, setWasOpen] = useState(false)
  if (open && !wasOpen) {
    setWasOpen(true)
    setTitle('')
    setDescription('')
    setPhoto('')
  }
  if (!open && wasOpen) setWasOpen(false)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set a ransom"
      subtitle="A chore, with something of yours behind it"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!title.trim() || !photo}
            onClick={async () => {
              setBusy(true)
              await onSave({
                title: title.trim(),
                description: description.trim(),
                anchor_photo_url: photo,
              })
              setBusy(false)
            }}
          >
            Lock it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <Field label="The chore" htmlFor="ransom-title">
          <Input
            id="ransom-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The dishes that have been there since Tuesday"
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="Any details" hint="optional" htmlFor="ransom-note">
          <Textarea
            id="ransom-note"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Just the sink, the pans can wait"
          />
        </Field>

        <Field label="The surprise" hint="she sees this blurred until you unlock it">
          <ImagePicker value={photo} onChange={setPhoto} label="Choose the photo" />
        </Field>

        <p className="rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] leading-snug text-muted">
          A selfie, the cat, a picture of where you are booking for Friday. She gets a blurred
          rectangle and a padlock until you approve her proof.
        </p>
      </div>
    </Modal>
  )
}

/* ---------------------------------------------------------------- proof -- */

function SubmitProof({ task, onClose, onSubmit }) {
  const [photo, setPhoto] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (task && seed !== task) {
    setSeed(task)
    setPhoto('')
  }
  if (!task && seed !== null) setSeed(null)

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Submit proof"
      subtitle={task?.title}
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            loading={busy}
            disabled={!photo}
            onClick={async () => {
              setBusy(true)
              await onSubmit(photo)
              setBusy(false)
            }}
          >
            Send it to him
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[14px] leading-relaxed text-muted">
          A photo of the done thing. It does not have to be a good photo.
        </p>
        <ImagePicker value={photo} onChange={setPhoto} label="Take or choose a photo" />
      </div>
    </Modal>
  )
}

function ReviewProof({ task, onClose, onApprove, onSendBack }) {
  const [busy, setBusy] = useState(false)

  return (
    <Modal
      open={Boolean(task)}
      onClose={onClose}
      title="Her proof"
      subtitle={task?.title}
      footer={
        <>
          <Button variant="soft" full onClick={onSendBack}>
            Not yet
          </Button>
          <Button
            variant="mint"
            full
            loading={busy}
            onClick={async () => {
              setBusy(true)
              await onApprove()
              setBusy(false)
            }}
          >
            <Icon name="unlock" size={16} />
            Approve &amp; reveal
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {task?.proof_photo_url && (
          <img
            src={task.proof_photo_url}
            alt="Proof"
            className="w-full rounded-xl border border-border object-cover"
          />
        )}
        <p className="text-[13px] leading-snug text-muted">
          Approving lifts the blur on her side straight away. &ldquo;Not yet&rdquo; puts it back
          to not-started and clears the photo — use it sparingly, and maybe say why.
        </p>
      </div>
    </Modal>
  )
}
