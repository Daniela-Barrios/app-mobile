// Reglas de administración de usuarios: crear, editar, desactivar (baja
// lógica) y reactivar. Cada acción deja traza en `events` (ver
// lib/describeEvent.ts, sección "Acciones y trazas" de la ficha de usuario).
import { newId } from '../lib/id'
import { eventsRepository, usersRepository } from '../repositories'
import type { User } from '../types'

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
    entityType: 'user',
    entityId,
    payload,
    source: 'simulated',
  })
}

export interface UserFormInput {
  fullName: string
  documentId: string
  company: string
  phone: string
  status: 'activo' | 'inactivo'
}

export async function createUser(input: UserFormInput): Promise<User> {
  const user: User = {
    id: newId('user'),
    documentId: input.documentId,
    fullName: input.fullName,
    status: input.status,
    company: input.company || null,
    phone: input.phone || null,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  }
  const created = await usersRepository.create(user)
  await logEvent('user_registered', 'info', created.id)
  return created
}

export async function updateUser(id: string, input: UserFormInput): Promise<User> {
  const updated = await usersRepository.update(id, {
    fullName: input.fullName,
    documentId: input.documentId,
    company: input.company || null,
    phone: input.phone || null,
    status: input.status,
  })
  await logEvent('user_updated', 'info', id)
  return updated
}

export async function deactivateUser(id: string): Promise<User> {
  const updated = await usersRepository.softDelete(id)
  await logEvent('user_deleted', 'warning', id)
  return updated
}

export async function reactivateUser(id: string): Promise<User> {
  const updated = await usersRepository.reactivate(id)
  await logEvent('user_reactivated', 'info', id)
  return updated
}
