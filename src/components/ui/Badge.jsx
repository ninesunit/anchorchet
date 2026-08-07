import { TIERS } from '../../data/patterns'
import { cx, initials } from '../../lib/utils'

export function Badge({ children, tone = 'neutral', className, dot }) {
  const tones = {
    neutral: 'bg-surface-2 text-muted border-border',
    ember: 'bg-ember-soft text-ember border-transparent',
    mint: 'bg-mint-soft text-mint border-transparent',
    amber: 'bg-amber-soft text-amber border-transparent',
    violet: 'bg-violet-soft text-violet border-transparent',
  }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        tones[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/** Loot-rarity badge — the small gaming flourish on every pattern card. */
export function TierBadge({ tier, className, showLabel = true }) {
  const meta = TIERS[tier] ?? TIERS.common

  // Without a label a pill reads as an empty grey chip, so collapse to a bare
  // rarity dot instead — recognisable, and it carries its name for a11y.
  if (!showLabel) {
    return (
      <span
        title={meta.label}
        aria-label={`${meta.label} tier`}
        className={cx('inline-block size-2.5 shrink-0 rounded-full', className)}
        style={{
          background: meta.color,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${meta.color} 18%, transparent)`,
        }}
      />
    )
  }

  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        className
      )}
      style={{
        color: meta.color,
        borderColor: `color-mix(in srgb, ${meta.color} 40%, transparent)`,
        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

const QUEST_STATUS = {
  pending: { label: 'New bounty', tone: 'ember' },
  accepted: { label: 'Accepted', tone: 'violet' },
  in_progress: { label: 'In progress', tone: 'amber' },
  completed: { label: 'Completed', tone: 'mint' },
}

export function QuestStatusBadge({ status, className }) {
  const meta = QUEST_STATUS[status] ?? QUEST_STATUS.pending
  return (
    <Badge tone={meta.tone} className={className} dot>
      {meta.label}
    </Badge>
  )
}

const STASH_STATUS = {
  in_stock: { label: 'In stock', tone: 'mint' },
  low: { label: 'Low', tone: 'amber' },
  empty: { label: 'Empty', tone: 'ember' },
}

export function StashStatusBadge({ status, className }) {
  const meta = STASH_STATUS[status] ?? STASH_STATUS.in_stock
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}

export function Avatar({ name, url, size = 'md', className }) {
  const sizes = {
    sm: 'size-7 text-[11px]',
    md: 'size-9 text-[13px]',
    lg: 'size-12 text-base',
  }
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 font-bold text-muted',
        sizes[size],
        className
      )}
    >
      {url ? (
        <img src={url} alt={name || ''} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export function ColorDot({ color, className, size = 'md' }) {
  const sizes = { sm: 'size-3', md: 'size-4', lg: 'size-6' }
  return (
    <span
      className={cx(
        'inline-block shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15',
        sizes[size],
        className
      )}
      style={{ background: color }}
    />
  )
}
