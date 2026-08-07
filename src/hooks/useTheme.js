import { useCallback, useEffect, useState } from 'react'

const KEY = 'anchorchet.theme'

/**
 * Three-state theme: 'system' | 'light' | 'dark'.
 * 'system' removes the attribute entirely so the CSS media query takes over.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* private mode */
    }
  }, [theme])

  const setTheme = useCallback((next) => setThemeState(next), [])

  const cycle = useCallback(() => {
    setThemeState((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'))
  }, [])

  return { theme, setTheme, cycle }
}
