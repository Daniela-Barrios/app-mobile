import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

// Modal genérico (overlay + panel), sin librerías de terceros. Usado por
// todos los formularios de creación/edición y por ConfirmDialog.
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-text-muted hover:text-ink-900"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const formInputClass =
  'mt-1 w-full rounded-lg border border-border px-3 py-1.5 text-sm text-ink-900 placeholder:text-text-muted focus:border-brand-600 focus:outline-none'

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-text-muted">
      {label}
      {children}
    </label>
  )
}

export function ModalActions({
  onCancel,
  submitLabel = 'Guardar',
  busy,
}: {
  onCancel: () => void
  submitLabel?: string
  busy?: boolean
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-muted"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  )
}
