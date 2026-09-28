import { Link } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import {
  accessLogsRepository,
  biometricsRepository,
  eventsRepository,
  tokensRepository,
  usersRepository,
  zonesRepository,
} from '../repositories'
import { ActivityIcon, FingerprintIcon, KeyIcon, UsersIcon } from '../components/icons'

async function loadDashboard() {
  const [users, tokens, biometrics, events, accessLogs, zones] = await Promise.all([
    usersRepository.list(),
    tokensRepository.list(),
    biometricsRepository.list(),
    eventsRepository.list(),
    accessLogsRepository.list(), // ya viene ordenado por occurredAt desc
    zonesRepository.list(),
  ])
  return { users, tokens, biometrics, events, accessLogs, zones }
}

export function DashboardPage() {
  const { data, loading, error } = useAsync(loadDashboard)

  if (loading) return <p className="text-sm text-text-muted">Cargando resumen…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { users, tokens, biometrics, events, accessLogs, zones } = data
  const activeUsers = users.filter((u) => u.status === 'activo' && !u.deletedAt)
  const activeTokens = tokens.filter((t) => t.status === 'activo')
  const registeredBiometrics = biometrics.filter((b) => b.status === 'registrada')

  const kpis = [
    { label: 'Usuarios activos', value: activeUsers.length, icon: UsersIcon },
    { label: 'Tokens activos', value: activeTokens.length, icon: KeyIcon },
    { label: 'Biometrías registradas', value: registeredBiometrics.length, icon: FingerprintIcon },
    { label: 'Eventos totales', value: events.length, icon: ActivityIcon },
  ]

  const zoneCounts = zones.map((zone) => ({
    zone: zone.name,
    count: accessLogs.filter((a) => a.zoneId === zone.id).length,
  }))
  const maxZoneCount = Math.max(1, ...zoneCounts.map((z) => z.count))

  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id
  const tokenCode = (id: string) => tokens.find((t) => t.id === id)?.code ?? id
  const recentAccess = accessLogs.slice(0, 8)

  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-muted">{kpi.label}</p>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                <kpi.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink-900">Actividad reciente</h2>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">
              Simulado
            </span>
          </div>
          {recentAccess.length === 0 ? (
            <p className="text-sm text-text-muted">Sin accesos todavía.</p>
          ) : (
            <ul className="space-y-3">
              {recentAccess.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <Link
                    to={`/usuarios/${log.userId}`}
                    className="min-w-0 text-sm text-ink-900 hover:text-brand-600"
                  >
                    <p className="truncate font-medium">{userName(log.userId)}</p>
                    <p className="truncate text-xs text-text-muted">
                      {tokenCode(log.tokenId)} ·{' '}
                      {new Date(log.occurredAt).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </Link>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      log.result === 'autorizado'
                        ? 'bg-success-500/10 text-success-500'
                        : 'bg-danger-500/10 text-danger-500'
                    }`}
                  >
                    {log.result === 'autorizado' ? 'Aprobado' : 'No aprobado'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Accesos por zona</h2>
          <div className="space-y-4">
            {zoneCounts.map((z) => (
              <div key={z.zone}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-ink-700">{z.zone}</span>
                  <span className="font-medium text-ink-900">{z.count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${(z.count / maxZoneCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
