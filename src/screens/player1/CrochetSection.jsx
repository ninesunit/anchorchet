import { Outlet } from 'react-router-dom'

import { FocusPlayer } from '../../components/FocusPlayer'
import { SubTabs } from '../../components/layout/AppShell'
import { SUBNAV } from '../../nav'

export function CrochetSection() {
  return (
    <>
      <SubTabs items={SUBNAV['/crochet']} />
      {/* Music stays mounted across the sub-tabs so switching from the stash to
          the quest board never interrupts playback. */}
      <FocusPlayer variant="compact" />
      <Outlet />
    </>
  )
}
