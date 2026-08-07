import { createPortal } from 'react-dom'

import { cx, buzz } from '../../lib/utils'

const VARIANTS = {
  primary:
    'bg-ember text-white border-transparent shadow-sm hover:brightness-110 active:brightness-95',
  mint: 'bg-mint text-[#05231f] border-transparent shadow-sm hover:brightness-110 active:brightness-95',
  solid: 'bg-text text-bg border-transparent hover:opacity-90',
  soft: 'bg-surface-2 text-text border-border hover:border-border-strong',
  outline: 'bg-transparent text-text border-border hover:bg-surface-2',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-text',
  danger: 'bg-transparent text-ember border-border hover:bg-ember-soft hover:border-ember',
}

const SIZES = {
  // min-h-11 = 44px, Apple's minimum comfortable touch target.
  sm: 'min-h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'min-h-11 px-4 text-[15px] gap-2 rounded-xl',
  lg: 'min-h-13 px-5 text-base gap-2 rounded-2xl',
  icon: 'min-h-11 w-11 justify-center rounded-xl',
}

export function Button({
  as: Tag = 'button',
  variant = 'soft',
  size = 'md',
  full = false,
  loading = false,
  haptic = true,
  className,
  children,
  onClick,
  disabled,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        'no-select inline-flex items-center border font-semibold transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Subtle press feedback that reads as native on touch
        'active:scale-[0.98] motion-reduce:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full justify-center',
        className
      )}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      onClick={(e) => {
        if (haptic) buzz(8)
        onClick?.(e)
      }}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </Tag>
  )
}

export function Spinner({ className }) {
  return (
    <svg
      className={cx('size-4 shrink-0 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Big circular action button, docked above the tab bar on phones.
 *
 * Portalled to <body> rather than rendered in place: the screens wrap their
 * content in `.animate-fade-up`, and an element with a finished transform
 * animation still computes to an identity matrix rather than `none`. That is
 * enough to make it a containing block, which would anchor this `fixed` button
 * to the scrolling content instead of the viewport.
 */
export function FloatingButton({ className, children, ...rest }) {
  return createPortal(
    <Button
      variant="primary"
      className={cx(
        'fixed right-4 z-30 size-14 justify-center rounded-full p-0 shadow-pop',
        // Clears the tab bar plus the iPhone home indicator.
        'bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]',
        'md:bottom-6',
        className
      )}
      {...rest}
    >
      {children}
    </Button>,
    document.body
  )
}
