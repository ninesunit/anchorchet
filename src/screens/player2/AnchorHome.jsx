import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge, QuestStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { useData } from '../../context/DataContext'
import { stashSummary } from '../../data/engine'
import { cx, overallAverage, personalBest, timeAgo } from '../../lib/utils'
import { NextUpCard } from '../player1/BowlingCalendar'
import { HypeModal, useHypeTrigger } from './HypeButton'

export function AnchorHome() {
  const { quests, stash, sessions, events, hype } = useData()
  const [hyping, setHyping] = useState(false)

  const summary = useMemo(() => stashSummary(stash), [stash])
  const active = quests.filter((q) => q.status !== 'completed')
  const inProgress = quests.filter((q) => q.status === 'in_progress')
  const nextEvent = events.find((e) => (e.date?.getTime?.() ?? 0) >= Date.now())
  const last = sessions[0]
  const restock = stash.filter((y) => y.status === 'empty' || y.status === 'low')

  const trigger = useHypeTrigger(sessions)
  const pendingHype = hype.filter((h) => h.to === 'player1' && !h.seen).length

  return (
    <div className="animate-fade-up">
      {/* The live score is the reason he opens the app, so it goes first. */}
      <section className="mb-6">
        <SectionTitle
          action={
            <Link to="/bowling" className="text-[13px] font-bold text-muted hover:text-text">
              All sessions
            </Link>
          }
        >
          Live from the lanes
        </SectionTitle>

        {last ? (
          <Card
            className={cx(
              'p-4',
              trigger.hot && 'border-amber/50 bg-amber-soft/25'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-extrabold">{last.location || 'The lanes'}</p>
                <p className="mt-0.5 text-[12px] text-faint">{timeAgo(last.date)}</p>
              </div>
              <Badge tone={last.type === 'tournament' ? 'ember' : 'neutral'}>
                {last.type === 'tournament' ? 'Tournament' : 'Training'}
              </Badge>
            </div>

            <div className="mt-3.5 flex items-end gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Series</p>
                <p className="text-4xl font-extrabold leading-none tabular-nums">
                  {last.series_total}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  Average
                </p>
                <p className="text-4xl font-extrabold leading-none tabular-nums text-mint">
                  {last.session_average}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {(last.game_scores || []).map((s, i) => (
                <span
                  key={i}
                  className={cx(
                    'rounded-lg border px-2.5 py-1 text-[14px] font-extrabold tabular-nums',
                    s >= 200
                      ? 'border-amber/50 bg-amber-soft text-amber'
                      : 'border-border bg-surface-2'
                  )}
                >
                  {s}
                </span>
              ))}
            </div>

            {trigger.hot && (
              <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-amber">
                <Icon name="flame" size={16} filled />
                {trigger.reason}
              </p>
            )}

            <Button
              variant={trigger.hot ? 'primary' : 'soft'}
              full
              className={cx('mt-4', trigger.hot && 'animate-pulse-ring')}
              onClick={() => setHyping(true)}
            >
              <Icon name="flame" size={18} filled={trigger.hot} />
              Send the hype
            </Button>

            {pendingHype > 0 && (
              <p className="mt-2 text-center text-[12px] text-faint">
                {pendingHype} hype waiting — it fires the next time she opens the app.
              </p>
            )}
          </Card>
        ) : (
          <EmptyState
            icon={<Icon name="bowling" size={28} />}
            title="No scores yet"
            body="The moment she saves a game at the alley, it lands here."
          />
        )}
      </section>

      <div className="mb-6 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Stat label="Her average" value={overallAverage(sessions) || '—'} tone="mint" />
        <Stat label="Personal best" value={personalBest(sessions) || '—'} tone="amber" />
        <Stat label="Open bounties" value={active.length} tone="ember" />
        <Stat label="Needs restock" value={restock.length} />
      </div>

      {nextEvent && <NextUpCard event={nextEvent} />}

      <div className="grid gap-5 xl:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link to="/quests" className="text-[13px] font-bold text-muted hover:text-text">
                Send a quest
              </Link>
            }
          >
            On her hook right now
          </SectionTitle>

          {inProgress.length === 0 && active.length === 0 ? (
            <EmptyState
              icon={<Icon name="quest" size={28} />}
              title="Nothing requested"
              body="The quest board is empty. That is your job to fix."
              action={
                <Button as={Link} to="/quests" variant="primary">
                  <Icon name="plus" size={18} />
                  New quest
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {(inProgress.length ? inProgress : active).slice(0, 4).map((quest) => (
                <Card key={quest.id} className="flex items-center gap-3 p-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-soft text-violet">
                    <Icon name="yarn" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold leading-tight">{quest.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted">
                      {timeAgo(quest.date_requested)}
                    </p>
                  </div>
                  <QuestStatusBadge status={quest.status} />
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            action={
              <Link to="/supply" className="text-[13px] font-bold text-muted hover:text-text">
                Supply drop
              </Link>
            }
          >
            Running low
          </SectionTitle>

          {restock.length === 0 ? (
            <EmptyState
              icon={<Icon name="cart" size={28} />}
              title="Stash is healthy"
              body="Nothing marked low or empty. Nothing to surprise her with — yet."
            />
          ) : (
            <Card className="divide-y divide-border">
              {restock.slice(0, 5).map((yarn) => (
                <div key={yarn.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span
                    className="size-4 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ background: 'var(--border-strong)' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold leading-tight">{yarn.color}</p>
                    <p className="text-[12px] text-faint">{yarn.weight}</p>
                  </div>
                  <Badge tone={yarn.status === 'empty' ? 'ember' : 'amber'}>
                    {yarn.status === 'empty' ? 'Out' : 'Low'}
                  </Badge>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      <Card className="mt-6 flex items-start gap-3 p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint-soft text-mint">
          <Icon name="target" size={18} />
        </span>
        <p className="text-[13px] leading-relaxed text-muted">
          She can make <strong className="text-text">{summary.craftable}</strong> things right now
          with yarn she already owns. Requesting one of those means she can start tonight instead
          of waiting on a delivery.
        </p>
      </Card>

      <HypeModal open={hyping} onClose={() => setHyping(false)} session={last} />
    </div>
  )
}
