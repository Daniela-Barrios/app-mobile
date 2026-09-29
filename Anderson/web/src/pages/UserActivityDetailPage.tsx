import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAsync } from '../hooks/useAsync'
import { ORIGIN_BADGE_CLASS, ORIGIN_LABEL, actionsForUser, eventOrigin, type ActivityOrigin } from '../lib/activity'
import { useSetBreadcrumbLabel } from '../lib/breadcrumbContext'
import { TONE_DOT_CLASS, describeEvent } from '../lib/describeEvent'
import {
  accessLogsRepository,
  biometricsRepository,
  eventsRepository,
  photosRepository,
  tokensRepository,
  usersRepository,
  zonesRepository,
} from '../repositories'

async function loadUserActivity(userId: string) {
  const [user, events, tokens, biometrics, accessLogs, zones, photos] = await Promise.all([
    usersRepository.get(userId),
    eventsRepository.list(), // ya viene ordenado por occurredAt desc
    tokensRepository.listByUser(userId),
    biometricsRepository.listByUser(userId),
    accessLogsRepository.listByUser(userId),
    zonesRepository.list(),
    photosRepository.listByUser(userId),
  ])
  const actions = actionsForUser(userId, events, { tokens, biometrics, accessLogs })
  return { user, actions, tokens, zones, photoUrl: photos[0]?.url ?? null }
}

const ORIGIN_FILTERS: Array<{ value: ActivityOrigin | ''; label: string }> = [
  { value: '', label: 'Todo el origen' },
  { value: 'mobile', label: ORIGIN_LABEL.mobile },
  { value: 'dashboard', label: ORIGIN_LABEL.dashboard },
]

export function UserActivityDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { data, loading, error } = useAsync(() => loadUserActivity(userId as string), [userId])
  useSetBreadcrumbLabel(data?.user.fullName ?? null)
  const [originFilter, setOriginFilter] = useState<ActivityOrigin | ''>('')

  if (loading) return <p className="text-sm text-text-muted">Cargando actividad…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { user, actions, tokens, zones, photoUrl } = data
  const filtered = originFilter ? actions.filter((e) => eventOrigin(e) === originFilter) : actions

  return (
    <div className="space-y-6">
      <Link to="/actividad" className="text-xs font-medium text-brand-600 hover:underline">
        ← Volver a registro de actividad
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} size="lg" photoUrl={photoUrl} />
          <div>
            <p className="text-base font-semibold text-ink-900">{user.fullName}</p>
            <p className="text-xs text-text-muted">{user.documentId}</p>
          </div>
        </div>
        <Link
          to={`/usuarios/${user.id}`}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Ver ficha del usuario →
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-ink-900">
            Acciones <span className="text-text-muted">({filtered.length})</span>
          </h3>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {ORIGIN_FILTERS.map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                onClick={() => setOriginFilter(f.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  originFilter === f.value
                    ? 'bg-brand-600 text-white'
                    : 'text-text-muted hover:text-ink-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted">
            {actions.length === 0
              ? 'Este usuario todavía no tiene actividad registrada.'
              : 'Sin acciones con este origen.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((event) => {
              const { label, detail, tone } = describeEvent(event, { zones, tokens })
              const origin = eventOrigin(event)
              return (
                <li
                  key={event.id}
                  className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASS[tone]}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink-900">{label}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ORIGIN_BADGE_CLASS[origin]}`}
                        >
                          {ORIGIN_LABEL[origin]}
                        </span>
                      </div>
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
    </div>
  )
}
