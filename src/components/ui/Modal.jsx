import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { cx } from '../../lib/utils'
import { Button } from './Button'

/**
 * A bottom sheet on phones, a centred dialog from tablet up.
 *
 * The body scroll lock uses position:fixed rather than overflow:hidden because
 * iOS Safari happily scrolls the page behind an overflow-hidden body, which
 * makes a sheet feel broken on exactly the device this app targets first.
 */
export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }) {
  const scrollY = useRef(0)

  useEffect(() => {
    if (!open) return

    scrollY.current = window.scrollY
    const { body } = document
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }
    body.style.position = 'fixed'
    body.style.top = `-${scrollY.current}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflow = prev.overflow
      window.scrollTo(0, scrollY.current)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'md:max-w-md', md: 'md:max-w-xl', lg: 'md:max-w-3xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'animate-sheet-up relative flex max-h-[92dvh] w-full flex-col overflow-hidden',
          'rounded-t-3xl border border-border bg-bg-elevated shadow-pop',
          'md:animate-pop-in md:rounded-3xl',
          widths[size]
        )}
      >
        {/* Grab handle reads as "drag me" on touch; pointless with a mouse. */}
        <div className="flex justify-center pt-2.5 md:hidden">
          <div className="h-1.5 w-10 rounded-full bg-border-strong" />
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3 md:pt-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 shrink-0"
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </Button>
        </div>

        <div className="scroll-y flex-1 px-5 pb-2">{children}</div>

        {footer && (
          <div
            className={cx(
              'flex gap-2 border-t border-border bg-bg-elevated px-5 py-3',
              // Keeps the action row above the iPhone home indicator.
              'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

/** Destructive-action confirm, so we never call window.confirm(). */
export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = 'Delete' }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="soft" full onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            full
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="pb-2 text-[15px] leading-relaxed text-muted">{body}</p>
    </Modal>
  )
}
