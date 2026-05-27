import type { ReactNode } from 'react'

type BtnWithIconProps = {
  icon: ReactNode
  children: ReactNode
  className?: string
}

export function BtnWithIcon({ icon, children, className = '' }: BtnWithIconProps) {
  return (
    <span className={`btnWithIcon ${className}`.trim()}>
      {icon}
      <span>{children}</span>
    </span>
  )
}
