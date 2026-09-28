import { Link } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { accessLogsRepository, zonesRepository } from '../repositories'
import type { AccessLog } from '../types'

async function loadZonesData() {
  const [zones, accessLogs] = await Promise.all([
    zonesRepository.list(),
    accessLogsRepository.list(), // ya viene ordenado por occurredAt desc
  ])
  return { zones, accessLogs }
}

/** "Presente ahora": el acceso más reciente del usuario fue autorizado en esa zona (no hay evento de salida todavía). */
export function usersPresentInZone(accessLogs: AccessLog[], zoneId: string): AccessLog[] {
  const latestByUser = new Map<string, AccessLog>()
  for (const log of accessLogs) {
    if (!latestByUser.has(log.userId)) latestByUser.set(log.userId, log)
  }
  return [...latestByUser.values()].filter((log) => log.zoneId === zoneId && log.result === 'autorizado')
}

export function ZonesPage() {
  const { data, loading, error } = useAsync(loadZonesData)

  if (loading) return <p className="text-sm text-text-muted">Cargando zonas…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { zones, accessLogs } = data

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => {
        const present = usersPresentInZone(accessLogs, zone.id)
        return (
          <Link
            key={zone.id}
            to={`/zonas/${zone.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-brand-600"
          >
            <div>
              <p className="text-sm font-semibold text-ink-900">{zone.name}</p>
              <p className="text-xs text-text-muted">{zone.code}</p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
              {present.length} {present.length === 1 ? 'usuario' : 'usuarios'} en zona
            </span>
          </Link>
        )
      })}
    </div>
  )
}
