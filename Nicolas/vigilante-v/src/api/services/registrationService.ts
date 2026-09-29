// Registro real de un visitante desde el kiosco: vincula su cédula con un
// usuario real del dashboard (crea o actualiza), guarda su foto y su
// biometría simulada. Cada acción queda auditada en `events` con el actor
// `device:kiosk-app-movil`, para que el dashboard la clasifique como "App
// móvil" (ver Anderson/web/src/lib/activity.ts#eventOrigin).
import { newId } from '../client';
import { biometricsRepository, eventsRepository, photosRepository, usersRepository } from '../repositories';
import type { User } from '../types';

export const ACTOR = 'device:kiosk-app-movil';

export interface DatosVisitante {
  tipoDocumento: string;
  documento: string;
  nombre: string;
  empresa: string;
  telefono: string;
  foto: string; // dataURL capturada por la cámara del navegador
}

function logEvent(
  type: string,
  severity: 'info' | 'warning' | 'danger',
  entityType: string,
  entityId: string,
  payload: Record<string, unknown> = {},
) {
  return eventsRepository.create({
    id: newId('evt'),
    type,
    severity,
    occurredAt: new Date().toISOString(),
    actor: ACTOR,
    entityType,
    entityId,
    payload,
    source: 'device',
  });
}

/** Busca el usuario real por documento; si no existe, lo crea. Si ya existe
 * pero llegaron datos nuevos (empresa/teléfono/nombre), los actualiza. */
async function encontrarOCrearUsuario(datos: DatosVisitante): Promise<{ user: User; esNuevo: boolean }> {
  const existentes = await usersRepository.findByDocumentId(datos.documento);
  const existente = existentes[0];

  if (!existente) {
    const user = await usersRepository.create({
      id: newId('user'),
      documentId: datos.documento,
      fullName: datos.nombre,
      status: 'activo',
      company: datos.empresa || null,
      phone: datos.telefono || null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    });
    return { user, esNuevo: true };
  }

  const cambios: Partial<User> = {};
  if (datos.nombre && datos.nombre !== existente.fullName) cambios.fullName = datos.nombre;
  if (datos.empresa && datos.empresa !== existente.company) cambios.company = datos.empresa;
  if (datos.telefono && datos.telefono !== existente.phone) cambios.phone = datos.telefono;

  if (Object.keys(cambios).length === 0) return { user: existente, esNuevo: false };
  const user = await usersRepository.update(existente.id, cambios);
  return { user, esNuevo: false };
}

/** Registra (o actualiza) al visitante: usuario + foto + biometría, con
 * trazabilidad. Devuelve el usuario real para que el kiosco pueda usar su id
 * al registrar entradas a zonas. */
export async function registrarVisitante(datos: DatosVisitante): Promise<User> {
  const { user, esNuevo } = await encontrarOCrearUsuario(datos);

  const photo = await photosRepository.create({
    id: newId('photo'),
    userId: user.id,
    url: datos.foto,
    isCurrent: true,
    uploadedAt: new Date().toISOString(),
    deletedAt: null,
  });

  const biometricosPrevios = await biometricsRepository.listByUser(user.id);
  if (biometricosPrevios.length === 0) {
    await biometricsRepository.create({
      id: newId('bio'),
      userId: user.id,
      photoId: photo.id,
      biometricRef: newId('BIO').toUpperCase(),
      biometricType: 'facial',
      qualityScore: 85 + Math.floor(Math.random() * 14),
      device: 'Cámara del kiosco (app móvil)',
      status: 'registrada',
      source: 'device',
      blockedGlobally: false,
      blockedZoneIds: [],
      deletedAt: null,
    });
    await logEvent('biometric_registered', 'info', 'user', user.id);
  }

  await logEvent(esNuevo ? 'user_registered' : 'user_updated', 'info', 'user', user.id);

  return user;
}
