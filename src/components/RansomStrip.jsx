import { Link } from 'react-router-dom'

import { Icon } from './ui/Icon'
import { Card, SectionTitle } from './ui/Card'
import { useData } from '../context/DataContext'
import { cx } from '../lib/utils'

/**
 * The dashboard slice of the Mystery Ransom.
 *
 * Hers is the blurred rectangle she walks past; his is the approval sitting
 * there waiting. Both link through to the full board. Renders nothing when
 * there is nothing to show, so a dashboard with no ransoms on it stays clean.
 */
export function RansomStrip({ isPlayer2 = false }) {
  const { ransomTasks } = useData()

  const waiting = ransomTasks.filter((t) => t.status === 'submitted_for_approval')
  const locked = ransomTasks.filter((t) => t.status === 'pending')
  const show = isPlayer2 ? waiting : [...locked, ...waiting]

  if (show.length === 0) return null

  return (
    <section className="mb-6">
      <SectionTitle
        action={
          <Link to="/ransom" className="text-[13px] font-bold text-muted hover:text-text">
            All ransoms
          </Link>
        }
      >
        {isPlayer2 ? 'Waiting for your approval' : 'Locked up'}
      </SectionTitle>

      <div className="flex flex-col gap-2.5 xl:grid xl:grid-cols-2">
        {show.slice(0, 4).map((task) => (
          <Card
            key={task.id}
            as={Link}
            to="/ransom"
            interactive
            className="flex items-center gap-3 overflow-hidden p-3 pr-3.5"
          >
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              {task.anchor_photo_url && (
                <img
                  src={task.anchor_photo_url}
                  alt=""
                  className={cx(
                    'size-full object-cover',
                    // Blurred on her side even in the thumbnail — a legible
                    // 56px preview would give the whole thing away.
                    !isPlayer2 && 'scale-125 blur-[10px] saturate-[0.7]'
                  )}
                />
              )}
              {!isPlayer2 && (
                <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                  <Icon name="lock" size={17} strokeWidth={2} />
                </span>
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold leading-tight">{task.title}</span>
              <span className="mt-0.5 block truncate text-[12px] text-muted">
                {task.status === 'submitted_for_approval'
                  ? isPlayer2
                    ? 'Proof sent — your call'
                    : 'Proof sent. Waiting on him.'
                  : "Anchor's secret surprise"}
              </span>
            </span>

            <Icon
              name={task.status === 'submitted_for_approval' ? 'unlock' : 'chevron'}
              size={17}
              className={cx(
                'shrink-0',
                task.status === 'submitted_for_approval' ? 'text-amber' : 'text-faint'
              )}
            />
          </Card>
        ))}
      </div>
    </section>
  )
}
