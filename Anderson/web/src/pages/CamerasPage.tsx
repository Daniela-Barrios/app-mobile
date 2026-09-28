import { useEffect, useState } from 'react'
import { CameraIcon } from '../components/icons'
import { useAsync } from '../hooks/useAsync'
import { camerasRepository, zonesRepository } from '../repositories'
import type { CameraStatus } from '../types'

async function loadCameras() {
  const [zones, cameras] = await Promise.all([
    zonesRepository.list(),
    camerasRepository.list(),
  ])
  return { zones, cameras }
}

const statusStyle: Record<CameraStatus, string> = {
  conectada: 'bg-success-500/10 text-success-500',
  conectando: 'bg-warning-500/10 text-warning-500',
  desconectada: 'bg-surface-muted text-text-muted',
  error: 'bg-danger-500/10 text-danger-500',
}

export function CamerasPage() {
  const { data, loading, error } = useAsync(loadCameras)
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)

  useEffect(() => {
    if (data && !activeZoneId && data.zones.length > 0) {
      setActiveZoneId(data.zones[0].id)
    }
  }, [data, activeZoneId])

  if (loading) return <p className="text-sm text-text-muted">Cargando cámaras…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { zones, cameras } = data
  const camerasInZone = cameras.filter((c) => c.zoneId === activeZoneId)

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex gap-1 overflow-x-auto border-b border-border px-3 pt-3">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => setActiveZoneId(zone.id)}
            className={`shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
              zone.id === activeZoneId
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-text-muted hover:text-ink-900'
            }`}
          >
            {zone.name}
            <span className="ml-1.5 text-xs text-text-muted">
              ({cameras.filter((c) => c.zoneId === zone.id).length})
            </span>
          </button>
        ))}
      </div>

      <div className="p-5">
        {camerasInZone.length === 0 ? (
          <p className="text-sm text-text-muted">Sin cámaras en esta zona.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {camerasInZone.map((camera) => (
              <div key={camera.id} className="rounded-xl border border-border p-3">
                <div className="flex aspect-video items-center justify-center rounded-lg bg-ink-900">
                  <CameraIcon className="h-8 w-8 text-white/30" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-900">{camera.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle[camera.status]}`}
                  >
                    {camera.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {camera.lastSeenAt
                    ? `Última señal: ${new Date(camera.lastSeenAt).toLocaleTimeString('es-CO')}`
                    : 'Sin señal registrada'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
