// Repositorios: acceso puro a las colecciones del mock-api, sin reglas de
// negocio (esas viven en ../services). Subconjunto de
// Anderson/web/src/repositories/index.ts — solo lo que el kiosco necesita.
// Igual que allá: ningún método hace DELETE.
import { api } from './client';
import type { AccessLog, AccessToken, Biometric, Photo, SystemEvent, TokenHistoryEntry, User, Zone } from './types';

export const usersRepository = {
  findByDocumentId: (documentId: string) => api.get<User[]>(`/users?documentId=${documentId}`),
  create: (user: User) => api.post<User>('/users', user),
  update: (id: string, patch: Partial<User>) => api.patch<User>(`/users/${id}`, patch),
};

export const photosRepository = {
  listByUser: (userId: string) =>
    api.get<Photo[]>(`/photos?userId=${userId}&_sort=uploadedAt&_order=desc`),
  create: (photo: Photo) => api.post<Photo>('/photos', photo),
};

export const biometricsRepository = {
  listByUser: (userId: string) => api.get<Biometric[]>(`/biometrics?userId=${userId}`),
  create: (biometric: Biometric) => api.post<Biometric>('/biometrics', biometric),
};

export const zonesRepository = {
  list: () => api.get<Zone[]>('/zones'),
};

export const tokensRepository = {
  create: (token: AccessToken) => api.post<AccessToken>('/tokens', token),
  update: (id: string, patch: Partial<AccessToken>) =>
    api.patch<AccessToken>(`/tokens/${id}`, patch),
};

export const tokenHistoryRepository = {
  create: (entry: TokenHistoryEntry) => api.post<TokenHistoryEntry>('/tokenHistory', entry),
};

export const accessLogsRepository = {
  create: (log: AccessLog) => api.post<AccessLog>('/accessLogs', log),
};

export const eventsRepository = {
  create: (event: SystemEvent) => api.post<SystemEvent>('/events', event),
};
