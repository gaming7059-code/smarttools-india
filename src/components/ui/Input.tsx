import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
