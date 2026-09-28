import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAsync } from '../hooks/useAsync'
import { tokensRepository, usersRepository, zonesRepository } from '../repositories'
import { TokenRuleError, issueToken, revokeToken, validateTokenAgainstBiometric } from '../services/tokenService'

async function loadTokens() {
  const [tokens, users, zones] = await Promise.all([
    tokensRepository.list(),
    usersRepository.list(),
    zonesRepository.list(),
  ])
  return { tokens, users, zones }
}

export function TokensPage() {
  const { data, loading, error, reload } = useAsync(loadTokens)
  const [searchParams, setSearchParams] = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)
  const [busyTokenId, setBusyTokenId] = useState<string | null>(null)
  const [busyGenerate, setBusyGenerate] = useState(false)

  const preselectedUserId = searchParams.get('userId') ?? ''

  if (loading) return <p className="text-sm text-text-muted">Cargando tokens…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { tokens, users, zones } = data
  const activeUsers = users.filter((u) => u.status === 'activo' && !u.deletedAt)

  async function handleGenerate(formData: FormData) {
    const userId = String(formData.get('userId') ?? '')
    const zoneId = String(formData.get('zoneId') ?? '')
    if (!userId || !zoneId) return
    setFormError(null)
    setBusyGenerate(true)
    try {
      await issueToken(userId, zoneId)
      setSearchParams({})
      reload()
    } catch (err) {
      setFormError(err instanceof TokenRuleError ? err.message : 'No se pudo generar el token.')
    } finally {
      setBusyGenerate(false)
    }
  }

  async function handleValidate(tokenId: string, zoneId: string) {
    setBusyTokenId(tokenId)
    try {
      const outcome = await validateTokenAgainstBiometric(tokenId, zoneId)
      if (!outcome.granted) {
        setFormError(
          outcome.reason === 'wrong_zone'
            ? 'Rechazado: el token pertenece a otra zona.'
            : 'Rechazado: el token ya no está activo.',
        )
      } else {
        setFormError(null)
      }
      reload()
    } finally {
      setBusyTokenId(null)
    }
  }

  async function handleRevoke(tokenId: string) {
    setBusyTokenId(tokenId)
    try {
      await revokeToken(tokenId)
      reload()
    } catch (err) {
      setFormError(err instanceof TokenRuleError ? err.message : 'No se pudo revocar el token.')
    } finally {
      setBusyTokenId(null)
    }
  }

  const userName = (id: string) => users.find((u) => u.id === id)?.fullName ?? id
  const zoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink-900">Generar token</h2>
        <form
          action={handleGenerate}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-ink-700">Usuario</label>
            <select
              name="userId"
              defaultValue={preselectedUserId}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink-900 focus:border-brand-600 focus:outline-none"
            >
              <option value="" disabled>
                Selecciona un usuario
              </option>
              {activeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-ink-700">Zona</label>
            <select
              name="zoneId"
              defaultValue={zones[0]?.id ?? ''}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink-900 focus:border-brand-600 focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={busyGenerate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busyGenerate ? 'Generando…' : 'Generar token'}
          </button>
        </form>
        {formError && <p className="mt-3 text-sm text-danger-500">{formError}</p>}
      </div>

      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">
            Tokens <span className="text-text-muted">({tokens.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-muted">
                <th className="px-5 py-2 font-medium">Código</th>
                <th className="px-5 py-2 font-medium">Usuario</th>
                <th className="px-5 py-2 font-medium">Zona</th>
                <th className="px-5 py-2 font-medium">Estado</th>
                <th className="px-5 py-2 font-medium">Emitido</th>
                <th className="px-5 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2.5 font-mono text-xs text-ink-900">{token.code}</td>
                  <td className="px-5 py-2.5 text-ink-900">{userName(token.userId)}</td>
                  <td className="px-5 py-2.5 text-text-muted">{zoneName(token.zoneId)}</td>
                  <td className="px-5 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        token.status === 'activo'
                          ? 'bg-success-500/10 text-success-500'
                          : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      {token.status}
                      {token.invalidatedReason ? ` · ${token.invalidatedReason}` : ''}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-text-muted">
                    {new Date(token.issuedAt).toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    {token.status === 'activo' && (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          disabled={busyTokenId === token.id}
                          onClick={() => handleValidate(token.id, token.zoneId)}
                          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                        >
                          Validar biometría
                        </button>
                        <button
                          type="button"
                          disabled={busyTokenId === token.id}
                          onClick={() => handleRevoke(token.id)}
                          className="text-xs font-medium text-danger-500 hover:underline disabled:opacity-50"
                        >
                          Revocar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
