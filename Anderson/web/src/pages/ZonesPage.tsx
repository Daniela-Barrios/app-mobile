import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAsync } from '../hooks/useAsync'
import { accessLogsRepository, usersRepository, zonesRepository } from '../repositories'
import type { AccessLog } from '../types'

async function loadZonesData() {
  const [zones, accessLogs, users] = await Promise.all([
    zonesRepository.list(),
    accessLogsRepository.list(), // ya viene ordenado por occurredAt desc
    usersRepository.list(),
  ])
  return { zones, accessLogs, users }
}

export function ZonesPage() {
  const { data, loading, error } = useAsync(loadZonesData)
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null)

  if (loading) return <p className="text-sm text-text-muted">Cargando zonas…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { zones, accessLogs, users } = data

  // "Quién está en la zona ahora": el acceso más reciente de cada usuario,
  // si ese acceso fue autorizado en esa zona (heurística de monitoreo — no
  // hay evento de salida todavía).
  const latestByUser = new Map<string, AccessLog>()
  for (const log of accessLogs) {
    if (!latestByUser.has(log.userId)) latestByUser.set(log.userId, log)
  }
  const latestLogs = [...latestByUser.values()]

  const presentInZone = (zoneId: string) =>
    latestLogs.filter((log) => log.zoneId === zoneId && log.result === 'autorizado')

  const rejectedInZone = (zoneId: string) =>
    accessLogs.filter((log) => log.zoneId === zoneId && log.result === 'rechazado').length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => {
        const present = presentInZone(zone.id)
        const rejected = rejectedInZone(zone.id)
        const isOpen = expandedZoneId === zone.id

        return (
          <div key={zone.id} className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setExpandedZoneId(isOpen ? null : zone.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-ink-900">{zone.name}</p>
                <p className="text-xs text-text-muted">
                  {present.length} {present.length === 1 ? 'persona' : 'personas'} en la zona ahora
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-danger-500/10 px-2 py-0.5 text-[11px] font-medium text-danger-500">
                {rejected} rechazados
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-border p-2">
                {present.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-text-muted">
                    Nadie registrado en esta zona en este momento.
                  </p>
                ) : (
                  <ul className="space-y-0.5">
                    {present.map((log) => {
                      const user = users.find((u) => u.id === log.userId)
                      if (!user) return null
                      return (
                        <li key={log.id}>
                          <Link
                            to={`/usuarios/${user.id}`}
                            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-muted"
                          >
                            <Avatar name={user.fullName} size="sm" />
                            <div>
                              <p className="text-sm text-ink-900">{user.fullName}</p>
                              <p className="text-xs text-text-muted">
                                Entrada:{' '}
                                {new Date(log.occurredAt).toLocaleTimeString('es-CO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
