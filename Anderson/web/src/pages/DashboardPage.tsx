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

const toneDot: Record<string, string> = {
  info: 'bg-brand-600',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

async function loadDashboard() {
  const [users, tokens, biometrics, events, accessLogs, zones] = await Promise.all([
    usersRepository.list(),
    tokensRepository.list(),
    biometricsRepository.list(),
    eventsRepository.list(),
    accessLogsRepository.list(),
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

  const recent = events.slice(0, 8)

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
          {recent.length === 0 ? (
            <p className="text-sm text-text-muted">Sin eventos todavía.</p>
          ) : (
            <ul className="space-y-4">
              {recent.map((event) => (
                <li key={event.id} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[event.severity] ?? toneDot.info}`} />
                  <div className="flex flex-1 items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="text-sm text-ink-900">{event.type}</p>
                    <span className="shrink-0 text-xs text-text-muted">
                      {new Date(event.occurredAt).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
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
