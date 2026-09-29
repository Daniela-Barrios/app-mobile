import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ZoneFormModal, type ZoneFormValues } from '../components/ZoneFormModal'
import { useAsync } from '../hooks/useAsync'
import { useSetBreadcrumbLabel } from '../lib/breadcrumbContext'
import { latestPhotoByUser } from '../lib/photos'
import { elapsedSince, isSameDay } from '../lib/time'
import { accessLogsRepository, photosRepository, usersRepository, zonesRepository } from '../repositories'
import { deactivateZone, reactivateZone, updateZone } from '../services/zoneService'
import { usersPresentInZone } from './ZonesPage'

async function loadZoneDetail(zoneId: string) {
  const [zones, accessLogs, users, photos] = await Promise.all([
    zonesRepository.list(),
    accessLogsRepository.list(), // ya viene ordenado por occurredAt desc
    usersRepository.list(),
    photosRepository.list(),
  ])
  const zone = zones.find((z) => z.id === zoneId) ?? null
  return { zone, accessLogs, users, photoByUser: latestPhotoByUser(photos) }
}

export function ZoneDetailPage() {
  const { zoneId } = useParams<{ zoneId: string }>()
  const { data, loading, error, reload } = useAsync(() => loadZoneDetail(zoneId as string), [zoneId])
  useSetBreadcrumbLabel(data?.zone?.name ?? null)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="text-sm text-text-muted">Cargando zona…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data || !data.zone) return <p className="text-sm text-danger-500">Zona no encontrada.</p>

  const { zone, accessLogs, users, photoByUser } = data

  async function handleEdit(values: ZoneFormValues) {
    setBusy(true)
    try {
      await updateZone(zone.id, values)
      setEditing(false)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    setBusy(true)
    try {
      if (zone.deletedAt) await reactivateZone(zone.id)
      else await deactivateZone(zone.id)
      setConfirming(false)
      reload()
    } finally {
      setBusy(false)
    }
  }
  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id

  // "Ahora mismo": el acceso más reciente de cada usuario, si fue autorizado en esta zona.
  const latestByUser = new Map<string, (typeof accessLogs)[number]>()
  for (const log of accessLogs) {
    if (!latestByUser.has(log.userId)) latestByUser.set(log.userId, log)
  }
  const present = usersPresentInZone(accessLogs, zone.id).sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  )

  // "Hoy": mismo día calendario que el evento más reciente del dataset (referencia estable para la demo).
  const referenceDay = accessLogs[0]?.occurredAt ?? new Date().toISOString()
  const entriesToday = accessLogs.filter(
    (log) => log.zoneId === zone.id && log.result === 'autorizado' && isSameDay(log.occurredAt, referenceDay),
  )
  // "Salió": entró hoy a esta zona, pero su acceso más reciente en todo el sistema ya es a otra zona
  // (no hay evento de salida explícito todavía — esto es la mejor aproximación de monitoreo).
  const leftTodayUserIds = new Set(
    entriesToday
      .filter((log) => latestByUser.get(log.userId)?.zoneId !== zone.id)
      .map((log) => log.userId),
  )
  const leftToday = [...leftTodayUserIds].map((userId) => ({
    userId,
    lastSeenHere: entriesToday.filter((l) => l.userId === userId).slice(-1)[0],
    movedTo: latestByUser.get(userId),
  }))

  return (
    <div className="space-y-6">
      <Link to="/zonas" className="text-xs font-medium text-brand-600 hover:underline">
        ← Volver a zonas
      </Link>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="text-base font-semibold text-ink-900">
            {zone.name}
            {zone.deletedAt && (
              <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                eliminada
              </span>
            )}
          </p>
          <p className="text-xs text-text-muted">
            {zone.code} {zone.isRestricted && '· Zona restringida'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600">
            {present.length} en zona ahora
          </span>
          <div className="flex items-center gap-3 text-xs font-medium">
            <button type="button" onClick={() => setEditing(true)} className="text-brand-600 hover:underline">
              Editar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={zone.deletedAt ? 'text-brand-600 hover:underline' : 'text-danger-500 hover:underline'}
            >
              {zone.deletedAt ? 'Reactivar' : 'Desactivar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-muted">Usuarios en zona</p>
          <p className="mt-2 text-2xl font-semibold text-ink-900">{present.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-muted">Entradas hoy</p>
          <p className="mt-2 text-2xl font-semibold text-success-500">{entriesToday.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-text-muted">Salieron hoy</p>
          <p className="mt-2 text-2xl font-semibold text-ink-700">{leftToday.length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Usuarios en la zona</h3>
        {present.length === 0 ? (
          <p className="text-sm text-text-muted">Nadie registrado en esta zona en este momento.</p>
        ) : (
          <ul className="divide-y divide-border">
            {present.map((log) => (
              <li key={log.id}>
                <Link
                  to={`/usuarios/${log.userId}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:text-brand-600"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={userName(log.userId)} size="sm" photoUrl={photoByUser.get(log.userId)} />
                    <p className="text-sm text-ink-900">{userName(log.userId)}</p>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <p>
                      Entrada:{' '}
                      {new Date(log.occurredAt).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p>Hace {elapsedSince(log.occurredAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">
            Entradas de hoy <span className="text-text-muted">({entriesToday.length})</span>
          </h3>
          {entriesToday.length === 0 ? (
            <p className="text-sm text-text-muted">Sin entradas registradas hoy.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {entriesToday.map((log) => (
                <li key={log.id} className="flex items-center justify-between">
                  <Link to={`/usuarios/${log.userId}`} className="text-ink-900 hover:text-brand-600">
                    {userName(log.userId)}
                  </Link>
                  <span className="text-xs text-text-muted">
                    {new Date(log.occurredAt).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">
            Salieron hoy <span className="text-text-muted">({leftToday.length})</span>
          </h3>
          <p className="mb-3 text-xs text-text-muted">
            Estimado: entraron a esta zona y su acceso más reciente ya es en otra (aún no hay evento de salida explícito).
          </p>
          {leftToday.length === 0 ? (
            <p className="text-sm text-text-muted">Nadie ha salido registrado hoy.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {leftToday.map(({ userId, movedTo }) => (
                <li key={userId} className="flex items-center justify-between">
                  <Link to={`/usuarios/${userId}`} className="text-ink-900 hover:text-brand-600">
                    {userName(userId)}
                  </Link>
                  <span className="text-xs text-text-muted">
                    {movedTo
                      ? new Date(movedTo.occurredAt).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editing && (
        <ZoneFormModal
          title="Editar zona"
          initial={zone}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title={zone.deletedAt ? 'Reactivar zona' : 'Desactivar zona'}
          message={
            zone.deletedAt
              ? `¿Reactivar la zona ${zone.name}?`
              : `¿Desactivar la zona ${zone.name}? Es una baja lógica: queda marcada como eliminada, pero su historial se conserva.`
          }
          confirmLabel={zone.deletedAt ? 'Reactivar' : 'Desactivar'}
          danger={!zone.deletedAt}
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={handleToggleActive}
        />
      )}
    </div>
  )
}
