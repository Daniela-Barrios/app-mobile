import { BellIcon, ChevronDownIcon, MenuIcon } from './icons'

type TopbarProps = {
  title: string
  subtitle?: string
  onOpenMenu: () => void
}

export function Topbar({ title, subtitle, onOpenMenu }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-ink-700 hover:bg-surface-muted lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-ink-900 sm:text-base">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative rounded-md p-1.5 text-ink-700 hover:bg-surface-muted"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger-500" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border py-1.5 pl-1.5 pr-2.5 hover:bg-surface-muted"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
            AR
          </span>
          <span className="hidden text-xs font-medium text-ink-900 sm:block">
            Ana Restrepo
          </span>
          <ChevronDownIcon className="hidden h-4 w-4 text-text-muted sm:block" />
        </button>
      </div>
    </header>
  )
}
