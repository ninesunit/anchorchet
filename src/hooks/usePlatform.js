import { useEffect, useState } from 'react'

/** Subscribe to a CSS media query. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mq.matches)
    // addListener is the pre-14 Safari spelling, still needed on old iPadOS.
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else mq.addListener(onChange)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange)
      else mq.removeListener(onChange)
    }
  }, [query])

  return matches
}

/**
 * Layout breakpoints.
 *
 * These are about *layout*, not device identity: an iPad in portrait and a
 * narrow desktop window both get the tablet treatment, which is the correct
 * outcome. iPadOS Safari also reports a desktop user-agent, so sniffing the UA
 * would get this wrong anyway.
 */
export function useLayout() {
  const isPhone = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1179px)')
  const isDesktop = useMediaQuery('(min-width: 1180px)')
  const isLandscape = useMediaQuery('(orientation: landscape)')
  const isStandalone = useStandalone()
  return { isPhone, isTablet, isDesktop, isLandscape, isStandalone }
}

/** True when launched from the iOS/iPadOS home screen rather than in Safari. */
export function useStandalone() {
  const [standalone, setStandalone] = useState(false)
  useEffect(() => {
    const check = () =>
      setStandalone(
        window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true
      )
    check()
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', check)
    return () => mq.removeEventListener?.('change', check)
  }, [])
  return standalone
}

/** iPhone or iPad, including iPadOS's desktop-class Safari. */
export function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ claims to be a Mac; the touch point count gives it away.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function isSafari() {
  if (typeof navigator === 'undefined') return false
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)
}
