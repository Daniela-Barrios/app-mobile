// Reglas de negocio de los tokens (ver skill token-rules / docs/PLAN.md §6):
//   1. Único token `activo` por usuario, GLOBAL en todo el sistema (no por zona).
//   2. Sin TTL: solo se invalida por validación biométrica o revocación manual.
//   3. Cada transición registra tokenHistory + accessLog (si aplica) + events,
//      en una única función de servicio (json-server no tiene transacciones).
//   4. Nada se borra físicamente.
import { newId } from '../lib/id'
import {
  accessLogsRepository,
  eventsRepository,
  photosRepository,
  tokenHistoryRepository,
  tokensRepository,
} from '../repositories'
import type { AccessToken } from '../types'

const SYSTEM_ACTOR = 'admin-1'
const BIOMETRIC_SIMULATOR_ACTOR = 'device:biometric-simulator'

export class TokenRuleError extends Error {}

async function nextTokenCode(): Promise<string> {
  const all = await tokensRepository.list()
  return `TK-${String(all.length + 1).padStart(3, '0')}`
}

/** Regla 1: rechaza si el usuario ya tiene CUALQUIER token activo, sin importar la zona. */
export async function issueToken(userId: string, zoneId: string): Promise<AccessToken> {
  const active = await tokensRepository.listActiveByUser(userId)
  if (active.length > 0) {
    throw new TokenRuleError(
      `El usuario ya tiene un token activo (${active[0].code}) en otra zona. Debe validarse o revocarse antes de emitir uno nuevo.`,
    )
  }

  const now = new Date().toISOString()
  const token: AccessToken = {
    id: newId('token'),
    code: await nextTokenCode(),
    userId,
    zoneId,
    status: 'activo',
    issuedAt: now,
    validatedAt: null,
    invalidatedReason: null,
    deletedAt: null,
  }
  const created = await tokensRepository.create(token)

  await tokenHistoryRepository.create({
    id: newId('th'),
    tokenId: created.id,
    from: null,
    to: 'activo',
    at: now,
    actor: SYSTEM_ACTOR,
    reason: 'token_issued',
  })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'token_generated',
    severity: 'info',
    occurredAt: now,
    actor: SYSTEM_ACTOR,
    entityType: 'token',
    entityId: created.id,
    payload: { code: created.code, zoneId },
    source: 'simulated',
  })

  return created
}

type ValidationOutcome =
  | { granted: true; token: AccessToken }
  | { granted: false; reason: 'token_invalid' | 'wrong_zone' }

/**
 * Simula la validación biométrica de un token en una zona.
 * Regla 2: si es válido, el token pasa `activo -> inválido` y se crea el
 * accessLog autorizado en la misma operación. Si no, se registra el rechazo
 * sin tocar el token.
 */
export async function validateTokenAgainstBiometric(
  tokenId: string,
  zoneId: string,
): Promise<ValidationOutcome> {
  const token = await tokensRepository.get(tokenId)
  const now = new Date().toISOString()

  if (token.status !== 'activo') {
    await recordDenial(token, zoneId, 'token_invalid', now)
    return { granted: false, reason: 'token_invalid' }
  }
  if (token.zoneId !== zoneId) {
    await recordDenial(token, zoneId, 'wrong_zone', now)
    return { granted: false, reason: 'wrong_zone' }
  }

  const updated = await tokensRepository.update(token.id, {
    status: 'inválido',
    validatedAt: now,
    invalidatedReason: 'biometric_validation',
  })

  await tokenHistoryRepository.create({
    id: newId('th'),
    tokenId: token.id,
    from: 'activo',
    to: 'inválido',
    at: now,
    actor: BIOMETRIC_SIMULATOR_ACTOR,
    reason: 'biometric_validation',
  })

  const photos = await photosRepository.listByUser(token.userId)
  const currentPhoto = photos.find((p) => p.isCurrent) ?? photos[0] ?? null

  const accessLog = await accessLogsRepository.create({
    id: newId('access'),
    userId: token.userId,
    zoneId: token.zoneId,
    tokenId: token.id,
    photoId: currentPhoto?.id ?? null,
    result: 'autorizado',
    denyReason: null,
    occurredAt: now,
    source: 'simulated',
    cameraId: null,
    evidenceRef: null,
  })

  await eventsRepository.create({
    id: newId('evt'),
    type: 'access_granted',
    severity: 'info',
    occurredAt: now,
    actor: BIOMETRIC_SIMULATOR_ACTOR,
    entityType: 'accessLog',
    entityId: accessLog.id,
    payload: { userId: token.userId, zoneId: token.zoneId },
    source: 'simulated',
  })

  return { granted: true, token: updated }
}

async function recordDenial(
  token: AccessToken,
  zoneId: string,
  reason: 'token_invalid' | 'wrong_zone',
  now: string,
) {
  const accessLog = await accessLogsRepository.create({
    id: newId('access'),
    userId: token.userId,
    zoneId,
    tokenId: token.id,
    photoId: null,
    result: 'rechazado',
    denyReason: reason,
    occurredAt: now,
    source: 'simulated',
    cameraId: null,
    evidenceRef: null,
  })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'access_denied',
    severity: 'warning',
    occurredAt: now,
    actor: BIOMETRIC_SIMULATOR_ACTOR,
    entityType: 'accessLog',
    entityId: accessLog.id,
    payload: { userId: token.userId, zoneId, reason },
    source: 'simulated',
  })
}

/** Revocación manual por un administrador: libera al usuario para un token nuevo. */
export async function revokeToken(tokenId: string): Promise<AccessToken> {
  const token = await tokensRepository.get(tokenId)
  if (token.status !== 'activo') {
    throw new TokenRuleError('El token ya está inválido; no hay nada que revocar.')
  }

  const now = new Date().toISOString()
  const updated = await tokensRepository.update(token.id, {
    status: 'inválido',
    invalidatedReason: 'manual_revocation',
  })

  await tokenHistoryRepository.create({
    id: newId('th'),
    tokenId: token.id,
    from: 'activo',
    to: 'inválido',
    at: now,
    actor: SYSTEM_ACTOR,
    reason: 'manual_revocation',
  })
  await eventsRepository.create({
    id: newId('evt'),
    type: 'token_revoked',
    severity: 'warning',
    occurredAt: now,
    actor: SYSTEM_ACTOR,
    entityType: 'token',
    entityId: token.id,
    payload: {},
    source: 'simulated',
  })

  return updated
}
