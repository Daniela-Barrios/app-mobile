import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAsync } from '../hooks/useAsync'
import { biometricsRepository, usersRepository } from '../repositories'

async function loadUsers() {
  const [users, biometrics] = await Promise.all([
    usersRepository.list(),
    biometricsRepository.list(),
  ])
  return { users, biometrics }
}

export function UsersPage() {
  const { data, loading, error } = useAsync(loadUsers)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    if (!term) return data.users
    return data.users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.documentId.includes(term),
    )
  }, [data, search])

  if (loading) return <p className="text-sm text-text-muted">Cargando usuarios…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { biometrics } = data

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          Usuarios <span className="text-text-muted">({filtered.length})</span>
        </h2>
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
              <th className="px-5 py-2 font-medium">Empresa</th>
              <th className="px-5 py-2 font-medium">Estado</th>
              <th className="px-5 py-2 font-medium">Biometría</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const bio = biometrics.find((b) => b.userId === user.id)
              const isDeleted = Boolean(user.deletedAt)
              return (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-5 py-2.5">
                    <Link
                      to={`/usuarios/${user.id}`}
                      className="flex items-center gap-3 text-ink-900 hover:text-brand-600"
                    >
                      <Avatar name={user.fullName} size="sm" />
                      <span>
                        {user.fullName}
                        {isDeleted && (
                          <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                            eliminado
                          </span>
                        )}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-text-muted">{user.documentId}</td>
                  <td className="px-5 py-2.5 text-text-muted">{user.company ?? '—'}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        user.status === 'activo'
                          ? 'bg-success-500/10 text-success-500'
                          : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-text-muted">
                    {bio ? bio.status : 'sin registro'}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-text-muted">
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
