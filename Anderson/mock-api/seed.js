// Generador determinista del dataset semilla del mock (json-server).
// Reglas respetadas (ver docs/PLAN.md y skill token-rules):
//   - Único token `activo` por usuario, GLOBAL en todo el sistema (no por zona).
//   - Sin TTL: los tokens solo pasan a `inválido` por validación biométrica o revocación manual.
//   - Nada se borra físicamente: baja lógica vía `deletedAt`.
//   - `tokenHistory`, `accessLogs` y `events` son append-only.
//
// Determinista e idempotente: siempre produce el mismo db.json. Ejecutar con `npm run seed`.

import { writeFileSync } from 'node:fs'

const NOW = new Date('2026-09-28T13:00:00.000Z')
const iso = (offsetMinutes = 0) =>
  new Date(NOW.getTime() + offsetMinutes * 60_000).toISOString()

const FIRST_NAMES = [
  'Juan', 'Maria', 'Carlos', 'Laura', 'Andres', 'Sofia', 'Diego', 'Valentina',
  'Camilo', 'Isabella', 'Felipe', 'Daniela', 'Santiago', 'Gabriela', 'Miguel',
  'Paula', 'Julian', 'Natalia', 'Ricardo', 'Alejandra',
]
const LAST_NAMES = [
  'Perez', 'Gomez', 'Rodriguez', 'Martinez', 'Lopez', 'Garcia', 'Hernandez',
  'Ramirez', 'Torres', 'Diaz', 'Vargas', 'Castro', 'Ortiz', 'Rojas', 'Moreno',
]

const USER_COUNT = 40
const ADMIN = { id: 'admin-1', name: 'Ana Restrepo', role: 'administrador', deletedAt: null }

const zones = [
  { id: 'zone-1', code: 'ENTRADA', name: 'Entrada', isRestricted: false, active: true, deletedAt: null },
  { id: 'zone-2', code: 'BODEGA', name: 'Bodega', isRestricted: true, active: true, deletedAt: null },
  { id: 'zone-3', code: 'OFICINA', name: 'Oficina', isRestricted: true, active: true, deletedAt: null },
]

const COMPANIES = ['Bodegas Panamericana', 'Transportes del Valle', 'Logística Andina', null]
const PHONE_PREFIXES = ['300', '301', '310', '311', '320']

const users = []
const photos = []
const biometrics = []
const tokens = []
const tokenHistory = []
const accessLogs = []
const events = []

let eventSeq = 1
function pushEvent({ type, severity = 'info', actor, entityType, entityId, payload = {}, occurredAt }) {
  events.push({
    id: `evt-${eventSeq++}`,
    type,
    severity,
    occurredAt,
    actor,
    entityType,
    entityId,
    payload,
    source: 'simulated',
  })
}

for (let i = 0; i < USER_COUNT; i++) {
  const userNum = i + 1
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last = LAST_NAMES[i % LAST_NAMES.length]
  const fullName = `${first} ${last}`
  const documentId = `100000${String(1000 + userNum)}`
  const userId = `user-${userNum}`
  // 2 de cada 20 usuarios quedan inactivos (dados de baja, soft).
  const isDeactivated = userNum % 10 === 0
  const createdAt = iso(-60 * 24 * (USER_COUNT - i))

  const company = COMPANIES[userNum % COMPANIES.length]
  const phone = `${PHONE_PREFIXES[userNum % PHONE_PREFIXES.length]}${String(1000000 + userNum * 37).slice(-7)}`

  users.push({
    id: userId,
    documentId,
    fullName,
    status: isDeactivated ? 'inactivo' : 'activo',
    company,
    phone,
    createdAt,
    deletedAt: null,
  })
  pushEvent({
    type: 'user_registered',
    actor: ADMIN.id,
    entityType: 'user',
    entityId: userId,
    payload: { fullName },
    occurredAt: createdAt,
  })

  const photoId = `photo-${userNum}`
  photos.push({
    id: photoId,
    userId,
    url: `/seed-media/avatars/avatar-${(userNum % 12) + 1}.png`,
    isCurrent: true,
    uploadedAt: createdAt,
    deletedAt: null,
  })

  // Biometria: la mayoria registrada, algunos pendientes.
  const biometricPending = userNum % 8 === 0
  biometrics.push({
    id: `bio-${userNum}`,
    userId,
    photoId,
    biometricRef: biometricPending ? null : `BIO-${String(userNum).padStart(4, '0')}`,
    status: biometricPending ? 'pendiente' : 'registrada',
    source: 'simulated',
    deletedAt: null,
  })
  if (!biometricPending) {
    pushEvent({
      type: 'biometric_registered',
      actor: ADMIN.id,
      entityType: 'user',
      entityId: userId,
      payload: {},
      occurredAt: createdAt,
    })
  }

  if (isDeactivated) {
    pushEvent({
      type: 'user_deactivated',
      severity: 'warning',
      actor: ADMIN.id,
      entityType: 'user',
      entityId: userId,
      payload: {},
      occurredAt: iso(-60),
    })
    continue // usuario inactivo: sin tokens
  }

  // Regla: como maximo UN token activo por usuario en TODO el sistema.
  // Distribuimos escenarios ciclicamente entre los usuarios activos:
  //   0 -> token activo (sin validar)
  //   1 -> token ya validado por biometria (inválido, con accessLog autorizado)
  //   2 -> token revocado manualmente (inválido)
  //   3 -> sin token
  const scenario = userNum % 4
  const zone = zones[userNum % zones.length]
  const tokenId = `token-${userNum}`
  const tokenCode = `TK-${String(userNum).padStart(3, '0')}`
  const issuedAt = iso(-120 + userNum)

  if (scenario === 0) {
    tokens.push({
      id: tokenId,
      code: tokenCode,
      userId,
      zoneId: zone.id,
      status: 'activo',
      issuedAt,
      validatedAt: null,
      invalidatedReason: null,
      deletedAt: null,
    })
    tokenHistory.push({ id: `th-${tokenId}-1`, tokenId, from: null, to: 'activo', at: issuedAt, actor: ADMIN.id, reason: 'token_issued' })
    pushEvent({ type: 'token_generated', actor: ADMIN.id, entityType: 'token', entityId: tokenId, payload: { code: tokenCode, zoneId: zone.id }, occurredAt: issuedAt })
  } else if (scenario === 1) {
    const validatedAt = iso(-30 + userNum)
    tokens.push({
      id: tokenId,
      code: tokenCode,
      userId,
      zoneId: zone.id,
      status: 'inválido',
      issuedAt,
      validatedAt,
      invalidatedReason: 'biometric_validation',
      deletedAt: null,
    })
    tokenHistory.push({ id: `th-${tokenId}-1`, tokenId, from: null, to: 'activo', at: issuedAt, actor: ADMIN.id, reason: 'token_issued' })
    tokenHistory.push({ id: `th-${tokenId}-2`, tokenId, from: 'activo', to: 'inválido', at: validatedAt, actor: 'device:biometric-simulator', reason: 'biometric_validation' })
    pushEvent({ type: 'token_generated', actor: ADMIN.id, entityType: 'token', entityId: tokenId, payload: { code: tokenCode, zoneId: zone.id }, occurredAt: issuedAt })
    const accessId = `access-${userNum}`
    accessLogs.push({
      id: accessId,
      userId,
      zoneId: zone.id,
      tokenId,
      photoId,
      result: 'autorizado',
      denyReason: null,
      occurredAt: validatedAt,
      source: 'simulated',
      cameraId: null,
      evidenceRef: null,
    })
    pushEvent({ type: 'access_granted', actor: 'device:biometric-simulator', entityType: 'accessLog', entityId: accessId, payload: { userId, zoneId: zone.id }, occurredAt: validatedAt })
  } else if (scenario === 2) {
    const revokedAt = iso(-45 + userNum)
    tokens.push({
      id: tokenId,
      code: tokenCode,
      userId,
      zoneId: zone.id,
      status: 'inválido',
      issuedAt,
      validatedAt: null,
      invalidatedReason: 'manual_revocation',
      deletedAt: null,
    })
    tokenHistory.push({ id: `th-${tokenId}-1`, tokenId, from: null, to: 'activo', at: issuedAt, actor: ADMIN.id, reason: 'token_issued' })
    tokenHistory.push({ id: `th-${tokenId}-2`, tokenId, from: 'activo', to: 'inválido', at: revokedAt, actor: ADMIN.id, reason: 'manual_revocation' })
    pushEvent({ type: 'token_generated', actor: ADMIN.id, entityType: 'token', entityId: tokenId, payload: { code: tokenCode, zoneId: zone.id }, occurredAt: issuedAt })
    pushEvent({ type: 'token_revoked', severity: 'warning', actor: ADMIN.id, entityType: 'token', entityId: tokenId, payload: {}, occurredAt: revokedAt })
  }
  // scenario === 3: sin token, no se genera nada mas.
}

// Un caso de acceso rechazado (token invalido usado de nuevo) para el escenario de demo.
const deniedUser = users.find((u) => u.status === 'activo')
if (deniedUser) {
  const relatedToken = tokens.find((t) => t.userId === deniedUser.id)
  if (relatedToken) {
    const deniedAt = iso(5)
    const accessId = `access-denied-1`
    accessLogs.push({
      id: accessId,
      userId: deniedUser.id,
      zoneId: relatedToken.zoneId,
      tokenId: relatedToken.id,
      photoId: photos.find((p) => p.userId === deniedUser.id)?.id ?? null,
      result: 'rechazado',
      denyReason: relatedToken.status === 'activo' ? 'wrong_zone' : 'token_invalid',
      occurredAt: deniedAt,
      source: 'simulated',
      cameraId: null,
      evidenceRef: null,
    })
    pushEvent({ type: 'access_denied', severity: 'warning', actor: 'device:biometric-simulator', entityType: 'accessLog', entityId: accessId, payload: { userId: deniedUser.id }, occurredAt: deniedAt })
  }
}

// 2 cámaras por zona, con estados variados para demostrar la vista por pestañas.
const CAMERA_STATES = ['conectada', 'conectando', 'desconectada', 'error']
const cameras = zones.flatMap((zone, zoneIndex) =>
  [1, 2].map((n) => {
    const stateIndex = (zoneIndex * 2 + (n - 1)) % CAMERA_STATES.length
    const status = CAMERA_STATES[stateIndex]
    return {
      id: `camera-${zone.id}-${n}`,
      zoneId: zone.id,
      name: `${zone.name} · Cámara ${n}`,
      streamRef: `/seed-media/camera-placeholder.svg`,
      status,
      lastSeenAt: status === 'conectada' ? iso(-5) : null,
      deletedAt: null,
    }
  }),
)

const guardRequests = [
  {
    id: 'guard-req-1',
    userId: users[0].id,
    zoneId: zones[0].id,
    channel: 'chat',
    status: 'atendida',
    attendedBy: ADMIN.id,
    createdAt: iso(-20),
    attendedAt: iso(-18),
    deletedAt: null,
  },
]
const guardMessages = [
  { id: 'guard-msg-1', requestId: 'guard-req-1', sender: 'usuario', body: 'Solicito ingreso.', sentAt: iso(-20) },
  { id: 'guard-msg-2', requestId: 'guard-req-1', sender: 'vigilante', body: 'Acceso autorizado.', sentAt: iso(-18) },
]

// Un registro "eliminado" (soft) por colección administrable, para demostrar el filtro "mostrar eliminados".
const deletedUser = users[users.length - 1]
deletedUser.deletedAt = iso(-10)
pushEvent({ type: 'user_deleted', severity: 'warning', actor: ADMIN.id, entityType: 'user', entityId: deletedUser.id, payload: {}, occurredAt: iso(-10) })

const systemStatus = {
  id: 'system-status',
  operational: true,
  guardAvailable: true,
  updatedAt: iso(),
}

const db = {
  users,
  photos,
  biometrics,
  zones,
  tokens,
  tokenHistory,
  accessLogs,
  events,
  cameras,
  guardRequests,
  guardMessages,
  admins: [ADMIN],
  systemStatus: [systemStatus],
}

writeFileSync(new URL('./db.json', import.meta.url), `${JSON.stringify(db, null, 2)}\n`)

console.log(
  `Seed generado: ${users.length} usuarios, ${tokens.length} tokens, ${accessLogs.length} accesos, ${events.length} eventos.`,
)
