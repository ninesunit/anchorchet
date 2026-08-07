import { useMemo, useState } from 'react'

import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, EmptyState, SectionTitle, Stat } from '../../components/ui/Card'
import { Chip, ChipRow } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { Sparkline } from '../../components/ui/Sparkline'
import { useData } from '../../context/DataContext'
import { cx, formatDateLong, overallAverage, personalBest } from '../../lib/utils'
import { Alley } from '../Alley'
import { Arsenal } from '../player1/Arsenal'
import { BowlingCalendar } from '../player1/BowlingCalendar'
import { HypeModal } from './HypeButton'

/** Read-only mirror of her bowling data, plus the hype button. */
export function BowlingWatch() {
  const { sessions } = useData()
  const [tab, setTab] = useState('sessions')
  const [hyping, setHyping] = useState(null)

  const stats = useMemo(
    () => ({
      average: overallAverage(sessions),
      best: personalBest(sessions),
      games: sessions.reduce((n, s) => n + (s.game_scores?.length || 0), 0),
      tournaments: sessions.filter((s) => s.type === 'tournament').length,
    }),
    [sessions]
  )

  const trend = useMemo(
    () => [...sessions].reverse().map((s) => Number(s.session_average) || 0),
    [sessions]
  )

  return (
    <div className="animate-fade-up">
      <ChipRow className="mb-4">
        <Chip active={tab === 'sessions'} onClick={() => setTab('sessions')}>
          Sessions
        </Chip>
        <Chip active={tab === 'arsenal'} onClick={() => setTab('arsenal')}>
          Her arsenal
        </Chip>
        <Chip active={tab === 'calendar'} onClick={() => setTab('calendar')}>
          Her calendar
        </Chip>
        <Chip active={tab === 'alley'} onClick={() => setTab('alley')}>
          The Alley
        </Chip>
      </ChipRow>

      {tab === 'calendar' ? (
        <BowlingCalendar readOnly />
      ) : tab === 'arsenal' ? (
        <Arsenal readOnly />
      ) : tab === 'alley' ? (
        <Alley />
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            <Stat label="Average" value={stats.average || '—'} tone="mint" sub={`${stats.games} games`} />
            <Stat label="Personal best" value={stats.best || '—'} tone="amber" />
            <Stat label="Sessions" value={sessions.length} />
            <Stat label="Tournaments" value={stats.tournaments} tone="ember" />
          </div>

          {trend.length >= 2 && (
            <Card className="mb-5 p-4">
              <SectionTitle>Where she&rsquo;s trending</SectionTitle>
              <Sparkline values={trend} height={56} />
              <div className="mt-2 flex justify-between text-[11px] font-medium text-faint">
                <span>{formatDateLong(sessions[sessions.length - 1]?.date)}</span>
                <span>{formatDateLong(sessions[0]?.date)}</span>
              </div>
            </Card>
          )}

          {sessions.length === 0 ? (
            <EmptyState
              icon={<Icon name="bowling" size={30} />}
              title="No sessions yet"
              body="Her scores appear here the second she saves them at the alley."
            />
          ) : (
            <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold leading-tight">
                        {session.location || 'The lanes'}
                      </p>
                      <p className="mt-0.5 text-[12px] text-faint">
                        {formatDateLong(session.date)}
                      </p>
                    </div>
                    <Badge tone={session.type === 'tournament' ? 'ember' : 'neutral'}>
                      {session.type === 'tournament' ? 'Tournament' : 'Training'}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(session.game_scores || []).map((s, i) => (
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

                  <div className="mt-3 flex items-center gap-5 border-t border-border pt-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                        Series
                      </p>
                      <p className="text-lg font-extrabold leading-tight tabular-nums">
                        {session.series_total}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
                        Average
                      </p>
                      <p className="text-lg font-extrabold leading-tight tabular-nums text-mint">
                        {session.session_average}
                      </p>
                    </div>
                    <Button
                      variant="soft"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setHyping(session)}
                    >
                      <Icon name="flame" size={15} />
                      Hype
                    </Button>
                  </div>

                  {session.note && (
                    <p className="mt-2.5 text-[13px] leading-snug text-muted">{session.note}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <HypeModal open={Boolean(hyping)} onClose={() => setHyping(null)} session={hyping} />
    </div>
  )
}
