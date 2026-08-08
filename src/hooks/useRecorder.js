import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Voice recording via MediaRecorder.
 *
 * Two things make this fiddlier than the API suggests. First, codec support
 * splits by platform: Safari on iOS and macOS produces `audio/mp4` and does not
 * know what webm is, everything else prefers `audio/webm;codecs=opus`. Passing
 * an unsupported mimeType throws, so the type is probed rather than assumed.
 *
 * Second, the microphone stream has to be stopped by hand. Leaving the tracks
 * live keeps the recording indicator lit in the status bar long after he has
 * finished, which looks like the app is listening when it is not.
 */

const CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
]

/** Low enough that a minute of speech fits in a Firestore document. */
const BITS_PER_SECOND = 24000

export const MAX_SECONDS = 90

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of CANDIDATES) {
    if (MediaRecorder.isTypeSupported?.(type)) return type
  }
  return '' // let the browser choose
}

export const recorderSupported = () =>
  typeof MediaRecorder !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia)

/**
 * @returns {{
 *   state:'idle'|'recording'|'done', seconds:number, blob:Blob|null,
 *   url:string|null, error:string|null, supported:boolean,
 *   start:()=>Promise<void>, stop:()=>void, reset:()=>void
 * }}
 */
export function useRecorder() {
  const [state, setState] = useState('idle')
  const [seconds, setSeconds] = useState(0)
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const urlRef = useRef(null)

  const teardown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Releasing the tracks is what turns off the browser's recording indicator.
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  // Anything still running when the modal closes has to be cleaned up, or the
  // mic stays open and the object URL leaks.
  useEffect(() => {
    return () => {
      try {
        if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      } catch {
        /* already stopped */
      }
      teardown()
      revoke()
    }
  }, [teardown, revoke])

  const stop = useCallback(() => {
    try {
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    } catch {
      teardown()
      setState('idle')
    }
  }, [teardown])

  const start = useCallback(async () => {
    setError(null)
    if (!recorderSupported()) {
      setError('This browser cannot record audio. Safari on iOS 14.3+ or any recent Chrome can.')
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'Microphone permission was declined. Allow it in the site settings and try again.'
          : 'Could not reach the microphone.'
      )
      return
    }

    revoke()
    setBlob(null)
    setUrl(null)
    setSeconds(0)
    chunksRef.current = []
    streamRef.current = stream

    const mimeType = pickMimeType()
    let rec
    try {
      rec = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: BITS_PER_SECOND,
      })
    } catch {
      // A rejected bitrate or mimeType on an older build — take the defaults.
      rec = new MediaRecorder(stream)
    }

    rec.ondataavailable = (e) => {
      if (e.data?.size) chunksRef.current.push(e.data)
    }
    rec.onstop = () => {
      const type = rec.mimeType || mimeType || 'audio/webm'
      const out = new Blob(chunksRef.current, { type })
      const objectUrl = URL.createObjectURL(out)
      urlRef.current = objectUrl
      setBlob(out)
      setUrl(objectUrl)
      setState('done')
      teardown()
    }

    recorderRef.current = rec
    rec.start()
    setState('recording')

    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setSeconds(elapsed)
      // Hard stop rather than letting him run past what will fit.
      if (elapsed >= MAX_SECONDS) stop()
    }, 250)
  }, [revoke, teardown, stop])

  const reset = useCallback(() => {
    revoke()
    setBlob(null)
    setUrl(null)
    setSeconds(0)
    setState('idle')
    setError(null)
  }, [revoke])

  return {
    state,
    seconds,
    blob,
    url,
    error,
    supported: recorderSupported(),
    start,
    stop,
    reset,
  }
}
