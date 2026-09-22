import React from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'info'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  }[variant]

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles} ${className}`}
    >
      {children}
    </span>
  )
}
