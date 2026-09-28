// Administración de zonas: crear, editar, desactivar (baja lógica) y
// reactivar. Cada acción deja traza en `events`.
import { newId } from '../lib/id'
import { eventsRepository, zonesRepository } from '../repositories'
import type { Zone } from '../types'

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
    entityType: 'zone',
    entityId,
    payload,
    source: 'simulated',
  })
}

export interface ZoneFormInput {
  code: string
  name: string
  isRestricted: boolean
}

export async function createZone(input: ZoneFormInput): Promise<Zone> {
  const zone: Zone = {
    id: newId('zone'),
    code: input.code,
    name: input.name,
    isRestricted: input.isRestricted,
    active: true,
    deletedAt: null,
  }
  const created = await zonesRepository.create(zone)
  await logEvent('zone_created', 'info', created.id)
  return created
}

export async function updateZone(id: string, input: ZoneFormInput): Promise<Zone> {
  const updated = await zonesRepository.update(id, {
    code: input.code,
    name: input.name,
    isRestricted: input.isRestricted,
  })
  await logEvent('zone_updated', 'info', id)
  return updated
}

export async function deactivateZone(id: string): Promise<Zone> {
  const updated = await zonesRepository.softDelete(id)
  await logEvent('zone_deactivated', 'warning', id)
  return updated
}

export async function reactivateZone(id: string): Promise<Zone> {
  const updated = await zonesRepository.reactivate(id)
  await logEvent('zone_reactivated', 'info', id)
  return updated
}
