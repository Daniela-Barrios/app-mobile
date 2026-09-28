// Tipos de dominio, uno a uno con las colecciones del mock (ver docs/PLAN.md §2).
// Nunca se borra nada físicamente: toda entidad administrable lleva `deletedAt`.

export type UserStatus = 'activo' | 'inactivo'

export interface User {
  id: string
  documentId: string
  fullName: string
  status: UserStatus
  company: string | null
  phone: string | null
  createdAt: string
  deletedAt: string | null
}

export interface Photo {
  id: string
  userId: string
  url: string
  isCurrent: boolean
  uploadedAt: string
  deletedAt: string | null
}

export type BiometricStatus = 'pendiente' | 'registrada' | 'revocada'

export interface Biometric {
  id: string
  userId: string
  photoId: string
  biometricRef: string | null
  status: BiometricStatus
  source: 'simulated' | 'device'
  deletedAt: string | null
}

export interface Zone {
  id: string
  code: string
  name: string
  isRestricted: boolean
  active: boolean
  deletedAt: string | null
}

// Sin TTL: solo dos estados. La transición a "inválido" ocurre por
// validación biométrica o por revocación manual (ver skill token-rules).
export type TokenStatus = 'activo' | 'inválido'

export interface AccessToken {
  id: string
  code: string
  userId: string
  zoneId: string
  status: TokenStatus
  issuedAt: string
  validatedAt: string | null
  invalidatedReason: 'biometric_validation' | 'manual_revocation' | 'user_deactivated' | null
  deletedAt: string | null
}

export interface TokenHistoryEntry {
  id: string
  tokenId: string
  from: TokenStatus | null
  to: TokenStatus
  at: string
  actor: string
  reason: string
}

export type AccessResult = 'autorizado' | 'rechazado'

export interface AccessLog {
  id: string
  userId: string
  zoneId: string
  tokenId: string
  photoId: string | null
  result: AccessResult
  denyReason: 'token_invalid' | 'wrong_zone' | 'user_inactive' | null
  occurredAt: string
  source: 'simulated' | 'device'
  cameraId: string | null
  evidenceRef: string | null
}

export interface SystemEvent {
  id: string
  type: string
  severity: 'info' | 'warning' | 'danger'
  occurredAt: string
  actor: string
  entityType: string
  entityId: string
  payload: Record<string, unknown>
  source: 'simulated' | 'device'
}

export type CameraStatus = 'desconectada' | 'conectando' | 'conectada' | 'error'

export interface Camera {
  id: string
  zoneId: string
  name: string
  streamRef: string
  status: CameraStatus
  lastSeenAt: string | null
  deletedAt: string | null
}

export type GuardChannel = 'chat' | 'voz' | 'video'

export interface GuardRequest {
  id: string
  userId: string
  zoneId: string
  channel: GuardChannel
  status: 'pendiente' | 'atendida'
  attendedBy: string | null
  createdAt: string
  attendedAt: string | null
  deletedAt: string | null
}

export interface GuardMessage {
  id: string
  requestId: string
  sender: 'usuario' | 'vigilante'
  body: string
  sentAt: string
}

export interface Admin {
  id: string
  name: string
  role: string
  deletedAt: string | null
}

export interface SystemStatus {
  id: string
  operational: boolean
  guardAvailable: boolean
  updatedAt: string
}
