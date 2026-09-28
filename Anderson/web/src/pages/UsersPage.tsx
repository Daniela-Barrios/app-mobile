import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { UserFormModal, type UserFormValues } from '../components/UserFormModal'
import { useAsync } from '../hooks/useAsync'
import { biometricsRepository, usersRepository } from '../repositories'
import { createUser, deactivateUser, reactivateUser, updateUser } from '../services/userService'
import type { User } from '../types'

async function loadUsers() {
  const [users, biometrics] = await Promise.all([
    usersRepository.list(),
    biometricsRepository.list(),
  ])
  return { users, biometrics }
}

export function UsersPage() {
  const { data, loading, error, reload } = useAsync(loadUsers)
  const [search, setSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<User | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    if (!data) return []
    const term = search.trim().toLowerCase()
    return data.users
      .filter((u) => showDeleted || !u.deletedAt)
      .filter(
        (u) =>
          !term ||
          u.fullName.toLowerCase().includes(term) ||
          u.documentId.includes(term),
      )
  }, [data, search, showDeleted])

  if (loading) return <p className="text-sm text-text-muted">Cargando usuarios…</p>
  if (error) return <p className="text-sm text-danger-500">Error: {error}</p>
  if (!data) return null

  const { biometrics } = data

  async function handleCreate(values: UserFormValues) {
    setBusy(true)
    try {
      await createUser(values)
      setModal(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleEdit(values: UserFormValues) {
    if (!editingUser) return
    setBusy(true)
    try {
      await updateUser(editingUser.id, values)
      setModal(null)
      setEditingUser(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    if (!confirmTarget) return
    setBusy(true)
    try {
      if (confirmTarget.deletedAt) await reactivateUser(confirmTarget.id)
      else await deactivateUser(confirmTarget.id)
      setConfirmTarget(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-ink-900">
          Usuarios <span className="text-text-muted">({filtered.length})</span>
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-1.5 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Mostrar eliminados
          </label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o documento…"
            className="w-full rounded-lg border border-border px-3 py-1.5 text-sm text-ink-900 placeholder:text-text-muted focus:border-brand-600 focus:outline-none sm:w-64"
          />
          <button
            type="button"
            onClick={() => setModal('create')}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            + Nuevo usuario
          </button>
        </div>
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
              <th className="px-5 py-2 font-medium">Acciones</th>
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
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(user)
                          setModal('edit')
                        }}
                        className="text-brand-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmTarget(user)}
                        className={isDeleted ? 'text-brand-600 hover:underline' : 'text-danger-500 hover:underline'}
                      >
                        {isDeleted ? 'Reactivar' : 'Desactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
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

      {modal === 'create' && (
        <UserFormModal
          title="Nuevo usuario"
          busy={busy}
          onCancel={() => setModal(null)}
          onSubmit={handleCreate}
        />
      )}
      {modal === 'edit' && editingUser && (
        <UserFormModal
          title="Editar usuario"
          initial={editingUser}
          busy={busy}
          onCancel={() => {
            setModal(null)
            setEditingUser(null)
          }}
          onSubmit={handleEdit}
        />
      )}
      {confirmTarget && (
        <ConfirmDialog
          title={confirmTarget.deletedAt ? 'Reactivar usuario' : 'Desactivar usuario'}
          message={
            confirmTarget.deletedAt
              ? `¿Reactivar a ${confirmTarget.fullName}? Volverá a aparecer como usuario activo.`
              : `¿Desactivar a ${confirmTarget.fullName}? Es una baja lógica: queda marcado como eliminado, pero su historial se conserva.`
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
