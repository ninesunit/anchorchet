import { cx } from '../../lib/utils'

export function Card({ as: Tag = 'div', className, interactive = false, children, ...rest }) {
  return (
    <Tag
      className={cx(
        'rounded-2xl border border-border bg-surface shadow-card',
        interactive &&
          'text-left transition hover:border-border-strong active:scale-[0.995] motion-reduce:active:scale-100',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={cx('flex items-start justify-between gap-3 px-4 pt-4', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
          {icon}
          <span className="truncate">{title}</span>
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function SectionTitle({ children, action, className }) {
  return (
    <div className={cx('mb-3 flex items-end justify-between gap-3', className)}>
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-faint">{children}</h2>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub, tone = 'default', className }) {
  const tones = {
    default: 'text-text',
    ember: 'text-ember',
    mint: 'text-mint',
    amber: 'text-amber',
    violet: 'text-violet',
  }
  return (
    <div className={cx('rounded-2xl border border-border bg-surface p-3.5', className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-faint">{label}</div>
      <div
        className={cx(
          'mt-1 text-2xl font-extrabold leading-none tabular-nums tracking-tight',
          tones[tone]
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[12px] text-muted">{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, body, action, className }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center',
        className
      )}
    >
      {icon && <div className="mb-3 text-3xl opacity-60">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
