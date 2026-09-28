import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'

const PAGE_TITLES: Record<string, string> = {
  '/resumen': 'Resumen',
  '/usuarios': 'Usuarios',
  '/biometria': 'Biometría',
  '/accesos': 'Accesos',
  '/zonas': 'Zonas',
  '/camaras': 'Cámaras',
  '/eventos': 'Eventos / Auditoría',
  '/vigilante': 'Vigilante virtual',
  '/fase-a': 'Fase A (preparación)',
  '/configuracion': 'Configuración',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = location.pathname.startsWith('/usuarios/')
    ? 'Detalle de usuario'
    : (PAGE_TITLES[location.pathname] ?? 'Control de Acceso')

  return (
    <div className="flex h-screen bg-surface-muted">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          subtitle="Bodegas Panamericana · Datos simulados"
          onOpenMenu={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
