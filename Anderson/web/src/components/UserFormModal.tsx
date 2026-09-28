import { useState } from 'react'
import { FormField, Modal, ModalActions, formInputClass } from './Modal'
import type { User } from '../types'

export interface UserFormValues {
  fullName: string
  documentId: string
  company: string
  phone: string
  status: 'activo' | 'inactivo'
}

export function UserFormModal({
  title,
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string
  initial?: Partial<User>
  busy?: boolean
  onCancel: () => void
  onSubmit: (values: UserFormValues) => void
}) {
  const [values, setValues] = useState<UserFormValues>({
    fullName: initial?.fullName ?? '',
    documentId: initial?.documentId ?? '',
    company: initial?.company ?? '',
    phone: initial?.phone ?? '',
    status: initial?.status ?? 'activo',
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
        <FormField label="Nombre completo">
          <input
            required
            autoFocus
            value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Documento">
          <input
            required
            value={values.documentId}
            onChange={(e) => setValues((v) => ({ ...v, documentId: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Empresa">
          <input
            value={values.company}
            onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Teléfono">
          <input
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Estado">
          <select
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as 'activo' | 'inactivo' }))}
            className={formInputClass}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </FormField>
        <ModalActions onCancel={onCancel} busy={busy} />
      </form>
    </Modal>
  )
}
