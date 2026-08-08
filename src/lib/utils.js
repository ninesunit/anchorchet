export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  // Firestore Timestamp — either the live SDK object with .toDate(), or the
  // plain {seconds, nanoseconds} shape you get back from a serialised snapshot.
  if (typeof value?.toDate === 'function') return value.toDate()
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000)
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatDate(value, opts = { day: 'numeric', month: 'short' }) {
  const d = toDate(value)
  return d ? d.toLocaleDateString(undefined, opts) : '—'
}

export function formatDateLong(value) {
  return formatDate(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(value) {
  const d = toDate(value)
  return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'
}

/** "3d ago" / "just now" — short enough for a card corner. */
export function timeAgo(value) {
  const d = toDate(value)
  if (!d) return ''
  const secs = Math.round((Date.now() - d.getTime()) / 1000)
  if (secs < 45) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.round(months / 12)}y ago`
}

/** Whole days from today to a date, ignoring clock time. */
export function daysUntil(value) {
  const d = toDate(value)
  if (!d) return null
  const a = new Date()
  a.setHours(0, 0, 0, 0)
  const b = new Date(d)
  b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}

export const round1 = (n) => Math.round(n * 10) / 10

export function seriesTotal(scores) {
  return scores.reduce((sum, n) => sum + (Number(n) || 0), 0)
}

export function sessionAverage(scores) {
  const valid = scores.filter((n) => n !== '' && n !== null && !Number.isNaN(Number(n)))
  if (valid.length === 0) return 0
  return round1(seriesTotal(valid) / valid.length)
}

/** Highest single game across every session. */
export function personalBest(sessions) {
  let best = 0
  for (const s of sessions) for (const g of s.game_scores || []) best = Math.max(best, Number(g) || 0)
  return best
}

/** Average of every game bowled, not an average of session averages. */
export function overallAverage(sessions) {
  const all = sessions.flatMap((s) => s.game_scores || []).map(Number).filter((n) => !Number.isNaN(n))
  if (all.length === 0) return 0
  return round1(all.reduce((a, b) => a + b, 0) / all.length)
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

/** Haptic tap on iPhone/iPad where supported; silently ignored elsewhere. */
export function buzz(pattern = 8) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}

/**
 * Yarn quantities are decimal now ("0.5 skeins used"), but "2" should not
 * render as "2.0". Rounds to 2dp to keep float drift out of the UI.
 */
export function fmtQty(n) {
  const v = Math.round((Number(n) || 0) * 100) / 100
  return Number.isInteger(v) ? String(v) : String(v)
}
