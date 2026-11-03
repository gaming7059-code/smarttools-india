import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenSearch: () => void
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const pathname = location.pathname

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tools/text-to-speech', label: 'Voice Tools', matchPrefixes: ['/tools/text-to-speech', '/tools/audio-studio', '/tools/audio-transcriber'] },
    { to: '/tools/pdf-editor', label: 'PDF Tools', matchPrefixes: ['/tools/pdf-editor'] },
    { to: '/games', label: 'Games', matchPrefixes: ['/games'] },
    { to: '/tools/video-prompt-generator', label: 'AI Prompts', matchPrefixes: ['/tools/video-prompt-generator'] },
    { to: '/tools', label: 'All Tools', exact: true },
  ]

  const isLinkActive = (link: typeof navLinks[0]) => {
    if (link.to === '/') return pathname === '/'
    if (link.matchPrefixes) {
      return link.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'))
    }
    if (link.exact) return pathname === link.to
    return pathname.startsWith(link.to)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'border-b border-slate-200/90 dark:border-slate-800/90 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-xs'
          : 'border-b border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-none'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link 
          to="/" 
          className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          aria-label="SmartTools India Homepage"
        >
          <img
            src="/smarttools-logo.png"
            alt="SmartTools India logo"
            width={40}
            height={40}
            className="h-9 w-9 sm:h-10 sm:w-10 object-contain rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white shadow-2xs transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105 shrink-0"
            loading="eager"
            decoding="async"
          />
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
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = isLinkActive(link)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Right Actions: Search + Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all duration-200 ease-out active:scale-[0.98] shadow-2xs"
            title="Search tools (Ctrl+K)"
          >
            <Search className="h-4 w-4 text-slate-400 dark:text-slate-400 transition-colors" />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden xl:inline-block rounded bg-white dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-95"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl px-4 pt-2 pb-4 space-y-2 shadow-xl animate-drawer-down">
          {navLinks.map((link) => {
            const active = isLinkActive(link)
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={`block rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </NavLink>
            )
          })}

          {/* Quick Categories in Mobile Menu */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="block px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              More Categories
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5 px-3">
              {[
                { name: 'Calculators', path: '/tools?category=calculators' },
                { name: 'Finance', path: '/tools?category=finance' },
                { name: 'Math', path: '/tools?category=math' },
                { name: 'Converters', path: '/tools?category=converters' },
                { name: 'Date & Time', path: '/tools?category=date-time' },
                { name: 'All Categories', path: '/categories' },
                { name: 'About Us', path: '/about' },
              ].map((c) => (
                <Link
                  key={c.name}
                  to={c.path}
                  onClick={closeMobileMenu}
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3 py-1 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Theme</span>
            <ThemeToggle showLabel />
          </div>
        </div>
      )}
    </header>
  )
}
