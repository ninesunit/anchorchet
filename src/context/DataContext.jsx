import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { backend, COLLECTIONS } from '../lib/backend'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

const byDateDesc = (a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0)
const byDateAsc = (a, b) => (a.date?.getTime?.() || 0) - (b.date?.getTime?.() || 0)

/**
 * Holds every live collection in one place.
 *
 * Both players read the same documents — the app is two views over one shared
 * dataset, not two datasets — so subscribing once here keeps a single set of
 * Firestore listeners open regardless of how many screens are mounted.
 */
export function DataProvider({ children }) {
  const { user } = useAuth()

  const [quests, setQuests] = useState([])
  const [stash, setStash] = useState([])
  const [sessions, setSessions] = useState([])
  const [events, setEvents] = useState([])
  const [hallOfFame, setHallOfFame] = useState([])
  const [hype, setHype] = useState([])
  // Keyed by pattern id, not an array — every lookup is "the photo for THIS pattern".
  const [patternRefs, setPatternRefs] = useState({})
  const [arsenal, setArsenal] = useState([])
  const [matches, setMatches] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [projects, setProjects] = useState([])
  const [tutorials, setTutorials] = useState([])
  const [glossary, setGlossary] = useState([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) {
      setQuests([])
      setStash([])
      setSessions([])
      setEvents([])
      setHallOfFame([])
      setHype([])
      setPatternRefs({})
      setArsenal([])
      setMatches([])
      setWishlist([])
      setProjects([])
      setTutorials([])
      setGlossary([])
      setReady(false)
      return
    }

    const unsubs = [
      backend.db.subscribe(COLLECTIONS.quests, (rows) =>
        setQuests(
          rows.sort(
            (a, b) => (b.date_requested?.getTime?.() || 0) - (a.date_requested?.getTime?.() || 0)
          )
        )
      ),
      backend.db.subscribe(COLLECTIONS.stash, (rows) =>
        setStash(rows.sort((a, b) => (a.color || '').localeCompare(b.color || '')))
      ),
      backend.db.subscribe(COLLECTIONS.sessions, (rows) => setSessions(rows.sort(byDateDesc))),
      backend.db.subscribe(COLLECTIONS.calendar, (rows) => setEvents(rows.sort(byDateAsc))),
      backend.db.subscribe(COLLECTIONS.hallOfFame, (rows) =>
        setHallOfFame(
          rows.sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.hype, (rows) =>
        setHype(
          rows.sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.patternRefs, (rows) =>
        setPatternRefs(Object.fromEntries(rows.map((r) => [r.id, r])))
      ),
      backend.db.subscribe(COLLECTIONS.arsenal, (rows) =>
        setArsenal(rows.sort((a, b) => (a.name || '').localeCompare(b.name || '')))
      ),
      backend.db.subscribe(COLLECTIONS.matches, (rows) =>
        setMatches(
          rows.sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.wishlist, (rows) =>
        setWishlist(
          rows.sort((a, b) => (b.added_date?.getTime?.() || 0) - (a.added_date?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.projects, (rows) =>
        setProjects(
          rows.sort((a, b) => (b.created_at?.getTime?.() || 0) - (a.created_at?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.tutorials, (rows) =>
        setTutorials(
          rows.sort((a, b) => (b.date_added?.getTime?.() || 0) - (a.date_added?.getTime?.() || 0))
        )
      ),
      backend.db.subscribe(COLLECTIONS.glossary, (rows) => setGlossary(rows)),
    ]

    setReady(true)
    return () => unsubs.forEach((fn) => fn?.())
  }, [user])

  const value = useMemo(() => {
    const c = COLLECTIONS
    return {
      ready,
      quests,
      stash,
      sessions,
      events,
      hallOfFame,
      hype,
      patternRefs,
      arsenal,
      matches,
      wishlist,
      projects,
      tutorials,
      glossary,

      /* ---------------------------------------------------------- quests -- */
      addQuest: (data) =>
        backend.db.add(c.quests, {
          status: 'pending',
          priority: 'normal',
          reference_image_url: '',
          completion_photo_url: '',
          date_requested: new Date(),
          ...data,
        }),
      updateQuest: (id, patch) => backend.db.update(c.quests, id, patch),
      removeQuest: (id) => backend.db.remove(c.quests, id),

      /* ----------------------------------------------------------- stash -- */
      addYarn: (data) =>
        backend.db.add(c.stash, {
          quantity: 1,
          status: 'in_stock',
          brand: '',
          note: '',
          ...data,
        }),
      updateYarn: (id, patch) => backend.db.update(c.stash, id, patch),
      removeYarn: (id) => backend.db.remove(c.stash, id),

      /* -------------------------------------------------------- bowling -- */
      addSession: (data) => backend.db.add(c.sessions, data),
      updateSession: (id, patch) => backend.db.update(c.sessions, id, patch),
      removeSession: (id) => backend.db.remove(c.sessions, id),

      /* ------------------------------------------------------- calendar -- */
      addEvent: (data) => backend.db.add(c.calendar, data),
      updateEvent: (id, patch) => backend.db.update(c.calendar, id, patch),
      removeEvent: (id) => backend.db.remove(c.calendar, id),

      /* ---------------------------------------------------- hall of fame -- */
      addTrophy: (data) => backend.db.add(c.hallOfFame, { created_at: new Date(), ...data }),
      removeTrophy: (id) => backend.db.remove(c.hallOfFame, id),

      /* --------------------------------------------------- arsenal ---- */
      addBall: (data) =>
        backend.db.add(c.arsenal, {
          role: 'strike_ball',
          created_at: new Date(),
          ...data,
        }),
      updateBall: (id, patch) => backend.db.update(c.arsenal, id, patch),
      removeBall: (id) => backend.db.remove(c.arsenal, id),

      /* -------------------------------------------------- wishlist ---- */
      addWish: (data) =>
        backend.db.add(c.wishlist, { status: 'pending', added_date: new Date(), ...data }),
      updateWish: (id, patch) => backend.db.update(c.wishlist, id, patch),
      removeWish: (id) => backend.db.remove(c.wishlist, id),

      /* -------------------------------------------------- projects ---- */
      addProject: (data) =>
        backend.db.add(c.projects, {
          status: 'in_progress',
          reference_images: [],
          progress_photos: [],
          yarns_used: [],
          created_at: new Date(),
          ...data,
        }),
      updateProject: (id, patch) => backend.db.update(c.projects, id, patch),
      removeProject: (id) => backend.db.remove(c.projects, id),

      /* ------------------------------------------------- crafter's manual -- */
      addTutorial: (data) =>
        backend.db.add(c.tutorials, {
          category: 'basics',
          media_type: 'video',
          date_added: new Date(),
          ...data,
        }),
      updateTutorial: (id, patch) => backend.db.update(c.tutorials, id, patch),
      removeTutorial: (id) => backend.db.remove(c.tutorials, id),

      // Doc id IS the term id (`sc`, `invdec`, …) so an override replaces the
      // built-in entry instead of appearing next to it.
      setGlossaryTerm: (termId, data) =>
        backend.db.set(c.glossary, termId, { ...data, updated_at: new Date() }),
      removeGlossaryTerm: (termId) => backend.db.remove(c.glossary, termId),

      /* --------------------------------------------------- matches ---- */
      addMatch: (data) => backend.db.add(c.matches, { created_at: new Date(), ...data }),
      updateMatch: (id, patch) => backend.db.update(c.matches, id, patch),
      removeMatch: (id) => backend.db.remove(c.matches, id),

      /* -------------------------------------------- pattern reference -- */
      // Doc id IS the pattern id, so saving twice replaces rather than piles up.
      setPatternRef: (patternId, data) =>
        backend.db.set(c.patternRefs, patternId, { ...data, updated_at: new Date() }),
      removePatternRef: (patternId) => backend.db.remove(c.patternRefs, patternId),

      /* ------------------------------------------------------------ hype -- */
      sendHype: (data) =>
        backend.db.add(c.hype, { created_at: new Date(), seen: false, ...data }),
      markHypeSeen: (id) => backend.db.update(c.hype, id, { seen: true }),
    }
  }, [ready, quests, stash, sessions, events, hallOfFame, hype, patternRefs, arsenal, matches, wishlist, projects, tutorials, glossary])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}
