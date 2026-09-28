import { Modal } from './Modal'

// Confirmación genérica para acciones administrativas (desactivar/reactivar).
// Toda baja en la maqueta es lógica (deletedAt), pero igual se confirma.
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-text-muted">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-surface-muted"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
            danger ? 'bg-danger-500 hover:bg-danger-500/90' : 'bg-brand-600 hover:bg-brand-700'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
