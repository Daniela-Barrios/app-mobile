// Traduce un SystemEvent crudo a algo legible para "Acciones y trazas" /
// "Actividad reciente": una etiqueta humana, un detalle (token/zona/actor)
// y un tono de color. Reutilizado por DashboardPage y UserDetailPage.
import type { AccessToken, SystemEvent, Zone } from '../types'

const ACTOR_LABELS: Record<string, string> = {
  'admin-1': 'Ana Restrepo (admin)',
  'device:biometric-simulator': 'Simulador biométrico',
}

export function actorLabel(actor: string): string {
  return ACTOR_LABELS[actor] ?? actor
}

const EVENT_LABELS: Record<string, string> = {
  user_registered: 'Usuario registrado',
  user_updated: 'Usuario editado',
  user_deactivated: 'Usuario desactivado',
  user_deleted: 'Usuario eliminado (baja lógica)',
  user_reactivated: 'Usuario reactivado',
  biometric_registered: 'Biometría registrada',
  biometric_blocked: 'Bloqueo general aplicado',
  biometric_unblocked: 'Bloqueo general retirado',
  biometric_zone_block_updated: 'Bloqueo por zona actualizado',
  token_generated: 'Token generado',
  token_revoked: 'Token revocado manualmente',
  access_granted: 'Acceso autorizado',
  access_denied: 'Acceso rechazado',
  zone_created: 'Zona creada',
  zone_updated: 'Zona editada',
  zone_deactivated: 'Zona desactivada (baja lógica)',
  zone_reactivated: 'Zona reactivada',
  camera_created: 'Cámara agregada',
  camera_updated: 'Cámara editada',
  camera_deactivated: 'Cámara eliminada (baja lógica)',
  camera_reactivated: 'Cámara reactivada',
}

export type EventTone = 'success' | 'warning' | 'danger' | 'info'

export const TONE_DOT_CLASS: Record<EventTone, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-brand-600',
}

export function describeEvent(
  event: SystemEvent,
  ctx: { zones: Zone[]; tokens: AccessToken[] },
): { label: string; detail: string; tone: EventTone } {
  const label = EVENT_LABELS[event.type] ?? event.type

  const token = event.entityType === 'token' ? ctx.tokens.find((t) => t.id === event.entityId) : undefined
  const payloadZoneId =
    typeof event.payload?.zoneId === 'string' ? (event.payload.zoneId as string) : undefined
  const zoneId = payloadZoneId ?? token?.zoneId
  const zoneName = zoneId ? ctx.zones.find((z) => z.id === zoneId)?.name : undefined

  const parts: string[] = []
  if (token) parts.push(token.code)
  if (zoneName) parts.push(zoneName)
  parts.push(`por ${actorLabel(event.actor)}`)

  const tone: EventTone =
    event.type === 'access_denied' || event.severity === 'danger'
      ? 'danger'
      : event.severity === 'warning'
        ? 'warning'
        : event.type === 'access_granted'
          ? 'success'
          : 'info'

  return { label, detail: parts.join(' · '), tone }
}
