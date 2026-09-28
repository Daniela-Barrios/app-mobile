// Administración de cámaras: crear, editar, desactivar (baja lógica) y
// reactivar. Cada acción deja traza en `events`.
import { newId } from '../lib/id'
import { camerasRepository, eventsRepository } from '../repositories'
import type { Camera, CameraStatus } from '../types'

const SYSTEM_ACTOR = 'admin-1'

function logEvent(
  type: string,
  severity: 'info' | 'warning' | 'danger',
  entityId: string,
  payload: Record<string, unknown> = {},
) {
  return eventsRepository.create({
    id: newId('evt'),
    type,
    severity,
    occurredAt: new Date().toISOString(),
    actor: SYSTEM_ACTOR,
    entityType: 'camera',
    entityId,
    payload,
    source: 'simulated',
  })
}

export interface CameraFormInput {
  name: string
  zoneId: string
  streamRef: string
  status: CameraStatus
}

export async function createCamera(input: CameraFormInput): Promise<Camera> {
  const camera: Camera = {
    id: newId('cam'),
    zoneId: input.zoneId,
    name: input.name,
    streamRef: input.streamRef,
    status: input.status,
    lastSeenAt: input.status === 'conectada' ? new Date().toISOString() : null,
    deletedAt: null,
  }
  const created = await camerasRepository.create(camera)
  await logEvent('camera_created', 'info', created.id, { zoneId: input.zoneId })
  return created
}

export async function updateCamera(id: string, input: CameraFormInput): Promise<Camera> {
  const updated = await camerasRepository.update(id, {
    name: input.name,
    zoneId: input.zoneId,
    streamRef: input.streamRef,
    status: input.status,
  })
  await logEvent('camera_updated', 'info', id, { zoneId: input.zoneId })
  return updated
}

export async function deactivateCamera(id: string): Promise<Camera> {
  const updated = await camerasRepository.softDelete(id)
  await logEvent('camera_deactivated', 'warning', id)
  return updated
}

export async function reactivateCamera(id: string): Promise<Camera> {
  const updated = await camerasRepository.reactivate(id)
  await logEvent('camera_reactivated', 'info', id)
  return updated
}
