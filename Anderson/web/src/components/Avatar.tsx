function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
} as const

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: keyof typeof SIZES
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-600 ${SIZES[size]}`}
    >
      {initials(name) || '?'}
    </span>
  )
}
