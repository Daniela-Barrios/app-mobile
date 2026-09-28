import type { SVGProps } from 'react'

/**
 * Set de iconos propio (outline, trazo 1.75, estilo consistente).
 * Nada de librerías de iconos externas: cada uno es un <svg> a mano,
 * coherente con la regla de "cero librerías de UI de terceros".
 */
type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5v-5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 19.5c0-3 2.8-5.25 6.25-5.25s6.25 2.25 6.25 5.25" />
      <path d="M15.5 5.6c1.55.3 2.75 1.6 2.75 3.15 0 1.55-1.2 2.85-2.75 3.15" />
      <path d="M17.75 14.5c2.6.5 4.5 2.2 4.5 4.5" />
    </svg>
  )
}

export function FingerprintIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c4.7 0 8.5 3.8 8.5 8.5 0 1.9-.3 3.6-.9 5" />
      <path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5 0 1.4.15 2.5.4 3.5" />
      <path d="M7.5 20c1-1.6 1.3-3.5 1.3-5.8v-2.2a3.2 3.2 0 0 1 6.4 0v1" />
      <path d="M9.8 21c1.1-1.4 1.4-3.1 1.4-5.2V13.7" />
      <path d="M14.3 17.5c.5-1 .7-2.1.7-3.5v-2" />
    </svg>
  )
}

export function KeyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="15.5" r="4" />
      <path d="M11 12.5 19 4.5" />
      <path d="M16.5 7 19 9.5" />
      <path d="M14 9.5 16 11.5" />
    </svg>
  )
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M3.5 6.5h.01M3.5 12h.01M3.5 17.5h.01" strokeWidth="2.5" />
    </svg>
  )
}

export function ActivityIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12h4l2.2-6.5L13 18l2.2-6H21" />
    </svg>
  )
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.8h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="12.5" r="3.25" />
    </svg>
  )
}

export function HeadsetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v.5a3 3 0 0 1-3 3h-3" />
    </svg>
  )
}

export function PlugIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 3v5M15 3v5" />
      <path d="M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0Z" />
      <path d="M12 15.5V21" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v-1M12 20.5v-1M19.5 12h1M3.5 12h1M17.5 6.5l.7-.7M5.8 18.2l.7-.7M17.5 17.5l.7.7M5.8 5.8l.7.7" />
    </svg>
  )
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.2 1 4.6 1.5 5.2H4.5c.5-.6 1.5-2 1.5-5.2Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}
