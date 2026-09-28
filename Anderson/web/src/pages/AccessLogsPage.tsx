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

  if (loading) return <p className="text-sm text-text-muted">Cargando registros…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { logs, users, zones, tokens } = data
  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id
  const tokenCode = (id: string) => tokens.find((t) => t.id === id)?.code ?? id

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-900">
          Registros de acceso <span className="text-text-muted">({logs.length})</span>
        </h2>
        <p className="text-xs text-text-muted">
          Trazabilidad: Usuario → Foto → Token → Zona → Registro. Inmutable.
        </p>
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
            {logs.map((log) => (
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
