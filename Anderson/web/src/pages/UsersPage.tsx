import { Link } from 'react-router-dom'
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

  if (loading) return <p className="text-sm text-text-muted">Cargando usuarios…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { users, biometrics } = data

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-900">
          Usuarios <span className="text-text-muted">({users.length})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-5 py-2 font-medium">Nombre</th>
              <th className="px-5 py-2 font-medium">Documento</th>
              <th className="px-5 py-2 font-medium">Estado</th>
              <th className="px-5 py-2 font-medium">Biometría</th>
              <th className="px-5 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const bio = biometrics.find((b) => b.userId === user.id)
              const isDeleted = Boolean(user.deletedAt)
              return (
                <tr key={user.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 text-ink-900">
                    {user.fullName}
                    {isDeleted && (
                      <span className="ml-2 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted">
                        eliminado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-text-muted">{user.documentId}</td>
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
                  <td className="px-5 py-2.5 text-right">
                    {user.status === 'activo' && !isDeleted && (
                      <Link
                        to={`/tokens?userId=${user.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Generar token →
                      </Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
