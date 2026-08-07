import { useMemo, useState } from 'react'

import { PatternThumb, referenceLinks } from '../../components/PatternThumb'
import { Badge, ColorDot, TierBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ImagePicker } from '../../components/ui/ImagePicker'
import { Card, EmptyState, Stat } from '../../components/ui/Card'
import { Chip, ChipRow, Input } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { useData } from '../../context/DataContext'
import { FAMILY_LABEL, FAMILY_SWATCH, yarnSwatch } from '../../data/colors'
import { evaluateAll } from '../../data/engine'
import { SERIES, TIERS } from '../../data/patterns'
import { cx } from '../../lib/utils'

const SERIES_FILTERS = [{ id: '', label: 'Everything' }, ...Object.values(SERIES)]

export function ReadyToCraft() {
  const { stash, patternRefs, setPatternRef, removePatternRef } = useData()

  const [series, setSeries] = useState('')
  const [tier, setTier] = useState('')
  const [query, setQuery] = useState('')
  const [onlyReady, setOnlyReady] = useState(false)
  const [detail, setDetail] = useState(null)

  const results = useMemo(
    () => evaluateAll(stash, { series, tier, query }),
    [stash, series, tier, query]
  )

  const readyCount = results.filter((r) => r.status === 'ready').length
  const closeCount = results.filter((r) => r.status === 'close').length
  const visible = onlyReady ? results.filter((r) => r.status === 'ready') : results

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Ready now" value={readyCount} tone="mint" />
        <Stat label="1 away" value={closeCount} tone="amber" />
        <Stat label="Patterns" value={results.length} />
      </div>

      {stash.length === 0 && (
        <Card className="mb-4 flex items-start gap-3 border-amber/40 bg-amber-soft/40 p-3.5">
          <Icon name="yarn" size={20} className="mt-0.5 shrink-0 text-amber" />
          <p className="text-[13px] leading-snug text-text">
            Your stash is empty, so nothing can match yet. Add a few balls in the{' '}
            <strong>Yarn Stash</strong> tab and this list fills itself in.
          </p>
        </Card>
      )}

      <div className="mb-3">
        <div className="relative">
          <Icon
            name="search"
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns…"
            className="pl-10"
            type="search"
            autoCapitalize="none"
          />
        </div>
      </div>

      <ChipRow className="mb-2.5">
        <Chip active={onlyReady} onClick={() => setOnlyReady(!onlyReady)}>
          <Icon name="check" size={14} strokeWidth={2.6} />
          Ready only
        </Chip>
        {SERIES_FILTERS.map((s) => (
          <Chip key={s.id} active={series === s.id} onClick={() => setSeries(s.id)}>
            {s.label}
          </Chip>
        ))}
      </ChipRow>

      <ChipRow className="mb-4">
        <Chip active={tier === ''} onClick={() => setTier('')}>
          Any tier
        </Chip>
        {Object.values(TIERS).map((t) => (
          <Chip key={t.id} active={tier === t.id} onClick={() => setTier(t.id)} dot={t.color}>
            {t.label}
          </Chip>
        ))}
      </ChipRow>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="target" size={30} />}
          title="Nothing matches"
          body="Loosen the filters, or add more yarn to unlock more of the catalogue."
        />
      ) : (
        <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
          {visible.map((result) => (
            <PatternCard
              key={result.pattern.id}
              result={result}
              photo={patternRefs[result.pattern.id]?.image_url}
              onClick={() => setDetail(result)}
            />
          ))}
        </div>
      )}

      <PatternDetail
        result={detail}
        photo={detail ? patternRefs[detail.pattern.id]?.image_url : undefined}
        onSavePhoto={(image_url) => setPatternRef(detail.pattern.id, { image_url })}
        onClearPhoto={() => removePatternRef(detail.pattern.id)}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}

const STATUS_META = {
  ready: { label: 'Ready to craft', tone: 'mint', ring: 'border-mint/45' },
  close: { label: 'One slot short', tone: 'amber', ring: 'border-amber/35' },
  blocked: { label: 'Needs supplies', tone: 'neutral', ring: 'border-border' },
}

function PatternCard({ result, photo, onClick }) {
  const { pattern, status, slots, substitutions } = result
  const meta = STATUS_META[status]

  return (
    <Card
      as="button"
      interactive
      onClick={onClick}
      className={cx('w-full p-3.5', meta.ring, status === 'ready' && 'bg-mint-soft/20')}
    >
      <div className="flex items-start gap-3">
        <PatternThumb
          pattern={pattern}
          slots={slots}
          photo={photo}
          className="w-20 shrink-0 rounded-xl border border-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 truncate font-bold leading-tight">{pattern.name}</h3>
            <TierBadge tier={pattern.tier} showLabel={false} className="mt-1.5" />
          </div>
          <p className="mt-0.5 text-[12px] text-faint">
            {SERIES[pattern.series].label} · {pattern.weight} · ~{pattern.hours}h
          </p>
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-muted">{pattern.blurb}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {slots.map((slot, i) => (
          <span
            key={i}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
              slot.matched
                ? 'border-border bg-surface-2 text-muted'
                : 'border-dashed border-amber/50 bg-amber-soft/40 text-amber'
            )}
          >
            <ColorDot
              color={
                slot.matched
                  ? yarnSwatch(slot.stash)
                  : FAMILY_SWATCH[slot.families[0]] || 'var(--border-strong)'
              }
              size="sm"
            />
            {slot.matched ? slot.stash.color : `Need ${FAMILY_LABEL[slot.families[0]]}`}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge tone={meta.tone} dot={status !== 'blocked'}>
          {meta.label}
        </Badge>
        {substitutions > 0 && status === 'ready' && (
          <span className="text-[11px] font-medium text-faint">
            {substitutions} weight substitution{substitutions > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Card>
  )
}

function PatternDetail({ result, photo, onSavePhoto, onClearPhoto, onClose }) {
  if (!result) return <Modal open={false} onClose={onClose} title="" />

  const { pattern, status, slots } = result
  const meta = STATUS_META[status]

  return (
    <Modal
      open
      onClose={onClose}
      title={pattern.name}
      subtitle={`${SERIES[pattern.series].label} · ${pattern.hook} hook · about ${pattern.hours} hours`}
    >
      <div className="flex flex-col gap-4 pb-3">
        <PatternThumb
          pattern={pattern}
          slots={slots}
          photo={photo}
          ratio="wide"
          className="rounded-2xl border border-border"
        />

        <ReferencePanel
          pattern={pattern}
          photo={photo}
          onSavePhoto={onSavePhoto}
          onClearPhoto={onClearPhoto}
        />

        <div className="flex flex-wrap items-center gap-2">
          <TierBadge tier={pattern.tier} />
          <Badge tone={meta.tone} dot={status !== 'blocked'}>
            {meta.label}
          </Badge>
          <Badge>{pattern.weight}</Badge>
        </div>

        <p className="text-[15px] leading-relaxed text-muted">{pattern.blurb}</p>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-faint">
            Yarn checklist
          </h3>
          <div className="flex flex-col gap-2">
            {slots.map((slot, i) => (
              <SlotRow key={i} slot={slot} />
            ))}
          </div>
        </div>

        {status === 'ready' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-mint/40 bg-mint-soft/40 px-3.5 py-3">
            <Icon name="check" size={18} className="mt-0.5 shrink-0 text-mint" strokeWidth={2.6} />
            <p className="text-[13px] leading-snug text-text">
              Everything for this is already in your basket. No shopping trip needed.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function SlotRow({ slot }) {
  const accepted = slot.families.map((f) => FAMILY_LABEL[f]).join(' / ')

  const reasonText = {
    none: `No ${accepted.toLowerCase()} in the stash`,
    quantity: `Need ${slot.need} ball${slot.need > 1 ? 's' : ''} — ${slot.short} short`,
    weight: 'Right colour, but the weight is too far off',
  }

  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5',
        slot.matched ? 'border-border bg-surface' : 'border-dashed border-amber/50 bg-amber-soft/30'
      )}
    >
      <ColorDot
        color={
          slot.matched
            ? yarnSwatch(slot.stash)
            : FAMILY_SWATCH[slot.families[0]] || 'var(--border-strong)'
        }
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold leading-tight">{slot.role}</p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {slot.matched ? (
            <>
              {slot.stash.color} · {slot.stash.weight} · uses {slot.need} ball
              {slot.need > 1 ? 's' : ''}
              {slot.fit === 'substitute' && (
                <span className="text-amber"> · weight substitution</span>
              )}
            </>
          ) : (
            <span className="text-amber">{reasonText[slot.reason]}</span>
          )}
        </p>
      </div>
      {slot.matched ? (
        <Icon name="check" size={18} className="shrink-0 text-mint" strokeWidth={2.6} />
      ) : (
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-amber">
          {accepted}
        </span>
      )}
    </div>
  )
}

/**
 * The bit that actually answers "what does it look like?".
 *
 * Real photos cannot be bundled — the game characters are somebody else's
 * artwork — so this does the two things that work instead: send her straight to
 * real examples, and let either player pin a photo to the pattern permanently.
 * A pinned photo syncs to both phones and replaces the placeholder everywhere.
 */
function ReferencePanel({ pattern, photo, onSavePhoto, onClearPhoto }) {
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState('')

  // Pinning writes to the pattern_refs collection. If the deployed security
  // rules predate that collection the write is rejected, and without this the
  // failure would be completely silent — the photo would just never appear.
  async function save(url) {
    setError('')
    try {
      await onSavePhoto(url)
      setPicking(false)
    } catch (err) {
      const denied = /permission|insufficient/i.test(err?.message || '')
      setError(
        denied
          ? 'Firestore rejected this. The pattern_refs collection needs adding to your security rules — see the README.'
          : err?.message || 'Could not save that photo.'
      )
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-2/50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-faint">
          <Icon name="image" size={14} />
          Reference
        </h3>
        {photo ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearPhoto}>
              Remove
            </Button>
          </div>
        ) : (
          <Button variant="soft" size="sm" onClick={() => setPicking(true)}>
            <Icon name="plus" size={15} strokeWidth={2.4} />
            Pin a photo
          </Button>
        )}
      </div>

      {picking && (
        <ImagePicker
          className="mt-3"
          value=""
          label="Choose a reference photo"
          hint="Saves for both of you"
          onChange={(url) => {
            if (url) save(url)
            else setPicking(false)
          }}
        />
      )}

      {error && (
        <p className="mt-2.5 rounded-lg bg-ember-soft px-3 py-2 text-[12px] font-medium leading-snug text-ember">
          {error}
        </p>
      )}

      <p className="mt-2.5 text-[12px] leading-snug text-muted">
        {photo
          ? 'This photo is pinned to the pattern and shows on both your phones.'
          : 'No photo pinned yet. Open one of these, screenshot the version you like, then pin it.'}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {referenceLinks(pattern).map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[13px] font-semibold text-muted transition hover:text-text"
          >
            {link.label}
            <Icon name="share" size={13} />
          </a>
        ))}
      </div>
    </div>
  )
}
