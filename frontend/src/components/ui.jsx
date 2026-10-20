import { CalendarDays, LoaderCircle } from 'lucide-react'
import { ESTADOS } from '../utils/reservas.js'

export function Button({
  children,
  icon: Icon,
  variant = 'primary',
  busy = false,
  disabled,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`button button-${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? (
        <LoaderCircle className="spin" size={18} aria-hidden="true" />
      ) : (
        Icon && <Icon size={18} aria-hidden="true" />
      )}
      {children}
    </button>
  )
}

export function IconButton({ label, icon: Icon, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}

export function Field({ label, id, error, hint, children, ...props }) {
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label htmlFor={id}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {children ? (
        <select id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props}>
          {children}
        </select>
      ) : (
        <input id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      )}
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}

export function StatusBadge({ estado }) {
  return (
    <span className={`status status-${estado?.toLowerCase()}`}>
      <span aria-hidden="true" />
      {ESTADOS[estado] || estado}
    </span>
  )
}

export function EmptyState({ title, description, children, icon: Icon = CalendarDays }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </div>
  )
}

export function LoadingState({ label = 'Cargando reservas...' }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={24} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="heading-actions">{children}</div>}
    </div>
  )
}
