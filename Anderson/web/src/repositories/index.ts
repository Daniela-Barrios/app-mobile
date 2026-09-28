// Repositorios: única puerta de entrada al mock. Sin reglas de negocio aquí
// (esas viven en src/services) — solo CRUD contra json-server. Ninguno hace
// DELETE: "eliminar" siempre es un PATCH con deletedAt (ver docs/PLAN.md).
import { api } from '../lib/apiClient'
import type {
  AccessLog,
  AccessToken,
  Biometric,
  Camera,
  GuardMessage,
  GuardRequest,
  Photo,
  SystemEvent,
  SystemStatus,
  TokenHistoryEntry,
  User,
  Zone,
} from '../types'

export const usersRepository = {
  list: () => api.get<User[]>('/users'),
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (user: User) => api.post<User>('/users', user),
  update: (id: string, patch: Partial<User>) => api.patch<User>(`/users/${id}`, patch),
  softDelete: (id: string) =>
    api.patch<User>(`/users/${id}`, { deletedAt: new Date().toISOString(), status: 'inactivo' }),
  reactivate: (id: string) =>
    api.patch<User>(`/users/${id}`, { deletedAt: null, status: 'activo' }),
}

export const photosRepository = {
  listByUser: (userId: string) => api.get<Photo[]>(`/photos?userId=${userId}`),
}

export const biometricsRepository = {
  list: () => api.get<Biometric[]>('/biometrics'),
  listByUser: (userId: string) => api.get<Biometric[]>(`/biometrics?userId=${userId}`),
  update: (id: string, patch: Partial<Biometric>) =>
    api.patch<Biometric>(`/biometrics/${id}`, patch),
}

export const zonesRepository = {
  list: () => api.get<Zone[]>('/zones'),
  get: (id: string) => api.get<Zone>(`/zones/${id}`),
  create: (zone: Zone) => api.post<Zone>('/zones', zone),
  update: (id: string, patch: Partial<Zone>) => api.patch<Zone>(`/zones/${id}`, patch),
  softDelete: (id: string) =>
    api.patch<Zone>(`/zones/${id}`, { deletedAt: new Date().toISOString(), active: false }),
  reactivate: (id: string) =>
    api.patch<Zone>(`/zones/${id}`, { deletedAt: null, active: true }),
}

export const tokensRepository = {
  list: () => api.get<AccessToken[]>('/tokens'),
  listByUser: (userId: string) => api.get<AccessToken[]>(`/tokens?userId=${userId}`),
  listActiveByUser: (userId: string) =>
    api.get<AccessToken[]>(`/tokens?userId=${userId}&status=activo`),
  get: (id: string) => api.get<AccessToken>(`/tokens/${id}`),
  create: (token: AccessToken) => api.post<AccessToken>('/tokens', token),
  update: (id: string, patch: Partial<AccessToken>) =>
    api.patch<AccessToken>(`/tokens/${id}`, patch),
}

export const tokenHistoryRepository = {
  listByToken: (tokenId: string) =>
    api.get<TokenHistoryEntry[]>(`/tokenHistory?tokenId=${tokenId}`),
  create: (entry: TokenHistoryEntry) =>
    api.post<TokenHistoryEntry>('/tokenHistory', entry),
}

export const accessLogsRepository = {
  list: () => api.get<AccessLog[]>('/accessLogs?_sort=occurredAt&_order=desc'),
  listByUser: (userId: string) =>
    api.get<AccessLog[]>(`/accessLogs?userId=${userId}&_sort=occurredAt&_order=desc`),
  create: (log: AccessLog) => api.post<AccessLog>('/accessLogs', log),
}

export const eventsRepository = {
  list: () => api.get<SystemEvent[]>('/events?_sort=occurredAt&_order=desc'),
  create: (event: SystemEvent) => api.post<SystemEvent>('/events', event),
}

export const camerasRepository = {
  list: () => api.get<Camera[]>('/cameras'),
  create: (camera: Camera) => api.post<Camera>('/cameras', camera),
  update: (id: string, patch: Partial<Camera>) => api.patch<Camera>(`/cameras/${id}`, patch),
  softDelete: (id: string) =>
    api.patch<Camera>(`/cameras/${id}`, {
      deletedAt: new Date().toISOString(),
      status: 'desconectada' as const,
    }),
  reactivate: (id: string) => api.patch<Camera>(`/cameras/${id}`, { deletedAt: null }),
}

export const guardRequestsRepository = {
  list: () => api.get<GuardRequest[]>('/guardRequests'),
}

export const guardMessagesRepository = {
  listByRequest: (requestId: string) =>
    api.get<GuardMessage[]>(`/guardMessages?requestId=${requestId}`),
}

export const systemStatusRepository = {
  get: async () => {
    const rows = await api.get<SystemStatus[]>('/systemStatus')
    return rows[0]
  },
}
