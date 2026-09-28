// El Breadcrumb necesita el "nombre real" del recurso en las vistas de
// detalle (ej. el nombre del usuario en /usuarios/:id, no su id). Como ese
// dato se carga dentro de la página (no en el Layout que dibuja el
// breadcrumb), cada página de detalle lo publica con `useSetBreadcrumbLabel`.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type BreadcrumbContextValue = {
  label: string | null
  setLabel: (label: string | null) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [label, setLabel] = useState<string | null>(null)
  return (
    <BreadcrumbContext.Provider value={{ label, setLabel }}>{children}</BreadcrumbContext.Provider>
  )
}

function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx) throw new Error('BreadcrumbProvider falta en el árbol de componentes')
  return ctx
}

/** Leído por <Breadcrumbs /> para el último segmento de la ruta actual. */
export function useBreadcrumbLabel() {
  return useBreadcrumbContext().label
}

/** Llamado por páginas de detalle (usuario, zona, biometría) en cuanto conocen el nombre real. Se limpia solo al desmontar. */
export function useSetBreadcrumbLabel(label: string | null) {
  const { setLabel } = useBreadcrumbContext()
  useEffect(() => {
    setLabel(label)
    return () => setLabel(null)
  }, [label, setLabel])
}
