import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-xl p-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
        isDark
          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700/80 border border-slate-700/80 shadow-xs'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/80 shadow-xs'
      } ${className}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative flex items-center justify-center h-5 w-5">
        {isDark ? (
          <Sun className="h-4.5 w-4.5 transition-transform duration-200 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="h-4.5 w-4.5 transition-transform duration-200 -rotate-12 hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  )
}
