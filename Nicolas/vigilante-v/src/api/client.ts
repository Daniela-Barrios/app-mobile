// Cliente HTTP hacia el mismo mock-api (json-server) que usa el dashboard
// (Anderson/web/src/lib/apiClient.ts), vía el proxy /api de este propio Vite
// (ver vite.config.ts). El kiosco y el dashboard son dos clientes distintos
// de la misma fuente de datos: nunca se hablan entre sí directamente.

const BASE_URL = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `API ${init?.method ?? 'GET'} ${path} -> ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
};

let counter = 0;
/** Igual que Anderson/web/src/lib/id.ts: id legible determinista-por-tiempo. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}
