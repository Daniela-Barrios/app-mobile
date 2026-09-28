import { useCallback, useEffect, useState } from 'react'

/**
 * Carga datos vía una función async (normalmente un repositorio) y expone
 * loading/error/reload. Usado por todas las páginas para traer datos reales
 * del mock en vez de tenerlos hardcodeados.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fn()
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, ...deps])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  return { data, error, loading, reload }
}
