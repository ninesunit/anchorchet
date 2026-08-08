import { useMemo, useState } from 'react'

import { StitchSymbol } from '../../components/StitchSymbol'
import { Badge, QuestStatusBadge, TierBadge } from '../../components/ui/Badge'
import { Button, FabSpacer, FloatingButton } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle } from '../../components/ui/Card'
import { Chip, ChipRow, Field, Input, Segmented, Textarea } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { stitchFromLabel } from '../../data/crochetSymbols'
import { evaluateAll } from '../../data/engine'
import { matchStitchRule } from '../../data/stitchAnalyzer'
import { SERIES } from '../../data/patterns'
import { cx, timeAgo } from '../../lib/utils'

export function QuestGenerator() {
  const { quests, stash, addQuest, updateQuest, removeQuest } = useData()
  const { profile } = useAuth()

  const [composing, setComposing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const active = quests.filter((q) => q.status !== 'completed')
  const done = quests.filter((q) => q.status === 'completed')

  return (
    <div className="animate-fade-up">
      <Card className="mb-5 flex items-start gap-3 border-ember/35 bg-ember-soft/25 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ember text-white">
          <Icon name="quest" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">You fill this board</p>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            Every bounty here shows up on her side with the reward attached. Patterns marked{' '}
            <strong className="text-mint">ready</strong> use yarn she already has.
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => setComposing({})}>
            <Icon name="plus" size={16} />
            New quest
          </Button>
        </div>
      </Card>

      {quests.length === 0 ? (
        <EmptyState
          icon={<Icon name="quest" size={30} />}
          title="No bounties sent yet"
          body="Pick something from the catalogue and send it across."
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-7">
              <SectionTitle>Open · {active.length}</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {active.map((quest) => (
                  <QuestRow
                    key={quest.id}
                    quest={quest}
                    onEdit={() => setComposing(quest)}
                  />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <SectionTitle>Delivered · {done.length}</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {done.map((quest) => (
                  <QuestRow key={quest.id} quest={quest} onEdit={() => setComposing(quest)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <FabSpacer />

      <FloatingButton onClick={() => setComposing({})} aria-label="New quest">
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </FloatingButton>

      <QuestComposer
        quest={composing}
        stash={stash}
        requesterName={profile?.name || 'Player 2'}
        onClose={() => setComposing(null)}
        onSave={async (data) => {
          if (composing?.id) await updateQuest(composing.id, data)
          else await addQuest(data)
          setComposing(null)
        }}
        onDelete={composing?.id ? () => setConfirmDelete(composing) : null}
      />

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          removeQuest(confirmDelete.id)
          setComposing(null)
        }}
        title="Withdraw this quest?"
        body={`"${confirmDelete?.title}" disappears from her board.`}
        confirmLabel="Withdraw"
      />
    </div>
  )
}

function QuestRow({ quest, onEdit }) {
  return (
    <Card
      as="button"
      interactive
      onClick={onEdit}
      className={cx(
        'flex w-full flex-col overflow-hidden text-left',
        quest.priority === 'high' && quest.status !== 'completed' && 'border-ember/45'
      )}
    >
      {(quest.completion_photo_url || quest.reference_image_url) && (
        <img
          src={quest.completion_photo_url || quest.reference_image_url}
          alt=""
          className="max-h-40 w-full bg-surface-2 object-cover"
        />
      )}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold leading-tight">{quest.title}</h3>
          <QuestStatusBadge status={quest.status} />
        </div>
        <p className="mt-1 text-[12px] text-faint">Sent {timeAgo(quest.date_requested)}</p>
        {quest.reward && (
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted">
            <Icon name="trophy" size={14} className="shrink-0 text-amber" />
            <span className="truncate">{quest.reward}</span>
          </p>
        )}
      </div>
    </Card>
  )
}

/**
 * What the analyzer worked out, shown to him before he sends.
 *
 * He does not need to understand the stitches — the point is that she opens
 * the bounty and already knows what it will take, without him having to know
 * the words for it.
 */
function StitchGuess({ guess }) {
  if (!guess) return null

  return (
    <div className="rounded-xl border border-violet/40 bg-violet-soft/25 p-3.5">
      <div className="flex items-center gap-2">
        <Icon name="sparkle" size={15} className="shrink-0 text-violet" />
        <p className="text-[12px] font-bold uppercase tracking-wider text-violet">
          Reads as {guess.label}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {guess.stitches.map((label) => {
          const stitch = stitchFromLabel(label)
          return (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-violet/40 bg-bg px-2.5 py-1 text-[12px] font-bold text-violet"
            >
              {stitch && <StitchSymbol name={stitch.symbol} size={13} />}
              {label}
            </span>
          )
        })}
      </div>

      <p className="mt-2.5 text-[12px] leading-snug text-muted">
        {guess.note} She sees these on the bounty and can tap any one for the how-to.
      </p>
    </div>
  )
}

function QuestComposer({ quest, stash, requesterName, onClose, onSave, onDelete }) {
  const open = Boolean(quest)
  const isEdit = Boolean(quest?.id)

  const [title, setTitle] = useState('')
  const [patternId, setPatternId] = useState('')
  const [note, setNote] = useState('')
  const [reward, setReward] = useState('')
  const [priority, setPriority] = useState('normal')
  const [reference, setReference] = useState('')
  const [status, setStatus] = useState('pending')
  const [series, setSeries] = useState('')
  const [readyOnly, setReadyOnly] = useState(true)
  const [busy, setBusy] = useState(false)

  const [seed, setSeed] = useState(null)
  if (open && seed !== quest) {
    setSeed(quest)
    setTitle(quest.title || '')
    setPatternId(quest.pattern_id || '')
    setNote(quest.note || '')
    setReward(quest.reward || '')
    setPriority(quest.priority || 'normal')
    setReference(quest.reference_image_url || '')
    setStatus(quest.status || 'pending')
    setSeries('')
    setReadyOnly(!quest.id)
  }
  if (!open && seed !== null) setSeed(null)

  const catalogue = useMemo(() => evaluateAll(stash, { series }), [stash, series])
  const options = readyOnly ? catalogue.filter((r) => r.status === 'ready') : catalogue
  const selected = catalogue.find((r) => r.pattern.id === patternId)

  /**
   * Read the stitches out of what he typed.
   *
   * Runs live so he can see what she will get before he sends it, and runs
   * again at submit so the value on the document always matches what was on
   * screen. Local and instant — no round trip, and no crochet knowledge needed
   * on his side.
   */
  const guess = useMemo(
    () => matchStitchRule(`${title} ${note} ${selected?.pattern.name || ''}`),
    [title, note, selected]
  )

  async function submit() {
    const finalTitle = title.trim() || selected?.pattern.name || 'Crochet request'
    setBusy(true)
    await onSave({
      title: finalTitle,
      pattern_id: patternId || null,
      requested_by: requesterName,
      note: note.trim(),
      reward: reward.trim(),
      priority,
      status,
      reference_image_url: reference,
      suggested_stitches: matchStitchRule(`${finalTitle} ${note}`)?.stitches ?? [],
      ...(isEdit ? {} : { date_requested: new Date() }),
    })
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit quest' : 'New quest'}
      subtitle={isEdit ? undefined : 'She sees this the moment you send it.'}
      size="lg"
      footer={
        <>
          {onDelete && (
            <Button variant="danger" onClick={onDelete} aria-label="Withdraw quest">
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
            disabled={!title.trim() && !patternId}
            onClick={submit}
          >
            {isEdit ? 'Save' : 'Send it'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        {!isEdit && (
          <Field
            label="Pick from the catalogue"
            hint={`${options.length} shown`}
          >
            <ChipRow className="mb-2.5">
              <Chip active={readyOnly} onClick={() => setReadyOnly(!readyOnly)}>
                <Icon name="check" size={14} strokeWidth={2.6} />
                She has the yarn
              </Chip>
              <Chip active={series === ''} onClick={() => setSeries('')}>
                All
              </Chip>
              {Object.values(SERIES).map((s) => (
                <Chip key={s.id} active={series === s.id} onClick={() => setSeries(s.id)}>
                  {s.label}
                </Chip>
              ))}
            </ChipRow>

            <div className="scroll-y max-h-64 rounded-xl border border-border">
              {options.length === 0 ? (
                <p className="px-3.5 py-6 text-center text-[13px] text-muted">
                  Nothing matches. Turn off &ldquo;she has the yarn&rdquo; to see the rest.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {options.map((result) => (
                    <PatternOption
                      key={result.pattern.id}
                      result={result}
                      selected={patternId === result.pattern.id}
                      onSelect={() => {
                        setPatternId(result.pattern.id)
                        if (!title.trim()) setTitle(result.pattern.name)
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Field>
        )}

        {selected && (
          <div
            className={cx(
              'flex items-start gap-2.5 rounded-xl border px-3.5 py-3',
              selected.status === 'ready'
                ? 'border-mint/40 bg-mint-soft/40'
                : 'border-amber/40 bg-amber-soft/35'
            )}
          >
            <Icon
              name={selected.status === 'ready' ? 'check' : 'cart'}
              size={17}
              strokeWidth={2.4}
              className={cx(
                'mt-0.5 shrink-0',
                selected.status === 'ready' ? 'text-mint' : 'text-amber'
              )}
            />
            <p className="text-[13px] leading-snug text-text">
              {selected.status === 'ready' ? (
                <>
                  She can start <strong>{selected.pattern.name}</strong> tonight — every colour is
                  already in her stash. About {selected.pattern.hours} hours.
                </>
              ) : (
                <>
                  She is missing{' '}
                  <strong>
                    {selected.missing.length} colour
                    {selected.missing.length > 1 ? 's' : ''}
                  </strong>{' '}
                  for this. Check the Supply Drop tab before sending it.
                </>
              )}
            </p>
          </div>
        )}

        <Field label="Title" htmlFor="quest-title">
          <Input
            id="quest-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="1x Blue Tactibear"
            autoCapitalize="sentences"
          />
        </Field>

        <Field label="What exactly do you want?" hint="optional" htmlFor="quest-note">
          <Textarea
            id="quest-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Colours, size, where it's going to live…"
          />
        </Field>

        <StitchGuess guess={guess} />

        <Field
          label="Reference image"
          hint="a screenshot works"
        >
          <ImagePicker value={reference} onChange={setReference} label="Add a reference" />
        </Field>

        <Field label="Reward" hint="the part that seals it" htmlFor="quest-reward">
          <Input
            id="quest-reward"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Weekend dinner, your pick"
            autoCapitalize="sentences"
          />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Priority">
            <Segmented
              value={priority}
              onChange={setPriority}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'Priority' },
              ]}
            />
          </Field>

          {isEdit && (
            <Field label="Status">
              <Segmented
                size="sm"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'pending', label: 'New' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'in_progress', label: 'Doing' },
                  { value: 'completed', label: 'Done' },
                ]}
              />
            </Field>
          )}
        </div>
      </div>
    </Modal>
  )
}

function PatternOption({ result, selected, onSelect }) {
  const { pattern, status } = result
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition',
        selected ? 'bg-ember-soft/40' : 'hover:bg-surface-2'
      )}
    >
      <span
        className={cx(
          'grid size-5 shrink-0 place-items-center rounded-full border-2',
          selected ? 'border-ember bg-ember text-white' : 'border-border'
        )}
      >
        {selected && <Icon name="check" size={12} strokeWidth={3.5} />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-bold leading-tight">{pattern.name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-faint">
          {SERIES[pattern.series].label} · ~{pattern.hours}h
        </span>
      </span>

      <TierBadge tier={pattern.tier} showLabel={false} />
      {status === 'ready' ? (
        <Badge tone="mint">Ready</Badge>
      ) : (
        <Badge tone={status === 'close' ? 'amber' : 'neutral'}>
          {status === 'close' ? '1 short' : `${result.missing.length} short`}
        </Badge>
      )}
    </button>
  )
}
