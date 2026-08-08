import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { RansomStrip } from '../../components/RansomStrip'
import { SupportTiles } from '../../components/SupportTiles'
import { Badge, QuestStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { useData } from '../../context/DataContext'
import { stashSummary } from '../../data/engine'
import { overallAverage, personalBest, timeAgo } from '../../lib/utils'
import { NextUpCard, pickNextEvent } from './BowlingCalendar'

export function Player1Home() {
  const { quests, stash, sessions, events, hype } = useData()

  const summary = useMemo(() => stashSummary(stash), [stash])
  const active = quests.filter((q) => q.status !== 'completed')
  const nextEvent = pickNextEvent(events)
  const lastSession = sessions[0]
  const recentHype = hype.filter((h) => h.to === 'player1' && h.seen).slice(0, 3)

  return (
    <div className="animate-fade-up">
      {nextEvent && <NextUpCard event={nextEvent} />}

      <SupportTiles />

      <RansomStrip />

      <div className="mb-6 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <Stat
          label="Bowling avg"
          value={overallAverage(sessions) || '—'}
          tone="mint"
          sub={`PB ${personalBest(sessions) || '—'}`}
        />
        <Stat
          label="Can craft now"
          value={summary.craftable}
          tone="amber"
          sub={`${summary.balls} balls`}
        />
        <Stat label="Open bounties" value={active.length} tone="ember" />
        <Stat label="Cleared" value={quests.length - active.length} />
      </div>

      <section className="mb-7">
        <SectionTitle
          action={
            <Link
              to="/crochet/projects"
              className="text-[13px] font-bold text-muted hover:text-text"
            >
              All quests
            </Link>
          }
        >
          From Player 2
        </SectionTitle>

        {active.length === 0 ? (
          <EmptyState
            icon={<Icon name="quest" size={28} />}
            title="No open bounties"
            body="Nothing requested right now. Enjoy the quiet, or go poke him about it."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {active.slice(0, 3).map((quest) => (
              <Card
                key={quest.id}
                as={Link}
                to="/crochet/projects"
                interactive
                className="flex items-center gap-3 p-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ember-soft text-ember">
                  <Icon name="quest" size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold leading-tight">{quest.title}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted">
                    {quest.reward ? `Reward: ${quest.reward}` : timeAgo(quest.date_requested)}
                  </p>
                </div>
                <QuestStatusBadge status={quest.status} />
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link
                to="/bowling/sessions"
                className="text-[13px] font-bold text-muted hover:text-text"
              >
                Log a session
              </Link>
            }
          >
            Last time out
          </SectionTitle>

          {lastSession ? (
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold">{lastSession.location || 'The lanes'}</p>
                  <p className="mt-0.5 text-[12px] text-faint">{timeAgo(lastSession.date)}</p>
                </div>
                <Badge tone={lastSession.type === 'tournament' ? 'ember' : 'neutral'}>
                  {lastSession.type === 'tournament' ? 'Tournament' : 'Training'}
                </Badge>
              </div>
              <div className="mt-3 flex items-end gap-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    Series
                  </p>
                  <p className="text-3xl font-extrabold leading-none tabular-nums">
                    {lastSession.series_total}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    Average
                  </p>
                  <p className="text-3xl font-extrabold leading-none tabular-nums text-mint">
                    {lastSession.session_average}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(lastSession.game_scores || []).map((s, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-border bg-surface-2 px-2 py-0.5 text-[13px] font-bold tabular-nums"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={<Icon name="bowling" size={28} />}
              title="No sessions yet"
              body="Log your first series and the averages start building."
              action={
                <Button as={Link} to="/bowling/sessions" variant="primary">
                  Log a session
                </Button>
              }
            />
          )}
        </section>

        {recentHype.length > 0 && (
          <section>
            <SectionTitle>He said</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {recentHype.map((h) => (
                <Card key={h.id} className="flex items-start gap-3 p-3.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-ember text-white">
                    <Icon name="flame" size={16} filled />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] leading-snug">{h.message}</p>
                    <p className="mt-1 text-[11px] text-faint">{timeAgo(h.created_at)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
