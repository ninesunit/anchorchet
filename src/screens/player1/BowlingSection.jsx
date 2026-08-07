import { Outlet } from 'react-router-dom'

import { FocusPlayer } from '../../components/FocusPlayer'
import { SubTabs } from '../../components/layout/AppShell'
import { SUBNAV } from '../../nav'

export function BowlingSection() {
  return (
    <>
      <SubTabs items={SUBNAV['/bowling']} />
      <FocusPlayer variant="compact" />
      <Outlet />
    </>
  )
}
