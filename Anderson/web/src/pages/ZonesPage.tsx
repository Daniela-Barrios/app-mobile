import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ZoneFormModal, type ZoneFormValues } from '../components/ZoneFormModal'
import { useAsync } from '../hooks/useAsync'
import { accessLogsRepository, zonesRepository } from '../repositories'
import { createZone, deactivateZone, reactivateZone, updateZone } from '../services/zoneService'
import type { AccessLog, Zone } from '../types'

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
  const { data, loading, error, reload } = useAsync(loadZonesData)
  const navigate = useNavigate()
  const [showDeleted, setShowDeleted] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Zone | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="text-sm text-text-muted">Cargando zonas…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { zones, accessLogs } = data
  const visibleZones = zones.filter((z) => showDeleted || !z.deletedAt)

  async function handleCreate(values: ZoneFormValues) {
    setBusy(true)
    try {
      await createZone(values)
      setModal(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleEdit(values: ZoneFormValues) {
    if (!editingZone) return
    setBusy(true)
    try {
      await updateZone(editingZone.id, values)
      setModal(null)
      setEditingZone(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    if (!confirmTarget) return
    setBusy(true)
    try {
      if (confirmTarget.deletedAt) await reactivateZone(confirmTarget.id)
      else await deactivateZone(confirmTarget.id)
      setConfirmTarget(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-1.5 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          Mostrar eliminadas
        </label>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          + Nueva zona
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleZones.map((zone) => {
          const present = usersPresentInZone(accessLogs, zone.id)
          const isDeleted = Boolean(zone.deletedAt)
          return (
            <div
              key={zone.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/zonas/${zone.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/zonas/${zone.id}`)
              }}
              className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-brand-600"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {zone.name}
                    {isDeleted && (
                      <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                        eliminada
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">
                    {zone.code} {zone.isRestricted && '· Restringida'}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
                  {present.length} {present.length === 1 ? 'usuario' : 'usuarios'} en zona
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingZone(zone)
                    setModal('edit')
                  }}
                  className="text-brand-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmTarget(zone)
                  }}
                  className={isDeleted ? 'text-brand-600 hover:underline' : 'text-danger-500 hover:underline'}
                >
                  {isDeleted ? 'Reactivar' : 'Desactivar'}
                </button>
              </div>
            </div>
          )
        })}
        {visibleZones.length === 0 && (
          <p className="text-sm text-text-muted">Sin zonas para mostrar.</p>
        )}
      </div>

      {modal === 'create' && (
        <ZoneFormModal
          title="Nueva zona"
          busy={busy}
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal === 'edit' && editingZone && (
        <ZoneFormModal
          title="Editar zona"
          initial={editingZone}
          busy={busy}
          onCancel={() => {
            setModal(null)
            setEditingZone(null)
          }}
          onSubmit={handleEdit}
        />
      )}
      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.deletedAt ? 'Reactivar zona' : 'Desactivar zona'}
          message={
            confirmTarget.deletedAt
              ? `¿Reactivar la zona ${confirmTarget.name}?`
              : `¿Desactivar la zona ${confirmTarget.name}? Es una baja lógica: queda marcada como eliminada, pero su historial se conserva.`
          }
          confirmLabel={confirmTarget.deletedAt ? 'Reactivar' : 'Desactivar'}
          danger={!confirmTarget.deletedAt}
          busy={busy}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleToggleActive}
        />
      )}
    </div>
  )
}
