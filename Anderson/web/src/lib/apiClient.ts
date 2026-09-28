// Cliente HTTP mínimo hacia el mock (json-server), vía el proxy /api de Vite.
// Nadie fuera de src/repositories llama a este cliente directamente: la UI
// nunca toca el mock a mano (ver docs/PLAN.md §1.2).

const BASE_URL = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(
      `API ${init?.method ?? 'GET'} ${path} -> ${res.status} ${res.statusText}${body ? `: ${body}` : ''}`,
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
