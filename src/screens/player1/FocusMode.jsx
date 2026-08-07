import { FocusPlayer } from '../../components/FocusPlayer'
import { Card, SectionTitle, Stat } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { useData } from '../../context/DataContext'
import { TIERS } from '../../data/patterns'
import { evaluateAll } from '../../data/engine'

/**
 * The "cozy" tab: music plus a read-only look at the loot table, so the
 * gaming framing has somewhere to actually live rather than being decoration
 * sprinkled over the utility screens.
 */
export function FocusMode() {
  const { stash, quests } = useData()

  const results = evaluateAll(stash)
  const byTier = Object.values(TIERS).map((tier) => ({
    tier,
    total: results.filter((r) => r.pattern.tier === tier.id).length,
    ready: results.filter((r) => r.pattern.tier === tier.id && r.status === 'ready').length,
  }))

  const completed = quests.filter((q) => q.status === 'completed').length

  return (
    <div className="animate-fade-up">
      <FocusPlayer variant="full" />

      <section className="mt-7">
        <SectionTitle>Your loot table</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
          {byTier.map(({ tier, total, ready }) => (
            <Card key={tier.id} className="p-3.5">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: tier.color }} />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>
              <p className="mt-1.5 text-2xl font-extrabold leading-none tabular-nums">
                {ready}
                <span className="text-base font-bold text-faint">/{total}</span>
              </p>
              <p className="mt-1 text-[12px] text-muted">unlocked</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle>Run stats</SectionTitle>
        <div className="grid grid-cols-3 gap-2.5">
          <Stat label="Quests cleared" value={completed} tone="mint" />
          <Stat label="Patterns unlocked" value={results.filter((r) => r.status === 'ready').length} tone="amber" />
          <Stat label="Balls in stash" value={stash.reduce((n, s) => n + (Number(s.quantity) || 0), 0)} />
        </div>
      </section>

      <Card className="mt-7 flex items-start gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet">
          <Icon name="sparkle" size={18} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          Patterns are graded like drops — <strong className="text-text">Common</strong> is an
          evening, <strong className="text-text">Legendary</strong> is a weekend or more. When a
          slump hits, a Common is a real win, not a consolation prize.
        </p>
      </Card>
    </div>
  )
}
