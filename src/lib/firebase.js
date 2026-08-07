import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * True only when every required key is present. Until the .env file is filled
 * in, the app falls back to the offline demo adapter instead of white-screening
 * on a Firebase init error.
 */
export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId && config.authDomain
)

let app = null
let auth = null
let db = null

if (isFirebaseConfigured) {
  app = initializeApp(config)
  auth = getAuth(app)
  // Persistent cache keeps the app usable at the bowling alley when the wifi
  // drops; writes queue locally and flush when the connection returns.
  // The multi-tab manager keeps an iPad's split-view tabs consistent.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
}

export { app, auth, db, config }
