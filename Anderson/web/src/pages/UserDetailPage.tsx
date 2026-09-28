import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { UserFormModal, type UserFormValues } from '../components/UserFormModal'
import { useSetBreadcrumbLabel } from '../lib/breadcrumbContext'
import { TONE_DOT_CLASS, describeEvent } from '../lib/describeEvent'
import { useAsync } from '../hooks/useAsync'
import {
  accessLogsRepository,
  biometricsRepository,
  eventsRepository,
  tokensRepository,
  usersRepository,
  zonesRepository,
} from '../repositories'
import { deactivateUser, reactivateUser, updateUser } from '../services/userService'

async function loadUserDetail(userId: string) {
  const [user, biometrics, accessLogs, tokens, zones, events] = await Promise.all([
    usersRepository.get(userId),
    biometricsRepository.listByUser(userId),
    accessLogsRepository.listByUser(userId),
    tokensRepository.listByUser(userId),
    zonesRepository.list(),
    eventsRepository.list(),
  ])
  const tokenIds = new Set(tokens.map((t) => t.id))
  const actions = events.filter(
    (e) =>
      e.entityId === userId ||
      (e.entityType === 'token' && tokenIds.has(e.entityId)) ||
      (typeof e.payload?.userId === 'string' && e.payload.userId === userId),
  )
  return { user, biometrics, accessLogs, tokens, zones, actions }
}

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data, loading, error, reload } = useAsync(
    () => loadUserDetail(userId as string),
    [userId],
  )
  useSetBreadcrumbLabel(data?.user.fullName ?? null)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <p className="text-sm text-text-muted">Cargando usuario…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { user, biometrics, accessLogs, tokens, zones, actions } = data
  const bio = biometrics[0]
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id

  const granted = accessLogs.filter((l) => l.result === 'autorizado').length
  const denied = accessLogs.filter((l) => l.result === 'rechazado').length

  async function handleEdit(values: UserFormValues) {
    setBusy(true)
    try {
      await updateUser(user.id, values)
      setEditing(false)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    setBusy(true)
    try {
      if (user.deletedAt) await reactivateUser(user.id)
      else await deactivateUser(user.id)
      setConfirming(false)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/usuarios" className="text-xs font-medium text-brand-600 hover:underline">
        ← Volver a usuarios
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Ficha del usuario */}
        <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <Avatar name={user.fullName} size="lg" />
              <div>
                <p className="text-base font-semibold text-ink-900">{user.fullName}</p>
                <p className="text-xs text-text-muted">{user.documentId}</p>
                {user.deletedAt && (
                  <span className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                    eliminado
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 text-xs font-medium">
              <button type="button" onClick={() => setEditing(true)} className="text-brand-600 hover:underline">
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={user.deletedAt ? 'text-brand-600 hover:underline' : 'text-danger-500 hover:underline'}
              >
                {user.deletedAt ? 'Reactivar' : 'Desactivar'}
              </button>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Estado</dt>
              <dd>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    user.status === 'activo'
                      ? 'bg-success-500/10 text-success-500'
                      : 'bg-surface-muted text-text-muted'
                  }`}
                >
                  {user.status}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Biometría</dt>
              <dd className="text-ink-900">{bio ? bio.status : 'sin registro'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Empresa</dt>
              <dd className="text-ink-900">{user.company ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Teléfono</dt>
              <dd className="text-ink-900">{user.phone ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Registrado</dt>
              <dd className="text-ink-900">
                {new Date(user.createdAt).toLocaleDateString('es-CO')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Resumen de uso */}
        <div className="grid grid-cols-2 gap-4 content-start lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-text-muted">Accesos autorizados</p>
            <p className="mt-2 text-2xl font-semibold text-success-500">{granted}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium text-text-muted">Accesos rechazados</p>
            <p className="mt-2 text-2xl font-semibold text-danger-500">{denied}</p>
          </div>

          <div className="col-span-2 rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">
              Últimos accesos (uso de token por zona)
            </h3>
            {accessLogs.length === 0 ? (
              <p className="text-sm text-text-muted">Sin registros todavía.</p>
            ) : (
              <ul className="divide-y divide-border">
                {accessLogs.slice(0, 6).map((log) => (
                  <li key={log.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="text-ink-900">{zoneName(log.zoneId)}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(log.occurredAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        log.result === 'autorizado'
                          ? 'bg-success-500/10 text-success-500'
                          : 'bg-danger-500/10 text-danger-500'
                      }`}
                    >
                      {log.result}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Trazas / acciones */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink-900">Acciones y trazas</h3>
        {actions.length === 0 ? (
          <p className="text-sm text-text-muted">Sin actividad registrada.</p>
        ) : (
          <ul className="space-y-3">
            {actions.slice(0, 12).map((event) => {
              const { label, detail, tone } = describeEvent(event, { zones, tokens })
              return (
                <li key={event.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASS[tone]}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-ink-900">{label}</p>
                      <span className="shrink-0 text-xs text-text-muted">
                        {new Date(event.occurredAt).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">{detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editing && (
        <UserFormModal
          title="Editar usuario"
          initial={user}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={handleEdit}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title={user.deletedAt ? 'Reactivar usuario' : 'Desactivar usuario'}
          message={
            user.deletedAt
              ? `¿Reactivar a ${user.fullName}? Volverá a aparecer como usuario activo.`
              : `¿Desactivar a ${user.fullName}? Es una baja lógica: queda marcado como eliminado, pero su historial se conserva.`
          }
          confirmLabel={user.deletedAt ? 'Reactivar' : 'Desactivar'}
          danger={!user.deletedAt}
          busy={busy}
          onCancel={() => setConfirming(false)}
          onConfirm={handleToggleActive}
        />
      )}
    </div>
  )
}
