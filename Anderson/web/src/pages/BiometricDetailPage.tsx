import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useSetBreadcrumbLabel } from '../lib/breadcrumbContext'
import { useAsync } from '../hooks/useAsync'
import { biometricsRepository, usersRepository, zonesRepository } from '../repositories'
import {
  blockBiometricGlobally,
  setBiometricZoneBlocks,
  unblockBiometricGlobally,
} from '../services/biometricService'

async function loadBiometricDetail(userId: string) {
  const [user, biometricsForUser, zones] = await Promise.all([
    usersRepository.get(userId),
    biometricsRepository.listByUser(userId),
    zonesRepository.list(),
  ])
  return { user, biometric: biometricsForUser[0] ?? null, zones }
}

export function BiometricDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data, loading, error, reload } = useAsync(
    () => loadBiometricDetail(userId as string),
    [userId],
  )
  const [selectedZones, setSelectedZones] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  useSetBreadcrumbLabel(data?.user.fullName ?? null)

  useEffect(() => {
    if (data?.biometric) setSelectedZones(data.biometric.blockedZoneIds)
  }, [data?.biometric])

  if (loading) return <p className="text-sm text-text-muted">Cargando datos biométricos…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { user, biometric, zones } = data

  function toggleZone(zoneId: string) {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId],
    )
  }

  async function toggleGlobalBlock() {
    if (!biometric) return
    setBusy(true)
    try {
      if (biometric.blockedGlobally) await unblockBiometricGlobally(biometric.id)
      else await blockBiometricGlobally(biometric.id)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function applyZoneBlocks() {
    if (!biometric) return
    setBusy(true)
    try {
      await setBiometricZoneBlocks(biometric.id, selectedZones)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/biometria" className="text-xs font-medium text-brand-600 hover:underline">
        ← Volver a biometría
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-1">
          <div className="flex items-center gap-4">
            <Avatar name={user.fullName} size="lg" />
            <div>
              <p className="text-base font-semibold text-ink-900">{user.fullName}</p>
              <p className="text-xs text-text-muted">{user.documentId}</p>
            </div>
          </div>
        </div>

        {!biometric ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-5 lg:col-span-2">
            <p className="text-sm text-text-muted">Este usuario no tiene registro biométrico.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-ink-900">Datos biométricos</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text-muted">Tipo</dt>
                <dd className="text-ink-900 capitalize">{biometric.biometricType}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Estado</dt>
                <dd className="text-ink-900">{biometric.status}</dd>
              </div>
              <div>
                <dt className="text-text-muted">ID biométrico</dt>
                <dd className="font-mono text-ink-900">{biometric.biometricRef ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Calidad de la muestra</dt>
                <dd className="text-ink-900">
                  {biometric.qualityScore != null ? `${biometric.qualityScore}%` : '—'}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-text-muted">Dispositivo de enrolamiento</dt>
                <dd className="text-ink-900">{biometric.device ?? '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {biometric && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-900">Bloqueo de acceso</h3>
          <p className="mb-4 text-xs text-text-muted">
            Restringe el acceso de este usuario de forma general o solo en ciertas zonas.
          </p>

          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm text-ink-900">Bloqueo general</p>
              <p className="text-xs text-text-muted">
                {biometric.blockedGlobally
                  ? 'El usuario no puede acceder a ninguna zona.'
                  : 'Sin bloqueo general.'}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={toggleGlobalBlock}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                biometric.blockedGlobally
                  ? 'border border-border text-ink-700 hover:bg-surface-muted'
                  : 'bg-danger-500 text-white hover:bg-danger-500/90'
              }`}
            >
              {biometric.blockedGlobally ? 'Quitar bloqueo' : 'Bloquear usuario'}
            </button>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 text-sm text-ink-900">Bloqueo por zona</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {zones.map((zone) => (
                <label
                  key={zone.id}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-ink-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedZones.includes(zone.id)}
                    onChange={() => toggleZone(zone.id)}
                  />
                  {zone.name}
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={applyZoneBlocks}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Aplicar bloqueo por zona
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
