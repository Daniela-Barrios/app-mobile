// Bloqueo de acceso administrado desde el monitoreo: general (todo el
// sistema) o por zonas puntuales. No toca el sistema externo de tokens;
// solo marca la biometría del usuario y deja traza en events.
import { newId } from '../lib/id'
import { biometricsRepository, eventsRepository } from '../repositories'

const SYSTEM_ACTOR = 'admin-1'

export async function blockBiometricGlobally(biometricId: string) {
  const updated = await biometricsRepository.update(biometricId, { blockedGlobally: true })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'biometric_blocked',
    severity: 'danger',
    occurredAt: new Date().toISOString(),
    actor: SYSTEM_ACTOR,
    entityType: 'biometric',
    entityId: biometricId,
    payload: {},
    source: 'simulated',
  })
  return updated
}

export async function unblockBiometricGlobally(biometricId: string) {
  const updated = await biometricsRepository.update(biometricId, { blockedGlobally: false })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'biometric_unblocked',
    severity: 'info',
    occurredAt: new Date().toISOString(),
    actor: SYSTEM_ACTOR,
    entityType: 'biometric',
    entityId: biometricId,
    payload: {},
    source: 'simulated',
  })
  return updated
}

export async function setBiometricZoneBlocks(biometricId: string, zoneIds: string[]) {
  const updated = await biometricsRepository.update(biometricId, { blockedZoneIds: zoneIds })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'biometric_zone_block_updated',
    severity: 'warning',
    occurredAt: new Date().toISOString(),
    actor: SYSTEM_ACTOR,
    entityType: 'biometric',
    entityId: biometricId,
    payload: { zoneIds },
    source: 'simulated',
  })
  return updated
}
