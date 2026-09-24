import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Compass, ArrowRight } from 'lucide-react'
import { usePageSEO } from '../utils/seo'

export const NotFoundPage: React.FC = () => {
  usePageSEO({
    title: '404 — Page Not Found | SmartTools India',
    description: 'The requested page or tool could not be found. Explore our free calculators and online tools.',
    noindex: true,
  })

  const popularTools = [
    { name: 'EMI Calculator', path: '/tools/emi-calculator', desc: 'Home, car & personal loan EMIs' },
    { name: 'GST Calculator', path: '/tools/gst-calculator', desc: 'Add or remove GST tax slabs' },
    { name: 'Salary Calculator', path: '/tools/salary-calculator', desc: 'In-hand take-home CTC pay' },
    { name: 'Percentage Calculator', path: '/tools/percentage-calculator', desc: 'Percentage growth & ratios' },
    { name: 'Age Calculator', path: '/tools/age-calculator', desc: 'Exact age in years, months & days' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto">
        <Compass className="h-8 w-8" />
      </div>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
          404 Error
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-3">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          The tool or page you are looking for does not exist or may have been moved.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Home className="h-4 w-4" />
          <span>Back to Homepage</span>
        </Link>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span>Browse All 10 Tools</span>
        </Link>
      </div>

      {/* Helpful Recommendations */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-left max-w-xl mx-auto">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3 text-center">
          Looking for our most popular tools?
        </h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          {popularTools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
