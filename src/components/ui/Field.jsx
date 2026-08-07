import { cx } from '../../lib/utils'

const BASE =
  'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-text placeholder:text-faint ' +
  'transition outline-none focus:border-mint focus:ring-2 focus:ring-mint/25 ' +
  'disabled:opacity-60 min-h-11'

export function Label({ children, hint, htmlFor, className }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx('mb-1.5 flex items-baseline justify-between gap-2', className)}
    >
      <span className="text-[13px] font-semibold text-text">{children}</span>
      {hint && <span className="text-[12px] font-normal text-faint">{hint}</span>}
    </label>
  )
}

export function Field({ label, hint, error, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="mt-1.5 text-[13px] font-medium text-ember">{error}</p>}
    </div>
  )
}

export function Input({ className, invalid, ...rest }) {
  return <input className={cx(BASE, invalid && 'border-ember', className)} {...rest} />
}

export function Textarea({ className, rows = 3, ...rest }) {
  return <textarea rows={rows} className={cx(BASE, 'resize-y leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }) {
  return (
    <div className="relative">
      <select
        className={cx(
          BASE,
          // Safari on iOS renders its own chevron on top of ours unless the
          // native appearance is stripped first.
          'appearance-none bg-none pr-10',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m6 8 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/** iOS-style segmented control; also the tab switcher on desktop. */
export function Segmented({ value, onChange, options, className, size = 'md' }) {
  return (
    <div
      role="tablist"
      className={cx(
        'no-select inline-flex w-full rounded-xl border border-border bg-surface-2 p-1',
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'flex-1 rounded-lg font-semibold transition',
              size === 'sm' ? 'min-h-8 px-2 text-[13px]' : 'min-h-9 px-3 text-sm',
              active
                ? 'bg-surface text-text shadow-card'
                : 'text-muted hover:text-text'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Horizontally scrolling filter chips — the phone-friendly filter pattern. */
export function ChipRow({ children, className }) {
  return (
    <div className={cx('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1', className)}>
      {children}
    </div>
  )
}

export function Chip({ active, onClick, children, dot, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'no-select inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition',
        active
          ? 'border-transparent bg-text text-bg'
          : 'border-border bg-surface text-muted hover:text-text',
        className
      )}
    >
      {dot && (
        <span
          className="size-2.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ background: dot }}
        />
      )}
      {children}
    </button>
  )
}
