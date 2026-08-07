/**
 * Photos are downscaled in the browser and stored as data URLs on the document
 * itself. That keeps the whole app on Firestore's free tier with no Storage
 * bucket, no CORS config, and no signed-URL handling — at the cost of a hard
 * ceiling, since a Firestore document cannot exceed 1 MB.
 *
 * MAX_EDGE / QUALITY are tuned to land a photo around 120–200 KB, which leaves
 * comfortable headroom under that limit.
 */

const MAX_EDGE = 1200
const QUALITY = 0.72
/** Refuse anything that would risk the 1 MB document cap. */
const MAX_BYTES = 700 * 1024

export async function compressImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  if (!file.type.startsWith('image/')) {
    throw new Error('That file is not an image.')
  }

  const bitmap = await loadBitmap(file)

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  let dataUrl = canvas.toDataURL('image/jpeg', quality)

  // Step the quality down rather than failing outright on a very detailed photo.
  let q = quality
  while (dataUrl.length * 0.75 > MAX_BYTES && q > 0.35) {
    q -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', q)
  }

  if (dataUrl.length * 0.75 > MAX_BYTES) {
    throw new Error('That photo is too detailed to store. Try a smaller crop.')
  }

  return dataUrl
}

/**
 * createImageBitmap handles EXIF orientation on modern Safari; the <img>
 * fallback covers older iPadOS builds where it is missing.
 */
async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* fall through */
    }
  }
  return await new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}
