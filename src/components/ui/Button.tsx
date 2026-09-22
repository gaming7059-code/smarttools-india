import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }[size]

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  }[variant]

  return (
    <button
      className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
