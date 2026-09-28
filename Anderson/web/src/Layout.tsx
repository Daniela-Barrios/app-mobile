import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Breadcrumbs } from './components/Breadcrumbs'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useBreadcrumbLabel } from './lib/breadcrumbContext'
import { ROUTE_LABELS } from './lib/routeLabels'

const DETAIL_FALLBACK_TITLES: Record<string, string> = {
  '/usuarios/': 'Detalle de usuario',
  '/biometria/': 'Detalle biométrico',
  '/zonas/': 'Detalle de zona',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const dynamicLabel = useBreadcrumbLabel()

  const detailPrefix = Object.keys(DETAIL_FALLBACK_TITLES).find((prefix) =>
    location.pathname.startsWith(prefix),
  )
  const title = detailPrefix
    ? (dynamicLabel ?? DETAIL_FALLBACK_TITLES[detailPrefix])
    : (ROUTE_LABELS[location.pathname] ?? 'Control de Acceso')

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
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
