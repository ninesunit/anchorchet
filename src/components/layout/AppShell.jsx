import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { cx } from '../../lib/utils'
import { NAV } from '../../nav'
import { Avatar } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { HypeWatcher } from './HypeWatcher'

/**
 * One shell, three layouts:
 *   phone  (<768)      bottom tab bar, full-bleed content
 *   tablet (768–1179)  icon rail on the left  — iPad portrait / split view
 *   desktop(>=1180)    labelled sidebar, wider content grid
 *
 * The switch is pure CSS so there is no layout flash on load and rotating an
 * iPad re-lays-out instantly without a resize listener.
 */
export function AppShell() {
  const { profile, role } = useAuth()
  const items = NAV[role] ?? NAV.player1

  return (
    <div className="min-h-dvh bg-bg">
      <HypeWatcher />
      <SideNav items={items} profile={profile} />

      <div className="md:pl-[76px] xl:pl-64">
        <TopBar profile={profile} />
        <main
          className={cx(
            'mx-auto w-full max-w-2xl px-4 xl:max-w-6xl xl:px-8',
            // Bottom padding clears the tab bar + home indicator on phones.
            'pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-12'
          )}
        >
          <Outlet />
        </main>
      </div>

      <TabBar items={items} />
    </div>
  )
}

/* ------------------------------------------------------------- side nav -- */

function SideNav({ items, profile }) {
  const { signOut } = useAuth()

  return (
    <nav
      className={cx(
        'no-select fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface md:flex',
        'w-[76px] xl:w-64',
        'pl-safe pt-safe'
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-5 xl:px-5">
        <Logo />
        <span className="hidden text-[17px] font-extrabold tracking-tight xl:block">
          Anchorchet
        </span>
      </div>

      <div className="scroll-y flex-1 px-3 py-2 xl:px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition',
                'justify-center xl:justify-start',
                isActive
                  ? 'bg-surface-2 text-text'
                  : 'text-muted hover:bg-surface-2/60 hover:text-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.1 : 1.7} />
                <span className="hidden text-[14px] xl:block">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-xl px-2 py-2 transition',
              'justify-center xl:justify-start',
              isActive ? 'bg-surface-2' : 'hover:bg-surface-2/60'
            )
          }
        >
          <Avatar name={profile?.name} url={profile?.avatar_url} size="sm" />
          <span className="hidden min-w-0 flex-1 xl:block">
            <span className="block truncate text-[13px] font-semibold">{profile?.name}</span>
            <span className="block truncate text-[11px] text-faint">
              {profile?.role === 'player2' ? 'The Anchor' : 'Player 1'}
            </span>
          </span>
        </NavLink>
        {/* Wrapped rather than putting `hidden xl:flex` on the Button itself:
            the Button's own `inline-flex` is emitted later in the stylesheet
            and wins over `hidden`, so it would never actually hide. */}
        <div className="hidden xl:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-1 w-full justify-start gap-3 px-3"
          >
            <Icon name="logout" size={18} />
            Sign out
          </Button>
        </div>
      </div>
    </nav>
  )
}

/* -------------------------------------------------------------- tab bar -- */

function TabBar({ items }) {
  return (
    <nav
      className={cx(
        'no-select fixed inset-x-0 bottom-0 z-40 md:hidden',
        'border-t border-border bg-surface/90 backdrop-blur-xl',
        'pb-[env(safe-area-inset-bottom,0px)] px-safe'
      )}
    >
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 transition',
                // min-h keeps every tab a 44pt-tall target
                'min-h-[52px]',
                isActive ? 'text-ember' : 'text-faint'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icon} size={23} strokeWidth={isActive ? 2.2 : 1.7} />
                <span className="text-[10px] font-bold tracking-tight">
                  {item.short ?? item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/* --------------------------------------------------------------- top bar -- */

const TITLES = {
  '/': '',
  '/crochet': 'Crochet',
  '/bowling': 'Bowling',
  '/fame': 'Hall of Fame',
  '/focus': 'Focus Mode',
  '/quests': 'Quest Board',
  '/supply': 'Supply Drop',
  '/settings': 'Settings',
}

function TopBar({ profile }) {
  const { pathname } = useLocation()
  const { theme, cycle } = useTheme()

  const base = '/' + (pathname.split('/')[1] || '')
  const title = TITLES[base] ?? ''

  return (
    <header
      className={cx(
        'sticky top-0 z-30 border-b border-transparent bg-bg/85 backdrop-blur-xl',
        'pt-safe px-safe'
      )}
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 xl:max-w-6xl xl:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="md:hidden">
            <Logo size={26} />
          </span>
          <h1 className="truncate text-[19px] font-extrabold tracking-tight">
            {title || `Hey, ${profile?.name?.split(' ')[0] ?? 'you'}`}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={cycle}
          aria-label={`Theme: ${theme}. Tap to change.`}
          title={`Theme: ${theme}`}
        >
          <Icon name={theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'sparkle'} size={19} />
        </Button>

        <NavLink to="/settings" className="md:hidden" aria-label="Settings">
          <Avatar name={profile?.name} url={profile?.avatar_url} size="sm" />
        </NavLink>
      </div>
    </header>
  )
}

export function Logo({ size = 30 }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-ember text-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon name="anchor" size={size * 0.62} strokeWidth={2} />
    </span>
  )
}

/* ------------------------------------------------------------- sub-tabs -- */

/** Secondary nav used inside the Crochet and Bowling sections. */
export function SubTabs({ items, className }) {
  return (
    <div className={cx('no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4', className)}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cx(
              'no-select inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-[13px] font-bold transition',
              isActive
                ? 'border-transparent bg-text text-bg'
                : 'border-border bg-surface text-muted hover:text-text'
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
