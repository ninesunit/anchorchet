import { useEffect, useState } from 'react'

import { Avatar, Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { Field, Input, Segmented } from '../components/ui/Field'
import { Icon } from '../components/ui/Icon'
import { ConfirmDialog } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isIOS, useStandalone } from '../hooks/usePlatform'
import { backend, COLLECTIONS, IS_DEMO } from '../lib/backend'
import { compressImage } from '../lib/image'
import { notificationPermission, requestNotifications } from '../lib/notify'

export function Settings() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const standalone = useStandalone()

  const [name, setName] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(0)
  const [permission, setPermission] = useState(notificationPermission())
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setName(profile?.name || '')
  }, [profile?.name])

  const dirty = name.trim() !== (profile?.name || '') && name.trim().length > 0

  async function saveProfile(patch) {
    setSaving(true)
    await backend.db.set(COLLECTIONS.users, user.uid, patch)
    setSaving(false)
    setSavedAt(Date.now())
  }

  async function pickAvatar(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const url = await compressImage(file, { maxEdge: 320, quality: 0.8 })
      await saveProfile({ avatar_url: url })
    } catch {
      /* ignore — the picker shows nothing changed */
    }
  }

  return (
    <div className="animate-fade-up flex flex-col gap-7">
      <section>
        <SectionTitle>Profile</SectionTitle>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="relative cursor-pointer">
              <Avatar name={profile?.name} url={profile?.avatar_url} size="lg" />
              <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-surface bg-ember text-white">
                <Icon name="plus" size={13} strokeWidth={3} />
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={pickAvatar}
                className="sr-only"
                aria-label="Change avatar"
              />
            </label>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{profile?.name}</p>
              <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted">
                <Badge tone={profile?.role === 'player2' ? 'ember' : 'mint'}>
                  {profile?.role === 'player2' ? 'Player 2 · Anchor' : 'Player 1 · Crafter'}
                </Badge>
              </p>
            </div>
          </div>

          <Field label="Display name" className="mt-4" htmlFor="settings-name">
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoCapitalize="words"
            />
          </Field>

          <Button
            variant="primary"
            full
            className="mt-3"
            disabled={!dirty}
            loading={saving}
            onClick={() => saveProfile({ name: name.trim() })}
          >
            {savedAt && !dirty ? 'Saved' : 'Save name'}
          </Button>

          {user?.email && (
            <p className="mt-3 text-center text-[12px] text-faint">{user.email}</p>
          )}
        </Card>
      </section>

      <section>
        <SectionTitle>Appearance</SectionTitle>
        <Card className="p-4">
          <Field label="Theme" hint="System follows your device">
            <Segmented
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle>Notifications</SectionTitle>
        <Card className="p-4">
          <p className="text-[13px] leading-relaxed text-muted">
            {profile?.role === 'player2'
              ? 'Get a heads-up on your phone the moment she saves a score at the alley.'
              : 'Get notified when Player 2 sends a new quest or fires off hype.'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Badge
              tone={
                permission === 'granted' ? 'mint' : permission === 'denied' ? 'ember' : 'neutral'
              }
            >
              {permission === 'unsupported' ? 'Not supported' : permission}
            </Badge>
            {permission === 'default' && (
              <Button
                variant="soft"
                size="sm"
                onClick={async () => setPermission(await requestNotifications())}
              >
                <Icon name="bell" size={15} />
                Turn on
              </Button>
            )}
          </div>

          {isIOS() && !standalone && (
            <p className="mt-3 rounded-xl bg-amber-soft/50 px-3.5 py-3 text-[12px] leading-snug text-text">
              On iPhone and iPad, notifications only work once the app is added to the home
              screen. See the install steps below.
            </p>
          )}
          {permission === 'denied' && (
            <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] leading-snug text-muted">
              Notifications are blocked for this site. Re-enable them in your browser&rsquo;s site
              settings.
            </p>
          )}
        </Card>
      </section>

      {!standalone && (
        <section>
          <SectionTitle>Install it properly</SectionTitle>
          <Card className="p-4">
            <p className="text-[13px] leading-relaxed text-muted">
              Adding Anchorchet to the home screen gives it a real app icon, full screen, and
              unlocks notifications on iOS.
            </p>
            <InstallSteps />
          </Card>
        </section>
      )}

      <section>
        <SectionTitle>Data</SectionTitle>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">Backend</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {IS_DEMO
                  ? 'Demo mode — saved in this browser only'
                  : 'Firebase — live sync across devices'}
              </p>
            </div>
            <Badge tone={IS_DEMO ? 'amber' : 'mint'} dot>
              {IS_DEMO ? 'Demo' : 'Live'}
            </Badge>
          </div>

          {IS_DEMO && (
            <>
              <p className="mt-3 rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] leading-snug text-muted">
                Fill in <code className="font-mono text-text">.env</code> with your Firebase
                config and restart the dev server to switch to real accounts and cross-device
                sync. The seeded sample data is not carried over.
              </p>
              <Button
                variant="danger"
                full
                className="mt-3"
                onClick={() => setConfirmReset(true)}
              >
                <Icon name="trash" size={17} />
                Reset demo data
              </Button>
            </>
          )}
        </Card>
      </section>

      <Button variant="soft" full size="lg" onClick={signOut}>
        <Icon name="logout" size={18} />
        Sign out
      </Button>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          backend.reset?.()
          window.location.reload()
        }}
        title="Reset demo data?"
        body="Everything you've added in demo mode is wiped and the sample content comes back."
        confirmLabel="Reset"
      />
    </div>
  )
}

function InstallSteps() {
  const ios = isIOS()

  const steps = ios
    ? [
        'Open Anchorchet in Safari (not Chrome — iOS only allows Safari to install).',
        'Tap the Share button in the toolbar.',
        'Scroll down and tap "Add to Home Screen".',
        'Tap Add. It now launches full screen with its own icon.',
      ]
    : [
        'Open the browser menu (⋮ in Chrome, or the address-bar install icon).',
        'Choose "Install Anchorchet" or "Add to Home screen".',
        'Confirm. It opens in its own window from then on.',
      ]

  return (
    <ol className="mt-3 flex flex-col gap-2.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-extrabold text-muted">
            {i + 1}
          </span>
          <span className="text-[13px] leading-snug text-muted">{step}</span>
        </li>
      ))}
    </ol>
  )
}
