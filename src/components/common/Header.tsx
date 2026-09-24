import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Search, Menu, X, Wrench } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenSearch: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tools', label: 'All Tools' },
    { to: '/categories', label: 'Categories' },
    { to: '/about', label: 'About' },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              SmartTools<span className="text-blue-600 dark:text-blue-400">.in</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              India
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions: Search + Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            title="Search tools (Ctrl+K)"
          >
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-400" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden lg:inline-block rounded bg-white dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-2 shadow-md">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Theme</span>
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </header>
  )
}
