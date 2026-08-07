import { useState } from 'react'

import { Logo } from '../components/layout/AppShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import { backend, COLLECTIONS } from '../lib/backend'

/**
 * Shown once, after sign-up: pick which half of the app you live in.
 * The role drives the entire navigation tree, so it has to exist before the
 * shell can render.
 */
export function RoleSetup() {
  const { user, profile, signOut } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [role, setRole] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!role) return
    setBusy(true)
    setError('')
    try {
      await backend.db.set(COLLECTIONS.users, user.uid, {
        name: name.trim() || (role === 'player2' ? 'Player 2' : 'Player 1'),
        role,
        email: user.email ?? '',
        avatar_url: profile?.avatar_url || '',
      })
    } catch (err) {
      setError(err?.message || 'Could not save that. Try again.')
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-10 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="mt-4 text-xl font-extrabold tracking-tight">Which player are you?</h1>
          <p className="mt-1.5 text-[14px] text-muted">
            This decides what your side of the app does.
          </p>
        </div>

        <Field label="Your name" htmlFor="setup-name" className="mb-4">
          <Input
            id="setup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            autoComplete="name"
          />
        </Field>

        <div className="flex flex-col gap-3">
          <RoleOption
            selected={role === 'player1'}
            onClick={() => setRole('player1')}
            icon="yarn"
            title="Player 1 — the crafter"
            body="Yarn stash, crochet quests, bowling sessions, focus music."
          />
          <RoleOption
            selected={role === 'player2'}
            onClick={() => setRole('player2')}
            icon="anchor"
            title="Player 2 — the anchor"
            body="Send quests, restock yarn, watch her scores, hit the hype button."
          />
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-ember-soft px-3.5 py-2.5 text-[13px] font-medium text-ember">
            {error}
          </p>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-5"
          disabled={!role}
          loading={busy}
          onClick={save}
        >
          Enter Anchorchet
        </Button>

        <Button variant="ghost" size="sm" full className="mt-2" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function RoleOption({ selected, onClick, icon, title, body }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`no-select flex w-full items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? 'border-ember bg-ember-soft/40'
          : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          selected ? 'bg-ember text-white' : 'bg-surface-2 text-muted'
        }`}
      >
        <Icon name={icon} size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-muted">{body}</span>
      </span>
      {selected && <Icon name="check" size={20} className="mt-1 text-ember" strokeWidth={2.4} />}
    </button>
  )
}
