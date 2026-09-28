import { useEffect, useState } from 'react'
import { CameraFormModal, type CameraFormValues } from '../components/CameraFormModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CameraIcon } from '../components/icons'
import { useAsync } from '../hooks/useAsync'
import { camerasRepository, zonesRepository } from '../repositories'
import { createCamera, deactivateCamera, reactivateCamera, updateCamera } from '../services/cameraService'
import type { Camera, CameraStatus } from '../types'

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
  const { data, loading, error, reload } = useAsync(loadCameras)
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Camera | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data && !activeZoneId && data.zones.length > 0) {
      setActiveZoneId(data.zones[0].id)
    }
  }, [data, activeZoneId])

  if (loading) return <p className="text-sm text-text-muted">Cargando cámaras…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { zones, cameras } = data
  const camerasInZone = cameras
    .filter((c) => c.zoneId === activeZoneId)
    .filter((c) => showDeleted || !c.deletedAt)

  async function handleCreate(values: CameraFormValues) {
    setBusy(true)
    try {
      await createCamera(values)
      setModal(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleEdit(values: CameraFormValues) {
    if (!editingCamera) return
    setBusy(true)
    try {
      await updateCamera(editingCamera.id, values)
      setModal(null)
      setEditingCamera(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    if (!confirmTarget) return
    setBusy(true)
    try {
      if (confirmTarget.deletedAt) await reactivateCamera(confirmTarget.id)
      else await deactivateCamera(confirmTarget.id)
      setConfirmTarget(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-2 border-b border-border px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
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
                ({cameras.filter((c) => c.zoneId === zone.id && !c.deletedAt).length})
              </span>
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3 pb-2 sm:pb-3">
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
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            + Nueva cámara
          </button>
        </div>
      </div>

      <div className="p-5">
        {camerasInZone.length === 0 ? (
          <p className="text-sm text-text-muted">Sin cámaras en esta zona.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {camerasInZone.map((camera) => {
              const isDeleted = Boolean(camera.deletedAt)
              return (
                <div key={camera.id} className="rounded-xl border border-border p-3">
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-ink-900">
                    <CameraIcon className="h-8 w-8 text-white/30" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">
                      {camera.name}
                      {isDeleted && (
                        <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                          eliminada
                        </span>
                      )}
                    </p>
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
                  <div className="mt-3 flex items-center gap-3 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCamera(camera)
                        setModal('edit')
                      }}
                      className="text-brand-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget(camera)}
                      className={isDeleted ? 'text-brand-600 hover:underline' : 'text-danger-500 hover:underline'}
                    >
                      {isDeleted ? 'Reactivar' : 'Desactivar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal === 'create' && (
        <CameraFormModal
          title="Nueva cámara"
          zones={zones}
          defaultZoneId={activeZoneId ?? undefined}
          busy={busy}
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal === 'edit' && editingCamera && (
        <CameraFormModal
          title="Editar cámara"
          zones={zones}
          initial={editingCamera}
          busy={busy}
          onCancel={() => {
            setModal(null)
            setEditingCamera(null)
          }}
          onSubmit={handleEdit}
        />
      )}
      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.deletedAt ? 'Reactivar cámara' : 'Desactivar cámara'}
          message={
            confirmTarget.deletedAt
              ? `¿Reactivar la cámara ${confirmTarget.name}?`
              : `¿Desactivar la cámara ${confirmTarget.name}? Es una baja lógica: queda marcada como eliminada, pero su historial se conserva.`
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
