import type { ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ActivityIcon,
  CameraIcon,
  CloseIcon,
  FingerprintIcon,
  HeadsetIcon,
  HomeIcon,
  KeyIcon,
  ListIcon,
  MapPinIcon,
  PlugIcon,
  SettingsIcon,
  UsersIcon,
} from './icons'

export type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'General',
    items: [{ to: '/resumen', label: 'Resumen', icon: HomeIcon }],
  },
  {
    title: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: UsersIcon },
      { to: '/biometria', label: 'Biometría', icon: FingerprintIcon },
      { to: '/tokens', label: 'Tokens', icon: KeyIcon },
      { to: '/accesos', label: 'Registros de acceso', icon: ListIcon },
      { to: '/zonas', label: 'Zonas', icon: MapPinIcon },
      { to: '/camaras', label: 'Cámaras', icon: CameraIcon },
    ],
  },
  {
    title: 'Monitoreo',
    items: [
      { to: '/eventos', label: 'Eventos / Auditoría', icon: ActivityIcon },
      { to: '/vigilante', label: 'Vigilante virtual', icon: HeadsetIcon },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/fase-a', label: 'Fase A (preparación)', icon: PlugIcon },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
    ],
  },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay en mobile cuando el sidebar está abierto */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink-900/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-900 transition-transform duration-200 ease-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              CA
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">
                Control de Acceso
              </p>
              <p className="text-[11px] text-ink-400">Fase 0 · Maqueta</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-md p-1 text-ink-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                            isActive
                              ? 'bg-brand-600 text-white font-medium'
                              : 'text-ink-400 hover:bg-white/5 hover:text-white'
                          }`
                        }
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-2 text-xs text-ink-400">
            <span className="h-2 w-2 rounded-full bg-success-500" />
            Sistema operativo
          </div>
        </div>
      </aside>
    </>
  )
}
