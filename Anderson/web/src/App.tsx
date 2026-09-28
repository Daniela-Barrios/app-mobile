import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import {
  ActivityIcon,
  FingerprintIcon,
  KeyIcon,
  UsersIcon,
} from './components/icons'

const kpis = [
  { label: 'Usuarios activos', value: '230', icon: UsersIcon },
  { label: 'Tokens activos', value: '8', icon: KeyIcon },
  { label: 'Biometrías registradas', value: '35', icon: FingerprintIcon },
  { label: 'Eventos hoy', value: '125', icon: ActivityIcon },
]

const zoneAccess = [
  { zone: 'Ingreso Principal', count: 21, max: 45 },
  { zone: 'Lobby', count: 15, max: 45 },
  { zone: 'Área Restringida', count: 9, max: 45 },
]

const recentActivity = [
  { time: '10:37', text: 'Biometría registrada — Camilo Torres', tone: 'info' as const },
  { time: '10:35', text: 'Acceso autorizado — Lobby', tone: 'success' as const },
  { time: '10:33', text: 'Token TK-014 revocado manualmente', tone: 'warning' as const },
  { time: '10:31', text: 'Usuario registrado — Valentina Diaz', tone: 'info' as const },
  { time: '10:28', text: 'Acceso rechazado — token inválido', tone: 'danger' as const },
]

const toneDot: Record<string, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-brand-600',
}

function App() {
  const [activeNav, setActiveNav] = useState('resumen')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-surface-muted">
      <Sidebar
        activeId={activeNav}
        onSelect={(id) => {
          setActiveNav(id)
          setSidebarOpen(false)
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title="Resumen"
          subtitle="Bodegas Panamericana · Datos simulados"
          onOpenMenu={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* KPIs */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-muted">
                    {kpi.label}
                  </p>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                    <kpi.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold text-ink-900">
                  {kpi.value}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Actividad reciente */}
            <div className="rounded-xl border border-border bg-surface p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-900">
                  Actividad reciente
                </h2>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">
                  Simulado
                </span>
              </div>
              <ul className="space-y-4">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[item.tone]}`}
                    />
                    <div className="flex flex-1 items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <p className="text-sm text-ink-900">{item.text}</p>
                      <span className="shrink-0 text-xs text-text-muted">
                        {item.time}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Accesos por zona */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-4 text-sm font-semibold text-ink-900">
                Accesos por zona
              </h2>
              <div className="space-y-4">
                {zoneAccess.map((z) => (
                  <div key={z.zone}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-ink-700">{z.zone}</span>
                      <span className="font-medium text-ink-900">
                        {z.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-brand-600"
                        style={{ width: `${(z.count / z.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
