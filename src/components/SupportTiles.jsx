import { useState } from 'react'
import { Link } from 'react-router-dom'

import { LifelineModal } from './LifelineModal'
import { Icon } from './ui/Icon'
import { SectionTitle } from './ui/Card'
import { useData } from '../context/DataContext'
import { cx } from '../lib/utils'

/**
 * Permanent doors to the Lifeline and the Mystery Ransom.
 *
 * Both of these first shipped attached to content — the lifeline next to a
 * task, the ransom card only when a ransom existed — which meant that on a
 * dashboard with neither, two of the app's headline features were nowhere at
 * all. A feature you have to already be using in order to find is not
 * discoverable. These tiles are always here, whatever the state.
 *
 * The lifeline opens straight from the tile with no task attached, because
 * "generally cannot start anything today" is at least as common as being stuck
 * on one specific chore.
 */
export function SupportTiles({ isPlayer2 = false }) {
  const { ransomTasks } = useData()
  const [lifeline, setLifeline] = useState(false)

  const locked = ransomTasks.filter((t) => t.status === 'pending').length
  const waiting = ransomTasks.filter((t) => t.status === 'submitted_for_approval').length

  return (
    <section className="mb-6">
      <SectionTitle>{isPlayer2 ? 'Her corner' : 'In your corner'}</SectionTitle>

      <div className="grid grid-cols-2 gap-2.5">
        {isPlayer2 ? (
          <Tile
            as={Link}
            to="/toolkit"
            tone="mint"
            icon="mic"
            title="Anchor Kit"
            sub="Record notes & slips"
          />
        ) : (
          <Tile
            as="button"
            onClick={() => setLifeline(true)}
            tone="mint"
            icon="lifeline"
            title="Lifeline"
            sub="Cannot get started?"
          />
        )}

        <Tile
          as={Link}
          to="/ransom"
          tone={waiting > 0 ? 'amber' : 'ember'}
          icon={waiting > 0 ? 'unlock' : 'lock'}
          title="Mystery Ransom"
          sub={
            waiting > 0
              ? `${waiting} waiting on ${isPlayer2 ? 'you' : 'him'}`
              : locked > 0
                ? `${locked} locked`
                : isPlayer2
                  ? 'Hide one behind a chore'
                  : 'Nothing locked yet'
          }
        />
      </div>

      <LifelineModal open={lifeline} onClose={() => setLifeline(false)} />
    </section>
  )
}

const TONES = {
  mint: 'border-mint/40 bg-mint-soft/25 text-mint',
  amber: 'border-amber/45 bg-amber-soft/30 text-amber',
  ember: 'border-ember/35 bg-ember-soft/20 text-ember',
}

function Tile({ as: Tag = 'button', tone, icon, title, sub, className, ...rest }) {
  return (
    <Tag
      className={cx(
        'flex min-h-[76px] flex-col justify-between rounded-2xl border p-3.5 text-left transition active:scale-[0.98]',
        TONES[tone],
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={20} strokeWidth={1.9} />
      <span className="mt-2 block">
        <span className="block text-[14px] font-extrabold leading-tight text-text">{title}</span>
        <span className="mt-0.5 block truncate text-[12px] font-semibold">{sub}</span>
      </span>
    </Tag>
  )
}
