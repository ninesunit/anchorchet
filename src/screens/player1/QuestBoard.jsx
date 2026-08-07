import { useMemo, useState } from 'react'

import { Badge, QuestStatusBadge, TierBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../../components/ui/Card'
import { Field, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { evaluatePattern } from '../../data/engine'
import { PATTERNS_BY_ID, SERIES } from '../../data/patterns'
import { cx, timeAgo } from '../../lib/utils'

const NEXT_ACTION = {
  pending: { label: 'Accept the bounty', next: 'accepted', variant: 'primary' },
  accepted: { label: 'Start crafting', next: 'in_progress', variant: 'mint' },
  in_progress: { label: 'Mark complete', next: 'completed', variant: 'mint' },
}

export function QuestBoard() {
  const { quests, stash, updateQuest, addTrophy } = useData()
  const { profile } = useAuth()
  const [completing, setCompleting] = useState(null)

  const active = quests.filter((q) => q.status !== 'completed')
  const done = quests.filter((q) => q.status === 'completed')

  return (
    <div className="animate-fade-up">
      {quests.length === 0 ? (
        <EmptyState
          icon={<Icon name="quest" size={30} />}
          title="No bounties yet"
          body="Player 2 fills this board. When a request lands, it shows up here with the reward attached."
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-7">
              <SectionTitle>
                Active bounties · {active.length}
              </SectionTitle>
              <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
                {active.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    stash={stash}
                    onAdvance={() => {
                      const action = NEXT_ACTION[quest.status]
                      if (!action) return
                      if (action.next === 'completed') setCompleting(quest)
                      else updateQuest(quest.id, { status: action.next })
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <SectionTitle>Completed · {done.length}</SectionTitle>
              <div className="flex flex-col gap-3 xl:grid xl:grid-cols-2">
                {done.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} stash={stash} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <CompleteQuestModal
        quest={completing}
        onClose={() => setCompleting(null)}
        onSubmit={async ({ photo, caption }) => {
          await updateQuest(completing.id, {
            status: 'completed',
            completion_photo_url: photo || '',
            date_completed: new Date(),
          })
          // A finished quest is always worth a Hall of Fame entry, photo or not.
          await addTrophy({
            title: completing.title,
            quest_id: completing.id,
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

function QuestCard({ quest, stash, onAdvance }) {
  const action = onAdvance ? NEXT_ACTION[quest.status] : null
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
          {quest.requested_by || 'Player 2'} · {timeAgo(quest.date_requested)}
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
              craftable.status === 'ready'
                ? 'bg-mint-soft/50 text-mint'
                : 'bg-surface-2 text-muted'
            )}
          >
            <Icon
              name={craftable.status === 'ready' ? 'check' : 'cart'}
              size={15}
              strokeWidth={2.4}
            />
            {craftable.status === 'ready'
              ? 'You already have all the yarn for this'
              : `Missing ${craftable.missing.length} colour${craftable.missing.length > 1 ? 's' : ''}`}
          </div>
        )}

        {action && (
          <Button variant={action.variant} full className="mt-4" onClick={onAdvance}>
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  )
}

function CompleteQuestModal({ quest, onClose, onSubmit }) {
  const [photo, setPhoto] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (quest && seed !== quest) {
    setSeed(quest)
    setPhoto('')
    setCaption('')
  }
  if (!quest && seed !== null) setSeed(null)

  return (
    <Modal
      open={Boolean(quest)}
      onClose={onClose}
      title="Finished it?"
      subtitle={quest?.title}
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
            Complete quest
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-[15px] leading-relaxed text-muted">
          Add a photo and it goes straight into the Hall of Fame. Player 2 gets to see it the
          moment you save.
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
