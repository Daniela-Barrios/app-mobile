import { useAsync } from '../hooks/useAsync'
import { guardMessagesRepository, guardRequestsRepository, usersRepository } from '../repositories'

async function loadGuardData() {
  const [requests, users] = await Promise.all([
    guardRequestsRepository.list(),
    usersRepository.list(),
  ])
  const messagesByRequest = await Promise.all(
    requests.map((r) => guardMessagesRepository.listByRequest(r.id)),
  )
  return { requests, users, messagesByRequest }
}

export function GuardPage() {
  const { data, loading, error } = useAsync(loadGuardData)

  if (loading) return <p className="text-sm text-text-muted">Cargando solicitudes…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { requests, users, messagesByRequest } = data
  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">Vigilante virtual</h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">
            Simulado — sin funcionalidad real
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white opacity-50"
          >
            Llamar vigilante
          </button>
          <button
            type="button"
            disabled
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-ink-700 opacity-50"
          >
            Iniciar videollamada
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-text-muted">Sin solicitudes registradas.</p>
      ) : (
        requests.map((request, i) => (
          <div key={request.id} className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">
                {userName(request.userId)} · {request.channel}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  request.status === 'atendida'
                    ? 'bg-success-500/10 text-success-500'
                    : 'bg-warning-500/10 text-warning-500'
                }`}
              >
                {request.status}
              </span>
            </div>
            <ul className="space-y-2">
              {messagesByRequest[i]?.map((msg) => (
                <li
                  key={msg.id}
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender === 'vigilante'
                      ? 'ml-auto bg-brand-600 text-white'
                      : 'bg-surface-muted text-ink-900'
                  }`}
                >
                  {msg.body}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
