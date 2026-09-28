import { Link, useLocation } from 'react-router-dom'
import { useBreadcrumbLabel } from '../lib/breadcrumbContext'
import { ROUTE_LABELS } from '../lib/routeLabels'

type Crumb = { label: string; to: string | null }

export function Breadcrumbs() {
  const location = useLocation()
  const dynamicLabel = useBreadcrumbLabel()
  const segments = location.pathname.split('/').filter(Boolean)

  // En Resumen (home) no hace falta breadcrumb: ya estás en el inicio.
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'resumen')) {
    return null
  }

  const crumbs: Crumb[] = [{ label: 'Inicio', to: '/resumen' }]
  let accPath = ''
  segments.forEach((segment, i) => {
    accPath += `/${segment}`
    const isLast = i === segments.length - 1
    const isDetailSegment = i === 1 && segments.length === 2
    const label = isDetailSegment
      ? (dynamicLabel ?? 'Detalle')
      : (ROUTE_LABELS[accPath] ?? segment)
    crumbs.push({ label, to: isLast ? null : accPath })
  })

  return (
    <nav aria-label="Ruta de navegación" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs">
      {crumbs.map((crumb, i) => (
        <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border">/</span>}
          {crumb.to ? (
            <Link to={crumb.to} className="text-text-muted hover:text-brand-600">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-ink-900">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
