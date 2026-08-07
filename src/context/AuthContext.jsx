import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { backend, COLLECTIONS, IS_DEMO } from '../lib/backend'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still resolving the session, null = signed out
  const [user, setUser] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => backend.auth.onChange(setUser), [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    return backend.db.subscribeDoc(COLLECTIONS.users, user.uid, (doc) => {
      setProfile(doc)
      setProfileLoading(false)
    })
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      // Treat a signed-in user whose profile hasn't arrived yet as loading, or
      // the router will bounce them to onboarding for a frame on every refresh.
      loading: user === undefined || (Boolean(user) && profileLoading),
      role: profile?.role ?? null,
      isPlayer1: profile?.role === 'player1',
      isPlayer2: profile?.role === 'player2',
      isDemo: IS_DEMO,
      signIn: (email, password) => backend.auth.signIn(email, password),
      signUp: (email, password, p) => backend.auth.signUp(email, password, p),
      signInAsRole: (role) => backend.auth.signInAsRole?.(role),
      signOut: () => backend.auth.signOut(),
    }),
    [user, profile, profileLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
