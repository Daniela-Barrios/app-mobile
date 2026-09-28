import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { useAsync } from '../hooks/useAsync'
import { biometricsRepository, usersRepository } from '../repositories'
import type { BiometricStatus } from '../types'

async function loadBiometrics() {
  const [users, biometrics] = await Promise.all([
    usersRepository.list(),
    biometricsRepository.list(),
  ])
  return { users, biometrics }
}

const statusStyle: Record<BiometricStatus, string> = {
  registrada: 'bg-success-500/10 text-success-500',
  pendiente: 'bg-warning-500/10 text-warning-500',
  revocada: 'bg-danger-500/10 text-danger-500',
}

export function BiometricsPage() {
  const { data, loading, error } = useAsync(loadBiometrics)

  if (loading) return <p className="text-sm text-text-muted">Cargando biometría…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { users, biometrics } = data

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-900">
          Biometría <span className="text-text-muted">({biometrics.length})</span>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-5 py-2 font-medium">Usuario</th>
              <th className="px-5 py-2 font-medium">Tipo</th>
              <th className="px-5 py-2 font-medium">Estado</th>
              <th className="px-5 py-2 font-medium">Calidad</th>
              <th className="px-5 py-2 font-medium">Bloqueo</th>
            </tr>
          </thead>
          <tbody>
            {biometrics.map((bio) => {
              const user = users.find((u) => u.id === bio.userId)
              if (!user) return null
              const blocked = bio.blockedGlobally || bio.blockedZoneIds.length > 0
              return (
                <tr key={bio.id} className="border-b border-border last:border-0 hover:bg-surface-muted">
                  <td className="px-5 py-2.5">
                    <Link
                      to={`/biometria/${user.id}`}
                      className="flex items-center gap-3 text-ink-900 hover:text-brand-600"
                    >
                      <Avatar name={user.fullName} size="sm" />
                      {user.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-text-muted capitalize">{bio.biometricType}</td>
                  <td className="px-5 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusStyle[bio.status]}`}>
                      {bio.status}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-text-muted">
                    {bio.qualityScore != null ? `${bio.qualityScore}%` : '—'}
                  </td>
                  <td className="px-5 py-2.5">
                    {blocked ? (
                      <span className="rounded-full bg-danger-500/10 px-2 py-0.5 text-[11px] font-medium text-danger-500">
                        {bio.blockedGlobally ? 'Bloqueado' : `Bloqueado en ${bio.blockedZoneIds.length} zona(s)`}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
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
