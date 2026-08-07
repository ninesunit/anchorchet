import { useRef, useState } from 'react'

import { compressImage } from '../../lib/image'
import { cx } from '../../lib/utils'
import { Button, Spinner } from './Button'

/**
 * Photo input that downscales in the browser before handing back a data URL.
 *
 * On iPhone/iPad the file input surfaces "Take Photo", "Photo Library" and
 * "Choose File" natively, so no separate camera button is needed. We
 * deliberately omit the `capture` attribute — forcing the camera would remove
 * the library option, and most Hall of Fame photos already exist in the roll.
 */
export function ImagePicker({ value, onChange, label = 'Add photo', hint, className }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    // Reset immediately so picking the same file twice still fires a change.
    e.target.value = ''
    if (!file) return

    setError('')
    setBusy(true)
    try {
      onChange(await compressImage(file))
    } catch (err) {
      setError(err.message || 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <img src={value} alt="" className="max-h-56 w-full bg-surface-2 object-contain" />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button size="sm" variant="soft" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button size="sm" variant="soft" onClick={() => onChange('')}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cx(
            'no-select flex min-h-24 w-full flex-col items-center justify-center gap-1.5',
            'rounded-xl border border-dashed border-border bg-surface-2/50 px-4 py-5',
            'text-muted transition hover:border-border-strong hover:text-text',
            'disabled:opacity-60'
          )}
        >
          {busy ? (
            <Spinner className="size-5" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
              <path
                d="M4 16.5V7a2 2 0 0 1 2-2h2.2l1.1-1.6a1 1 0 0 1 .8-.4h3.8a1 1 0 0 1 .8.4L15.8 5H18a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="11.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
          <span className="text-[13px] font-semibold">{busy ? 'Processing…' : label}</span>
          {hint && !busy && <span className="text-[12px] text-faint">{hint}</span>}
        </button>
      )}

      {error && <p className="mt-1.5 text-[13px] font-medium text-ember">{error}</p>}
    </div>
  )
}
