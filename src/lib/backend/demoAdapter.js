/**
 * Offline adapter used whenever Firebase env vars are absent.
 *
 * Stores everything in localStorage and mimics Firestore's realtime listeners
 * via an in-page emitter plus a BroadcastChannel, so opening Player 1 in one
 * tab and Player 2 in another still gives you live two-way sync while you are
 * developing or demoing.
 */

import { seedDemoData } from '../../data/seed'

const KEY = 'anchorchet.demo.v1'
const SESSION_KEY = 'anchorchet.demo.session'

// Data lives in localStorage (shared by every tab) but the signed-in session
// lives in sessionStorage (per tab). That split is what lets you open Player 1
// in one tab and Player 2 in another and watch them sync to each other — with
// a shared session both tabs would be forced into the same role.
const sessionStore = () => (typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage)

const channel =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('anchorchet') : null

const listeners = new Set()

function emit(local = true) {
  listeners.forEach((fn) => fn())
  if (local && channel) channel.postMessage('changed')
}

if (channel) channel.onmessage = () => listeners.forEach((fn) => fn())
if (typeof window !== 'undefined') {
  // Fallback for browsers without BroadcastChannel (older iPadOS Safari).
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) listeners.forEach((fn) => fn())
  })
}

function readStore() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Corrupt or unreadable (Safari private mode) — fall through to a reseed.
  }
  const seeded = seedDemoData()
  try {
    localStorage.setItem(KEY, JSON.stringify(seeded))
  } catch {
    /* private mode: keep it in memory only */
  }
  return seeded
}

function writeStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode — the in-memory copy still drives this tab */
  }
  emit()
}

const uid = () => Math.random().toString(36).slice(2, 11)

/** localStorage can only hold strings, so Dates round-trip as ISO. */
function revive(doc) {
  const out = { ...doc }
  for (const [k, v] of Object.entries(out)) {
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v)) {
      out[k] = new Date(v)
    }
  }
  return out
}

function serialize(data) {
  const out = { ...data }
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Date) out[k] = v.toISOString()
  }
  return out
}

/* ------------------------------------------------------------------ auth -- */

let currentUser = null
const authListeners = new Set()

function loadSession() {
  try {
    const raw = sessionStore().getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(user) {
  currentUser = user
  try {
    if (user) sessionStore().setItem(SESSION_KEY, JSON.stringify(user))
    else sessionStore().removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
  authListeners.forEach((fn) => fn(user))
}

currentUser = loadSession()

const auth = {
  onChange(cb) {
    authListeners.add(cb)
    // Match Firebase's async-first-callback so the UI shows one loading pass.
    queueMicrotask(() => cb(currentUser))
    return () => authListeners.delete(cb)
  },

  /** Demo mode signs in by role — there is no password to verify offline. */
  async signInAsRole(role) {
    const store = readStore()
    const profile = Object.entries(store.users).find(([, u]) => u.role === role)
    if (!profile) throw new Error(`No demo user for role ${role}`)
    saveSession({ uid: profile[0], email: profile[1].email ?? null })
    return currentUser
  },

  async signIn(email) {
    const store = readStore()
    const found = Object.entries(store.users).find(
      ([, u]) => (u.email || '').toLowerCase() === email.toLowerCase()
    )
    if (!found) throw new Error('No account with that email in demo mode.')
    saveSession({ uid: found[0], email: found[1].email })
    return currentUser
  },

  async signUp(email, _password, profile) {
    const store = readStore()
    const id = uid()
    store.users[id] = { email, ...profile, created_at: new Date().toISOString() }
    writeStore(store)
    saveSession({ uid: id, email })
    return currentUser
  },

  async signOut() {
    saveSession(null)
  },

  get current() {
    return currentUser
  },
}

/* -------------------------------------------------------------------- db -- */

const db = {
  subscribe(collection, cb) {
    const run = () => {
      const store = readStore()
      const bucket = store[collection] || {}
      cb(Object.entries(bucket).map(([id, v]) => ({ id, ...revive(v) })))
    }
    listeners.add(run)
    queueMicrotask(run)
    return () => listeners.delete(run)
  },

  subscribeDoc(collection, id, cb) {
    const run = () => {
      const store = readStore()
      const doc = (store[collection] || {})[id]
      cb(doc ? { id, ...revive(doc) } : null)
    }
    listeners.add(run)
    queueMicrotask(run)
    return () => listeners.delete(run)
  },

  async add(collection, data) {
    const store = readStore()
    const id = uid()
    store[collection] = store[collection] || {}
    store[collection][id] = serialize(data)
    writeStore(store)
    return id
  },

  async set(collection, id, data) {
    const store = readStore()
    store[collection] = store[collection] || {}
    store[collection][id] = { ...store[collection][id], ...serialize(data) }
    writeStore(store)
    return id
  },

  async update(collection, id, patch) {
    const store = readStore()
    if (!store[collection]?.[id]) throw new Error(`${collection}/${id} not found`)
    store[collection][id] = { ...store[collection][id], ...serialize(patch) }
    writeStore(store)
  },

  async remove(collection, id) {
    const store = readStore()
    if (store[collection]) delete store[collection][id]
    writeStore(store)
  },
}

export const demoAdapter = {
  mode: 'demo',
  auth,
  db,
  reset() {
    try {
      localStorage.removeItem(KEY)
      sessionStore().removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
    saveSession(null)
    emit()
  },
}
