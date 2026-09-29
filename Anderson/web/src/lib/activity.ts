// Registro de actividad por usuario: qué eventos (`events`) le pertenecen a
// un usuario y de dónde vinieron (app móvil del usuario vs. dashboard de
// administración). Reutilizado por "Acciones y trazas" (ficha de usuario) y
// por el módulo "Registro de actividad".
import type { AccessLog, AccessToken, Biometric, SystemEvent } from '../types'

export type ActivityOrigin = 'mobile' | 'dashboard'

export const ORIGIN_LABEL: Record<ActivityOrigin, string> = {
  mobile: 'App móvil',
  dashboard: 'Dashboard',
}

export const ORIGIN_BADGE_CLASS: Record<ActivityOrigin, string> = {
  mobile: 'bg-brand-50 text-brand-600',
  dashboard: 'bg-surface-muted text-ink-700',
}

/**
 * Un evento se atribuye a la app móvil cuando lo originó el propio
 * dispositivo/biométrico del usuario (`actor` con prefijo `device:`, ver
 * mock-api/seed.js y services/*Service.ts); cualquier otro actor (el admin
 * del dashboard, `admin-1`) se atribuye al dashboard.
 */
export function eventOrigin(event: SystemEvent): ActivityOrigin {
  return event.actor.startsWith('device:') ? 'mobile' : 'dashboard'
}

/** Todos los eventos que le pertenecen a un usuario: por sí mismo, por sus
 * tokens, por su biometría o por sus registros de acceso. */
export function actionsForUser(
  userId: string,
  events: SystemEvent[],
  ctx: { tokens: AccessToken[]; biometrics: Biometric[]; accessLogs: AccessLog[] },
): SystemEvent[] {
  const tokenIds = new Set(ctx.tokens.filter((t) => t.userId === userId).map((t) => t.id))
  const biometricIds = new Set(ctx.biometrics.filter((b) => b.userId === userId).map((b) => b.id))
  const accessLogIds = new Set(ctx.accessLogs.filter((l) => l.userId === userId).map((l) => l.id))
  return events.filter(
    (e) =>
      e.entityId === userId ||
      (e.entityType === 'token' && tokenIds.has(e.entityId)) ||
      (e.entityType === 'biometric' && biometricIds.has(e.entityId)) ||
      (e.entityType === 'accessLog' && accessLogIds.has(e.entityId)) ||
      (typeof e.payload?.userId === 'string' && e.payload.userId === userId),
  )
}
