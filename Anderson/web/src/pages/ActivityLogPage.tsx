import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAsync } from '../hooks/useAsync'
import { actionsForUser, eventOrigin } from '../lib/activity'
import { latestPhotoByUser } from '../lib/photos'
import {
  accessLogsRepository,
  biometricsRepository,
  eventsRepository,
  photosRepository,
  tokensRepository,
  usersRepository,
} from '../repositories'

async function loadActivityOverview() {
  const [users, events, tokens, biometrics, accessLogs, photos] = await Promise.all([
    usersRepository.list(),
    eventsRepository.list(), // ya viene ordenado por occurredAt desc
    tokensRepository.list(),
    biometricsRepository.list(),
    accessLogsRepository.list(),
    photosRepository.list(),
  ])
  const photoByUser = latestPhotoByUser(photos)

  const rows = users.map((user) => {
    const actions = actionsForUser(user.id, events, { tokens, biometrics, accessLogs })
    const mobileCount = actions.filter((e) => eventOrigin(e) === 'mobile').length
    const dashboardCount = actions.length - mobileCount
    return {
      user,
      photoUrl: photoByUser.get(user.id),
      total: actions.length,
      mobileCount,
      dashboardCount,
      lastAt: actions[0]?.occurredAt ?? null, // events ya viene ordenado desc
    }
  })

  return { rows }
}

export function ActivityLogPage() {
  const { data, loading, error } = useAsync(loadActivityOverview)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    const rows = term
      ? data.rows.filter(
          (r) =>
            r.user.fullName.toLowerCase().includes(term) || r.user.documentId.includes(term),
        )
      : data.rows
    // Usuarios con actividad más reciente primero; sin actividad, al final.
    return [...rows].sort((a, b) => {
      if (!a.lastAt && !b.lastAt) return 0
      if (!a.lastAt) return 1
      if (!b.lastAt) return -1
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    })
  }, [data, search])

  if (loading) return <p className="text-sm text-text-muted">Cargando registro de actividad…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink-900">
            Registro de actividad <span className="text-text-muted">({filtered.length})</span>
          </h2>
          <p className="text-xs text-text-muted">
            Acciones por usuario, tanto las hechas desde la app móvil (biometría, accesos) como
            desde este dashboard (administración).
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o documento…"
          className="w-full rounded-lg border border-border px-3 py-1.5 text-sm text-ink-900 placeholder:text-text-muted focus:border-brand-600 focus:outline-none sm:w-72"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-5 py-2 font-medium">Usuario</th>
              <th className="px-5 py-2 font-medium">Documento</th>
              <th className="px-5 py-2 font-medium">Acciones</th>
              <th className="px-5 py-2 font-medium">App móvil</th>
              <th className="px-5 py-2 font-medium">Dashboard</th>
              <th className="px-5 py-2 font-medium">Última acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ user, photoUrl, total, mobileCount, dashboardCount, lastAt }) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                <td className="px-5 py-2.5">
                  <Link
                    to={`/actividad/${user.id}`}
                    className="flex items-center gap-3 text-ink-900 hover:text-brand-600"
                  >
                    <Avatar name={user.fullName} size="sm" photoUrl={photoUrl} />
                    <span>{user.fullName}</span>
                  </Link>
                </td>
                <td className="px-5 py-2.5 text-text-muted">{user.documentId}</td>
                <td className="px-5 py-2.5 text-ink-900">{total}</td>
                <td className="px-5 py-2.5 text-text-muted">{mobileCount}</td>
                <td className="px-5 py-2.5 text-text-muted">{dashboardCount}</td>
                <td className="px-5 py-2.5 text-text-muted">
                  {lastAt ? new Date(lastAt).toLocaleString('es-CO') : 'Sin actividad'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-text-muted">
                  Sin resultados para "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
