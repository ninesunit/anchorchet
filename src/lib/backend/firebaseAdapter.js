import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import {
  collection as fsCollection,
  deleteDoc,
  doc,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore'

import { auth as fbAuth, db as fbDb } from '../firebase'

/** Firestore Timestamps -> JS Dates, so screens never branch on backend type. */
function normalize(data) {
  const out = { ...data }
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Timestamp) out[k] = v.toDate()
  }
  return out
}

const auth = {
  onChange(cb) {
    return onAuthStateChanged(fbAuth, (user) =>
      cb(user ? { uid: user.uid, email: user.email } : null)
    )
  },

  async signIn(email, password) {
    const cred = await signInWithEmailAndPassword(fbAuth, email, password)
    return { uid: cred.user.uid, email: cred.user.email }
  },

  async signUp(email, password, profile) {
    const cred = await createUserWithEmailAndPassword(fbAuth, email, password)
    // The profile doc id is the auth uid, which is what the security rules key off.
    await setDoc(doc(fbDb, 'users', cred.user.uid), {
      email,
      ...profile,
      created_at: new Date(),
    })
    return { uid: cred.user.uid, email: cred.user.email }
  },

  async signOut() {
    await fbSignOut(fbAuth)
  },

  get current() {
    const u = fbAuth.currentUser
    return u ? { uid: u.uid, email: u.email } : null
  },
}

const db = {
  subscribe(collection, cb, onError) {
    return onSnapshot(
      fsCollection(fbDb, collection),
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...normalize(d.data()) }))),
      (err) => {
        console.error(`[anchorchet] subscribe(${collection}) failed:`, err)
        onError?.(err)
      }
    )
  },

  subscribeDoc(collection, id, cb, onError) {
    return onSnapshot(
      doc(fbDb, collection, id),
      (snap) => cb(snap.exists() ? { id: snap.id, ...normalize(snap.data()) } : null),
      (err) => {
        console.error(`[anchorchet] subscribeDoc(${collection}/${id}) failed:`, err)
        onError?.(err)
      }
    )
  },

  async add(collection, data) {
    const ref = await addDoc(fsCollection(fbDb, collection), data)
    return ref.id
  },

  async set(collection, id, data) {
    await setDoc(doc(fbDb, collection, id), data, { merge: true })
    return id
  },

  async update(collection, id, patch) {
    await updateDoc(doc(fbDb, collection, id), patch)
  },

  async remove(collection, id) {
    await deleteDoc(doc(fbDb, collection, id))
  },
}

export const firebaseAdapter = { mode: 'firebase', auth, db }
