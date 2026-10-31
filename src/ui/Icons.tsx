import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const KalenderIcon = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
)

export const BuchIcon = () => (
  <Icon>
    <path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" />
    <path d="M4 20a2 2 0 0 0 2 2h14v-4" />
  </Icon>
)

export const KorbIcon = () => (
  <Icon>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l3 13h11l2-9H6" />
  </Icon>
)

export const LinksIcon = () => (
  <Icon>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)

export const RechtsIcon = () => (
  <Icon>
    <path d="M9 5l7 7-7 7" />
  </Icon>
)

export const PersonIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
)

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const KreuzIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
)

export const WarnIcon = () => (
  <Icon>
    <path d="M12 3l10 18H2z" />
    <path d="M12 10v5M12 18v.01" />
  </Icon>
)
