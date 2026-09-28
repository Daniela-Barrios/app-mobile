import { useMemo, useState } from 'react'
import { useAsync } from '../hooks/useAsync'
import { accessLogsRepository, tokensRepository, usersRepository, zonesRepository } from '../repositories'

async function loadAccessLogs() {
  const [logs, users, zones, tokens] = await Promise.all([
    accessLogsRepository.list(),
    usersRepository.list(),
    zonesRepository.list(),
    tokensRepository.list(),
  ])
  return { logs, users, zones, tokens }
}

export function AccessLogsPage() {
  const { data, loading, error } = useAsync(loadAccessLogs)
  const [zoneFilter, setZoneFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.logs.filter(
      (log) =>
        (!zoneFilter || log.zoneId === zoneFilter) &&
        (!userFilter || log.userId === userFilter),
    )
  }, [data, zoneFilter, userFilter])

  if (loading) return <p className="text-sm text-text-muted">Cargando accesos…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { users, zones, tokens } = data
  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id
  const tokenCode = (id: string) => tokens.find((t) => t.id === id)?.code ?? id

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">
              Accesos <span className="text-text-muted">({filtered.length})</span>
            </h2>
            <p className="text-xs text-text-muted">
              Monitoreo de accesos y uso de token por zona. Trazabilidad
              Usuario → Foto → Token → Zona → Registro. Inmutable.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink-900 focus:border-brand-600 focus:outline-none"
            >
              <option value="">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink-900 focus:border-brand-600 focus:outline-none"
            >
              <option value="">Todos los usuarios</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
            {(zoneFilter || userFilter) && (
              <button
                type="button"
                onClick={() => {
                  setZoneFilter('')
                  setUserFilter('')
                }}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-5 py-2 font-medium">Fecha/hora</th>
              <th className="px-5 py-2 font-medium">Usuario</th>
              <th className="px-5 py-2 font-medium">Zona</th>
              <th className="px-5 py-2 font-medium">Token</th>
              <th className="px-5 py-2 font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-5 py-2.5 text-text-muted">
                  {new Date(log.occurredAt).toLocaleString('es-CO')}
                </td>
                <td className="px-5 py-2.5 text-ink-900">{userName(log.userId)}</td>
                <td className="px-5 py-2.5 text-text-muted">{zoneName(log.zoneId)}</td>
                <td className="px-5 py-2.5 font-mono text-xs text-text-muted">
                  {tokenCode(log.tokenId)}
                </td>
                <td className="px-5 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      log.result === 'autorizado'
                        ? 'bg-success-500/10 text-success-500'
                        : 'bg-danger-500/10 text-danger-500'
                    }`}
                  >
                    {log.result}
                    {log.denyReason ? ` · ${log.denyReason}` : ''}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-text-muted">
                  Sin resultados con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
