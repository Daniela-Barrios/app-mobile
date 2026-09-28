import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { Layout } from './Layout.tsx'
import { AccessLogsPage } from './pages/AccessLogsPage.tsx'
import { CamerasPage } from './pages/CamerasPage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { GuardPage } from './pages/GuardPage.tsx'
import { PlaceholderPage } from './pages/PlaceholderPage.tsx'
import { UserDetailPage } from './pages/UserDetailPage.tsx'
import { UsersPage } from './pages/UsersPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/resumen" replace />} />
          <Route path="resumen" element={<DashboardPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="usuarios/:userId" element={<UserDetailPage />} />
          <Route
            path="biometria"
            element={<PlaceholderPage title="Biometría" />}
          />
          <Route path="accesos" element={<AccessLogsPage />} />
          <Route path="zonas" element={<PlaceholderPage title="Zonas" />} />
          <Route path="camaras" element={<CamerasPage />} />
          {/* Oculto del sidebar por ahora (ver components/Sidebar.tsx), pero
              se dejan las rutas vivas por si se reactiva el grupo Monitoreo. */}
          <Route
            path="eventos"
            element={<PlaceholderPage title="Eventos / Auditoría" />}
          />
          <Route path="vigilante" element={<GuardPage />} />
          <Route
            path="fase-a"
            element={<PlaceholderPage title="Fase A (preparación)" />}
          />
          <Route
            path="configuracion"
            element={<PlaceholderPage title="Configuración" />}
          />
          <Route path="*" element={<Navigate to="/resumen" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
