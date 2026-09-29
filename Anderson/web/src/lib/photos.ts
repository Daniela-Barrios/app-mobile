// Resuelve la foto vigente de cada usuario para mostrarla en <Avatar/>. No
// confía solo en `isCurrent` (el kiosco de la app móvil no desmarca la foto
// anterior al subir una nueva) — toma la más reciente por `uploadedAt`.
import type { Photo } from '../types'

export function latestPhotoByUser(photos: Photo[]): Map<string, string> {
  const map = new Map<string, string>()
  const ordenadas = [...photos].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  )
  for (const photo of ordenadas) {
    if (!map.has(photo.userId)) map.set(photo.userId, photo.url)
  }
  return map
}
