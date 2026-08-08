/**
 * Where uploaded media goes.
 *
 * The rest of the app stores photos as data URLs on the document itself, which
 * has kept everything on Firestore's free tier with no bucket, no CORS config
 * and no signed URLs. Voice notes strain that: a Firestore document caps at
 * 1 MB, and audio is bigger than a downscaled JPEG.
 *
 * So this tries Firebase Storage first and falls back to inline. Storage is not
 * assumed to exist — a project created after October 2024 needs a Blaze billing
 * plan before a bucket can be provisioned, and this app has never had one. If
 * the upload fails for a reason that will keep failing (no bucket, not
 * authorised, billing off) it is remembered for the session and every later
 * upload goes straight to inline without paying the timeout again.
 *
 * The upshot: it works right now with nothing to set up, and the moment a
 * bucket exists it starts using it, with no code change and no migration —
 * old inline URLs keep working because a data URL is a perfectly good `src`.
 */

import { app, isFirebaseConfigured } from './firebase'

/**
 * Inline ceiling. A Firestore document cannot exceed 1 MB, and base64 inflates
 * bytes by a third, so this leaves room for the rest of the document.
 */
export const MAX_INLINE_BYTES = 700 * 1024

/** null = not yet tried, true/false = settled for this session. */
let storageUsable = null
let storageModule = null

async function getStorage() {
  if (!isFirebaseConfigured || !app) return null
  if (storageUsable === false) return null
  if (storageModule) return storageModule

  try {
    const mod = await import('firebase/storage')
    storageModule = { mod, storage: mod.getStorage(app) }
    return storageModule
  } catch {
    storageUsable = false
    return null
  }
}

/**
 * These mean "there is no usable bucket" rather than "this one upload failed",
 * so there is no point retrying on the next recording.
 */
const FATAL = new Set([
  'storage/unauthorized',
  'storage/unauthenticated',
  'storage/project-not-found',
  'storage/bucket-not-found',
  'storage/unknown',
])

/**
 * @param {Blob} blob
 * @param {{folder: string, contentType?: string}} opts
 * @returns {Promise<{url: string, kind: 'bucket'|'inline', bytes: number}>}
 */
export async function uploadMedia(blob, { folder, contentType } = {}) {
  const bytes = blob.size
  const type = contentType || blob.type || 'application/octet-stream'

  const s = await getStorage()
  if (s) {
    try {
      const name = `${folder || 'media'}/${Date.now()}-${randomId()}.${extFor(type)}`
      const ref = s.mod.ref(s.storage, name)
      // Raced against a timeout: an upload to a bucket that was never
      // provisioned can sit there retrying rather than failing, and a spinner
      // that never resolves is worse than falling back to inline.
      await withTimeout(s.mod.uploadBytes(ref, blob, { contentType: type }))
      const url = await withTimeout(s.mod.getDownloadURL(ref))
      storageUsable = true
      return { url, kind: 'bucket', bytes }
    } catch (err) {
      if (err?.name === 'TimeoutError' || FATAL.has(err?.code)) storageUsable = false
      // Fall through to inline — a failed upload should not lose his recording.
    }
  }

  if (bytes > MAX_INLINE_BYTES) {
    throw new Error(
      `That is ${Math.round(bytes / 1024)} KB and there is no storage bucket set up, so it has to fit in the database. Record a shorter one.`
    )
  }
  return { url: await blobToDataUrl(blob), kind: 'inline', bytes }
}

const UPLOAD_TIMEOUT_MS = 12000

function withTimeout(promise, ms = UPLOAD_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        const err = new Error('Storage timed out')
        err.name = 'TimeoutError'
        reject(err)
      }, ms)
    ),
  ])
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read that recording.'))
    reader.readAsDataURL(blob)
  })
}

function extFor(type) {
  if (type.includes('mp4')) return 'm4a'
  if (type.includes('mpeg')) return 'mp3'
  if (type.includes('ogg')) return 'ogg'
  if (type.includes('webm')) return 'webm'
  if (type.includes('jpeg')) return 'jpg'
  if (type.includes('png')) return 'png'
  return 'bin'
}

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}
