export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-text-muted">
        Módulo pendiente de construir. La navegación ya llega hasta aquí.
      </p>
    </div>
  )
}
