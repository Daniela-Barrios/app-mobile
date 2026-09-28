import { useState } from 'react'
import { FormField, Modal, ModalActions, formInputClass } from './Modal'
import type { Zone } from '../types'

export interface ZoneFormValues {
  code: string
  name: string
  isRestricted: boolean
}

export function ZoneFormModal({
  title,
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string
  initial?: Partial<Zone>
  busy?: boolean
  onCancel: () => void
  onSubmit: (values: ZoneFormValues) => void
}) {
  const [values, setValues] = useState<ZoneFormValues>({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    isRestricted: initial?.isRestricted ?? false,
  })

  return (
    <Modal title={title} onClose={onCancel}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(values)
        }}
      >
        <FormField label="Nombre de la zona">
          <input
            required
            autoFocus
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Código">
          <input
            required
            value={values.code}
            onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <label className="flex items-center gap-2 text-xs text-ink-700">
          <input
            type="checkbox"
            checked={values.isRestricted}
            onChange={(e) => setValues((v) => ({ ...v, isRestricted: e.target.checked }))}
          />
          Zona restringida
        </label>
        <ModalActions onCancel={onCancel} busy={busy} />
      </form>
    </Modal>
  )
}
