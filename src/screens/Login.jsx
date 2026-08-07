import { useState } from 'react'

import { Logo } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import { IS_DEMO } from '../lib/backend'

export function Login() {
  const { signIn, signUp, signInAsRole } = useAuth()

  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else await signUp(email.trim(), password, { name: name.trim() || 'Player', role: null })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-10 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={52} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Anchorchet</h1>
          <p className="mt-1.5 text-[15px] leading-snug text-muted">
            Two players. One yarn stash, a bowling average, and someone keeping score.
          </p>
        </div>

        {IS_DEMO ? (
          <DemoSignIn onPick={signInAsRole} />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <Field label="Your name" htmlFor="name">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should the app call you?"
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </Field>

            {error && (
              <p className="rounded-xl bg-ember-soft px-3.5 py-2.5 text-[13px] font-medium text-ember">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" full loading={busy} className="mt-1">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError('')
              }}
              className="mt-1 text-[14px] font-semibold text-muted hover:text-text"
            >
              {mode === 'signin'
                ? "First time? Create an account"
                : 'Already set up? Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function DemoSignIn({ onPick }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1 flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 px-3.5 py-3">
        <Icon name="sparkle" size={18} className="mt-0.5 shrink-0 text-amber" />
        <p className="text-[13px] leading-snug text-muted">
          Running in <strong className="text-text">demo mode</strong> with sample data saved to
          this browser. Add your Firebase keys to <code className="text-text">.env</code> to switch
          on real accounts and live sync.
        </p>
      </div>

      <RoleCard
        onClick={() => onPick('player1')}
        icon="yarn"
        tone="mint"
        title="Enter as Player 1"
        body="Crochet quests, yarn stash, bowling scores, focus music."
      />
      <RoleCard
        onClick={() => onPick('player2')}
        icon="anchor"
        tone="ember"
        title="Enter as Player 2"
        body="Send bounties, restock her yarn, watch scores land live."
      />

      <p className="mt-2 px-1 text-center text-[12px] leading-snug text-faint">
        Tip: open one role here and the other in a second tab — they sync to each other live.
      </p>
    </div>
  )
}

function RoleCard({ onClick, icon, title, body, tone }) {
  const tones = {
    mint: 'bg-mint text-[#05231f]',
    ember: 'bg-ember text-white',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="no-select flex w-full items-center gap-3.5 rounded-2xl border border-border bg-surface p-4 text-left shadow-card transition hover:border-border-strong active:scale-[0.99] motion-reduce:active:scale-100"
    >
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon name={icon} size={22} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{body}</span>
      </span>
      <Icon name="chevron" size={18} className="text-faint" />
    </button>
  )
}

function friendlyError(err) {
  const code = err?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return 'That email and password combination did not work.'
  if (code.includes('user-not-found')) return 'No account with that email yet.'
  if (code.includes('email-already-in-use')) return 'That email already has an account — sign in instead.'
  if (code.includes('weak-password')) return 'Password needs to be at least 6 characters.'
  if (code.includes('invalid-email')) return 'That does not look like a valid email.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a minute and try again.'
  if (code.includes('network')) return 'Network problem — check your connection.'
  return err?.message || 'Something went wrong. Try again.'
}
