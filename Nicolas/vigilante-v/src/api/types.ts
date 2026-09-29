// Subconjunto de los tipos de dominio del dashboard (Anderson/web/src/types.ts).
// Los nombres de campo deben quedar IDÉNTICOS a los de allá: ambas apps
// escriben/leen las mismas colecciones del mismo mock-api. Si el dashboard
// cambia un tipo, este archivo debe actualizarse igual.

export type UserStatus = 'activo' | 'inactivo';

export interface User {
  id: string;
  documentId: string;
  fullName: string;
  status: UserStatus;
  company: string | null;
  phone: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface Photo {
  id: string;
  userId: string;
  url: string;
  isCurrent: boolean;
  uploadedAt: string;
  deletedAt: string | null;
}

export type BiometricStatus = 'pendiente' | 'registrada' | 'revocada';

export interface Biometric {
  id: string;
  userId: string;
  photoId: string;
  biometricRef: string | null;
  biometricType: 'huella' | 'facial';
  qualityScore: number | null;
  device: string | null;
  status: BiometricStatus;
  source: 'simulated' | 'device';
  blockedGlobally: boolean;
  blockedZoneIds: string[];
  deletedAt: string | null;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  isRestricted: boolean;
  active: boolean;
  deletedAt: string | null;
}

export type TokenStatus = 'activo' | 'inválido';

export interface AccessToken {
  id: string;
  code: string;
  userId: string;
  zoneId: string;
  status: TokenStatus;
  issuedAt: string;
  validatedAt: string | null;
  invalidatedReason: 'biometric_validation' | 'manual_revocation' | 'user_deactivated' | null;
  deletedAt: string | null;
}

export interface TokenHistoryEntry {
  id: string;
  tokenId: string;
  from: TokenStatus | null;
  to: TokenStatus;
  at: string;
  actor: string;
  reason: string;
}

export type AccessResult = 'autorizado' | 'rechazado';

export interface AccessLog {
  id: string;
  userId: string;
  zoneId: string;
  tokenId: string;
  photoId: string | null;
  result: AccessResult;
  denyReason: 'token_invalid' | 'wrong_zone' | 'user_inactive' | null;
  occurredAt: string;
  source: 'simulated' | 'device';
  cameraId: string | null;
  evidenceRef: string | null;
}

export interface SystemEvent {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  occurredAt: string;
  actor: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  source: 'simulated' | 'device';
}
