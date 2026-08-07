import { useMemo, useState } from 'react'

import { Badge, ColorDot } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Chip, ChipRow } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { useData } from '../../context/DataContext'
import { FAMILY_LABEL, FAMILY_SWATCH, yarnSwatch } from '../../data/colors'
import { questNeeds, stashSummary, suggestPurchases } from '../../data/engine'
import { PATTERNS_BY_ID } from '../../data/patterns'
import { WEIGHTS } from '../../data/colors'
import { cx } from '../../lib/utils'

export function SupplyDrop() {
  const { stash, quests, updateYarn, addYarn } = useData()

  const [tab, setTab] = useState('list')
  const [copied, setCopied] = useState(false)

  const summary = useMemo(() => stashSummary(stash), [stash])
  const needed = useMemo(
    () =>
      stash
        .filter((y) => y.status === 'empty' || y.status === 'low')
        // Empty before low: those are the ones actually blocking her.
        .sort((a, b) => (a.status === 'empty' ? -1 : 1) - (b.status === 'empty' ? -1 : 1)),
    [stash]
  )
  const suggestions = useMemo(() => suggestPurchases(stash), [stash])
  // Colours she has never owned, pulled from quests she has taken on. These
  // cannot show up as "empty" rows because there is no stash entry to empty.
  const needs = useMemo(
    () => questNeeds(quests, stash, PATTERNS_BY_ID),
    [quests, stash]
  )

  async function copyList() {
    const lines = [
      ...needed.map((y) => `- ${y.color} (${y.weight})${y.brand ? ` — ${y.brand}` : ''}`),
      ...needs.map(
        (n) => `- ${FAMILY_LABEL[n.family]} (${n.weight}) x${n.skeins} — for ${n.forQuests[0].title}`
      ),
    ]
    const text = ['Anchorchet supply drop', ...lines].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the list is on screen anyway */
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Stat label="Out of stock" value={summary.empty} tone={summary.empty ? 'ember' : 'default'} />
        <Stat label="Running low" value={summary.low} tone={summary.low ? 'amber' : 'default'} />
        <Stat label="Can craft now" value={summary.craftable} tone="mint" />
      </div>

      <ChipRow className="mb-4">
        <Chip active={tab === 'list'} onClick={() => setTab('list')}>
          Shopping list
        </Chip>
        <Chip active={tab === 'unlock'} onClick={() => setTab('unlock')}>
          Unlock more patterns
        </Chip>
        <Chip active={tab === 'stash'} onClick={() => setTab('stash')}>
          Her full stash
        </Chip>
      </ChipRow>

      {tab === 'list' && (
        <section>
          {needed.length === 0 && needs.length === 0 ? (
            <EmptyState
              icon={<Icon name="cart" size={30} />}
              title="Nothing to restock"
              body="She hasn't marked anything low or empty. Check the unlock tab for something to surprise her with instead."
              action={
                <Button variant="soft" onClick={() => setTab('unlock')}>
                  See unlock ideas
                </Button>
              }
            />
          ) : (
            <>
              <SectionTitle
                action={
                  <Button variant="ghost" size="sm" onClick={copyList}>
                    <Icon name={copied ? 'check' : 'share'} size={15} />
                    {copied ? 'Copied' : 'Copy list'}
                  </Button>
                }
              >
                She flagged these · {needed.length}
              </SectionTitle>

              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {needed.map((yarn) => (
                  <Card key={yarn.id} className="flex items-center gap-3 p-3.5">
                    <ColorDot color={yarnSwatch(yarn)} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-tight">{yarn.color}</p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {yarn.weight}
                        {yarn.brand && ` · ${yarn.brand}`}
                        {yarn.note && ` · ${yarn.note}`}
                      </p>
                    </div>
                    <Badge tone={yarn.status === 'empty' ? 'ember' : 'amber'}>
                      {yarn.status === 'empty' ? 'Out' : 'Low'}
                    </Badge>
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() =>
                        updateYarn(yarn.id, {
                          quantity: (Number(yarn.quantity) || 0) + 1,
                          status: 'in_stock',
                        })
                      }
                      title="Log a ball you bought"
                    >
                      <Icon name="plus" size={15} strokeWidth={2.6} />
                      Bought
                    </Button>
                  </Card>
                ))}
              </div>

              <p className="mt-3 px-1 text-[12px] leading-snug text-faint">
                &ldquo;Bought&rdquo; adds a ball to her stash straight away, so the Ready to Craft
                list updates before the yarn even arrives.
              </p>
            </>
          )}

          {needs.length > 0 && (
            <div className="mt-7">
              <SectionTitle>Needed for quests · {needs.length}</SectionTitle>
              <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
                {needs.map((need) => (
                  <Card
                    key={`${need.family}-${need.weight}`}
                    className="flex items-center gap-3 border-ember/30 p-3.5"
                  >
                    <ColorDot color={FAMILY_SWATCH[need.family]} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-tight">
                        {FAMILY_LABEL[need.family]} · {need.weight}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-muted">
                        {need.skeins} ball{need.skeins > 1 ? 's' : ''} for{' '}
                        {need.forQuests.map((q) => q.title).join(', ')}
                      </p>
                    </div>
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() =>
                        addYarn({
                          color: FAMILY_LABEL[need.family],
                          weight: WEIGHTS.includes(need.weight) ? need.weight : 'DK',
                          quantity: need.skeins,
                          status: 'in_stock',
                          note: `Supply drop for ${need.forQuests[0].title}`,
                        })
                      }
                      title="Add straight to her stash"
                    >
                      <Icon name="plus" size={15} strokeWidth={2.6} />
                      Bought
                    </Button>
                  </Card>
                ))}
              </div>
              <p className="mt-3 px-1 text-[12px] leading-snug text-faint">
                She does not own these colours at all. Buying one drops it straight into her
                stash, which can flip the quest to &ldquo;ready to craft&rdquo; on her side.
              </p>
            </div>
          )}
        </section>
      )}

      {tab === 'unlock' && (
        <section>
          <SectionTitle>Buy one of these and she can start something new</SectionTitle>

          {suggestions.length === 0 ? (
            <EmptyState
              icon={<Icon name="sparkle" size={30} />}
              title="Nothing obvious to add"
              body="Her stash already covers most of the catalogue."
            />
          ) : (
            <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
              {suggestions.map((s) => (
                <Card key={`${s.family}-${s.weight}`} className="p-3.5">
                  <div className="flex items-center gap-3">
                    <ColorDot color={FAMILY_SWATCH[s.family]} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold leading-tight">
                        {FAMILY_LABEL[s.family]} · {s.weight}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {s.unlocks.length > 0
                          ? `Finishes ${s.unlocks.length} near-complete pattern${
                              s.unlocks.length > 1 ? 's' : ''
                            }`
                          : 'Opens up more of the catalogue'}
                      </p>
                    </div>
                  </div>

                  {s.unlocks.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {s.unlocks.slice(0, 4).map((name) => (
                        <span
                          key={name}
                          className="rounded-full border border-mint/40 bg-mint-soft/40 px-2.5 py-0.5 text-[11px] font-semibold text-mint"
                        >
                          {name}
                        </span>
                      ))}
                      {s.unlocks.length > 4 && (
                        <span className="px-1 text-[11px] font-semibold text-faint">
                          +{s.unlocks.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'stash' && (
        <section>
          <SectionTitle>Everything she owns · {stash.length}</SectionTitle>
          {stash.length === 0 ? (
            <EmptyState
              icon={<Icon name="yarn" size={30} />}
              title="Her stash is empty"
              body="Nothing logged yet on her side."
            />
          ) : (
            <Card className="divide-y divide-border">
              {stash.map((yarn) => (
                <div key={yarn.id} className="flex items-center gap-3 px-3.5 py-3">
                  <ColorDot color={yarnSwatch(yarn)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold leading-tight">{yarn.color}</p>
                    <p className="text-[12px] text-faint">
                      {yarn.weight}
                      {yarn.brand && ` · ${yarn.brand}`}
                    </p>
                  </div>
                  <span
                    className={cx(
                      'text-[15px] font-extrabold tabular-nums',
                      yarn.quantity === 0 && 'text-ember'
                    )}
                  >
                    {yarn.quantity}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}
    </div>
  )
}
