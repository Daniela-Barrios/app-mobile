import { useState } from 'react'
import { FormField, Modal, ModalActions, formInputClass } from './Modal'
import type { Camera, CameraStatus, Zone } from '../types'

export interface CameraFormValues {
  name: string
  zoneId: string
  streamRef: string
  status: CameraStatus
}

const STATUS_OPTIONS: CameraStatus[] = ['desconectada', 'conectando', 'conectada', 'error']

export function CameraFormModal({
  title,
  initial,
  zones,
  defaultZoneId,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string
  initial?: Partial<Camera>
  zones: Zone[]
  defaultZoneId?: string
  busy?: boolean
  onCancel: () => void
  onSubmit: (values: CameraFormValues) => void
}) {
  const [values, setValues] = useState<CameraFormValues>({
    name: initial?.name ?? '',
    zoneId: initial?.zoneId ?? defaultZoneId ?? zones[0]?.id ?? '',
    streamRef: initial?.streamRef ?? '',
    status: initial?.status ?? 'desconectada',
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
        <FormField label="Nombre de la cámara">
          <input
            required
            autoFocus
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={formInputClass}
          />
        </FormField>
        <FormField label="Zona">
          <select
            value={values.zoneId}
            onChange={(e) => setValues((v) => ({ ...v, zoneId: e.target.value }))}
            className={formInputClass}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Referencia de stream (simulado)">
          <input
            value={values.streamRef}
            onChange={(e) => setValues((v) => ({ ...v, streamRef: e.target.value }))}
            placeholder="rtsp://simulado/..."
            className={formInputClass}
          />
        </FormField>
        <FormField label="Estado">
          <select
            value={values.status}
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as CameraStatus }))}
            className={formInputClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>
        <ModalActions onCancel={onCancel} busy={busy} />
      </form>
    </Modal>
  )
}
