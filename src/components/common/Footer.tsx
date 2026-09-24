import React from 'react'
import { Link } from 'react-router-dom'
import { Wrench, ShieldCheck, Heart } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand and Description */}
            <div className="md:col-span-2 space-y-3">
              <Link to="/" className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02] inline-flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <Wrench className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  SmartTools India
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                Free online calculators and useful tools for everyday life. Built for students, professionals, small business owners, and everyday internet users in India.
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Client-side calculations • No sign-up • 100% Free</span>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Explore
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/tools" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    Tools
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal and Support Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-3">
                Information
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 hover:translate-x-1 inline-block transition-all duration-200">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p>© 2026 SmartTools India. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with simplicity for India <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" />
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  )
}
