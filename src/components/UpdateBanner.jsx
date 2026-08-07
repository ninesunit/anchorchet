import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

/** How often to ask the server whether a new build exists. */
const CHECK_EVERY_MS = 60 * 60 * 1000

/**
 * "App updated — tap to reload".
 *
 * An installed iOS home-screen app can sit open for days without ever
 * re-requesting the shell, which is how it ends up a version behind. Three
 * things force the check: a periodic timer, returning to the app from the
 * background, and coming back online.
 *
 * The banner is a prompt rather than a silent reload on purpose — reloading
 * out from under someone mid-way through logging a bowling series would lose
 * whatever is in the form.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => {
        // No point asking while offline; the next online event covers it.
        if (navigator.onLine === false) return
        registration.update().catch(() => {
          /* transient network failure — the next trigger retries */
        })
      }

      const timer = setInterval(check, CHECK_EVERY_MS)
      const onVisible = () => {
        if (document.visibilityState === 'visible') check()
      }
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('online', check)
      window.addEventListener('focus', check)

      registration.__anchorchetCleanup = () => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', onVisible)
        window.removeEventListener('online', check)
        window.removeEventListener('focus', check)
      }
    },
  })

  // Nothing to clean up in the common case; this only matters in dev HMR.
  useEffect(() => () => {}, [])

  if (!needRefresh) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
      <div className="animate-fade-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-bg-elevated px-4 py-3 shadow-pop">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint text-[#05231f]">
          <Icon name="sparkle" size={17} strokeWidth={2.2} />
        </span>
        <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
          App updated
          <span className="block text-[12px] font-normal text-muted">
            Reload to get the new version.
          </span>
        </p>
        <Button variant="ghost" size="sm" onClick={() => setNeedRefresh(false)}>
          Later
        </Button>
        <Button variant="mint" size="sm" onClick={() => updateServiceWorker(true)}>
          Reload
        </Button>
      </div>
    </div>
  )
}
