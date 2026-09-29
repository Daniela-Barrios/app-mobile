// Registra una entrada aprobada a una zona desde el kiosco: emite el token
// (con el código que ya generó el front, ver components/Bienvenida.tsx), lo
// valida en el mismo instante (equivalente al biométrico simulado del
// dashboard) y crea el accessLog + evento correspondientes. Sigue el mismo
// ciclo de vida de token que documenta Anderson/web/src/services/tokenService.ts
// y que ya usa mock-api/seed.js (emitido -> validado -> inválido, sin TTL).
import { newId } from '../client';
import { accessLogsRepository, eventsRepository, photosRepository, tokenHistoryRepository, tokensRepository } from '../repositories';
import { ACTOR } from './registrationService';

export interface EntradaAprobada {
  zoneId: string;
  zoneName: string;
  occurredAt: string;
}

export async function registrarEntrada(params: {
  userId: string;
  code: string;
  zoneId: string;
  zoneName: string;
}): Promise<EntradaAprobada> {
  const { userId, code, zoneId, zoneName } = params;
  const now = new Date().toISOString();

  const token = await tokensRepository.create({
    id: newId('token'),
    code,
    userId,
    zoneId,
    status: 'activo',
    issuedAt: now,
    validatedAt: null,
    invalidatedReason: null,
    deletedAt: null,
  });
  await tokenHistoryRepository.create({
    id: newId('th'),
    tokenId: token.id,
    from: null,
    to: 'activo',
    at: now,
    actor: ACTOR,
    reason: 'token_issued',
  });

  const validatedAt = new Date().toISOString();
  await tokensRepository.update(token.id, {
    status: 'inválido',
    validatedAt,
    invalidatedReason: 'biometric_validation',
  });
  await tokenHistoryRepository.create({
    id: newId('th'),
    tokenId: token.id,
    from: 'activo',
    to: 'inválido',
    at: validatedAt,
    actor: ACTOR,
    reason: 'biometric_validation',
  });

  const fotos = await photosRepository.listByUser(userId);
  const photoId = fotos[0]?.id ?? null;

  const accessLog = await accessLogsRepository.create({
    id: newId('access'),
    userId,
    zoneId,
    tokenId: token.id,
    photoId,
    result: 'autorizado',
    denyReason: null,
    occurredAt: validatedAt,
    source: 'device',
    cameraId: null,
    evidenceRef: null,
  });

  await eventsRepository.create({
    id: newId('evt'),
    type: 'access_granted',
    severity: 'info',
    occurredAt: validatedAt,
    actor: ACTOR,
    entityType: 'accessLog',
    entityId: accessLog.id,
    payload: { userId, zoneId },
    source: 'device',
  });

  return { zoneId, zoneName, occurredAt: validatedAt };
}
