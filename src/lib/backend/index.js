import { isFirebaseConfigured } from '../firebase'
import { demoAdapter } from './demoAdapter'
import { firebaseAdapter } from './firebaseAdapter'

/**
 * One switch for the whole app. Screens import `backend` and never care which
 * implementation is behind it — filling in .env is the only step needed to go
 * from the offline demo to live Firestore sync.
 */
export const backend = isFirebaseConfigured ? firebaseAdapter : demoAdapter

export const IS_DEMO = backend.mode === 'demo'

export const COLLECTIONS = {
  users: 'users',
  quests: 'crochet_quests',
  stash: 'yarn_stash',
  sessions: 'bowling_sessions',
  calendar: 'tournament_calendar',
  hallOfFame: 'hall_of_fame',
  hype: 'hype_events',
  patternRefs: 'pattern_refs',
}
