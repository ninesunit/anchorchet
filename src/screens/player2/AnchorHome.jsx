import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { RansomStrip } from '../../components/RansomStrip'
import { Badge, QuestStatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Icon } from '../../components/ui/Icon'
import { useData } from '../../context/DataContext'
import { stashSummary } from '../../data/engine'
import { BENCHMARK, benchmarkStanding } from '../../data/bowlingStats'
import { cx, overallAverage, personalBest, timeAgo } from '../../lib/utils'
import { DropTutorialCard } from '../Manual'
import { NextUpCard, pickNextEvent } from '../player1/BowlingCalendar'
import { HypeModal, useHypeTrigger } from './HypeButton'

export function AnchorHome() {
  const { quests, stash, sessions, events, hype } = useData()
  const [hyping, setHyping] = useState(false)

  const summary = useMemo(() => stashSummary(stash), [stash])
  const active = quests.filter((q) => q.status !== 'completed')
  const inProgress = quests.filter((q) => q.status === 'in_progress')
  const nextEvent = pickNextEvent(events)
  const restock = stash.filter((y) => y.status === 'empty' || y.status === 'low')

  /**
   * One session drives the whole card.
   *
   * Prefer the one she has explicitly left open; fall back to the newest so the
   * panel still shows something once she has ended for the day. `is_active` is
   * the authority — an old bug had the header hardcoded to "Live from the
   * lanes", so a session ended fourteen hours ago still claimed to be live.
   */
  const session = sessions.find((s) => s.is_active === true || s.status === 'live') || sessions[0]
  const isLive = Boolean(session && (session.is_active === true || session.status === 'live'))

  /**
   * Over/under comes off the document when she has one, so his screen shows the
   * same number hers does even if the two disagree about rounding. Recomputing
   * from game_scores is the fallback for sessions saved before the field
   * existed.
   */
  const scores = session?.game_scores || []
  const computed = session ? benchmarkStanding(scores) : null
  const standing =
    computed && typeof session?.current_over_under === 'number'
      ? {
          ...computed,
          diff: session.current_over_under,
          ahead: session.current_over_under > 0,
          needNext:
            typeof session.pins_needed_next_game === 'number'
              ? session.pins_needed_next_game
              : computed.needNext,
        }
      : computed

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
          <span className="inline-flex items-center gap-2">
            {isLive && (
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember opacity-70" />
                <span className="relative inline-flex size-2.5 rounded-full bg-ember" />
              </span>
            )}
            {isLive ? 'Live from the lanes' : 'Latest session'}
          </span>
        </SectionTitle>

        {session ? (
          <Card
            className={cx(
              'p-4',
              isLive && 'border-ember/40',
              trigger.hot && 'border-amber/50 bg-amber-soft/25'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-extrabold">{session.location || 'The lanes'}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[12px]">
                  {isLive ? (
                    <span className="font-bold text-ember">Bowling now</span>
                  ) : (
                    <span className="text-faint">Finished {timeAgo(session.date)}</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge tone={session.type === 'tournament' ? 'ember' : 'neutral'}>
                  {session.type === 'tournament' ? 'Tournament' : 'Training'}
                </Badge>
                {!isLive && <Badge tone="mint">Completed</Badge>}
              </div>
            </div>

            {standing && standing.played > 0 && (
              <div
                className={cx(
                  'mt-3 flex items-center gap-3 rounded-xl border px-3.5 py-2.5',
                  standing.diff === 0
                    ? 'border-border bg-surface-2'
                    : standing.ahead
                      ? 'border-mint/50 bg-mint-soft/30'
                      : 'border-amber/50 bg-amber-soft/30'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                    vs {BENCHMARK} pace · {standing.played} game
                    {standing.played === 1 ? '' : 's'}
                  </p>
                  <p
                    className={cx(
                      'text-xl font-extrabold leading-none tabular-nums',
                      standing.diff === 0
                        ? 'text-text'
                        : standing.ahead
                          ? 'text-mint'
                          : 'text-amber'
                    )}
                  >
                    {standing.diff === 0
                      ? 'Level'
                      : standing.ahead
                        ? `Over ${standing.diff}`
                        : `Under ${Math.abs(standing.diff)}`}
                  </p>
                </div>
                {!standing.banked && standing.reachable && (
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                      Needs next
                    </p>
                    <p className="text-xl font-extrabold leading-none tabular-nums">
                      {standing.needNext}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3.5 flex items-end gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">Series</p>
                <p className="text-4xl font-extrabold leading-none tabular-nums">
                  {session.series_total}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  Average
                </p>
                <p className="text-4xl font-extrabold leading-none tabular-nums text-mint">
                  {session.session_average}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                  Games
                </p>
                <p className="text-4xl font-extrabold leading-none tabular-nums">
                  {scores.length}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {/* straight off game_scores, in the order she bowled them */}
              {scores.map((score, i) => (
                <span
                  key={i}
                  className={cx(
                    'rounded-lg border px-2.5 py-1 text-[14px] font-extrabold tabular-nums',
                    score >= BENCHMARK
                      ? 'border-mint/50 bg-mint-soft text-mint'
                      : 'border-border bg-surface-2'
                  )}
                  title={`Game ${i + 1}`}
                >
                  {score}
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

      <RansomStrip isPlayer2 />

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

      <DropTutorialCard />

      <HypeModal open={hyping} onClose={() => setHyping(false)} session={session} />
    </div>
  )
}
