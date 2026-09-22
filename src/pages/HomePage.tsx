import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Search, Zap, Shield, Gift, Smartphone, ArrowRight, Calculator, Landmark, CheckCircle2 } from 'lucide-react'
import { POPULAR_TOOLS } from '../data/toolsData'
import { CATEGORIES } from '../data/categoriesData'
import { ToolCard } from '../components/common/ToolCard'
import { CategoryCard } from '../components/common/CategoryCard'
import { usePageSEO, createWebSiteSchema } from '../utils/seo'
import type { LayoutContextType } from '../layouts/MainLayout'
import type { Tool } from '../types/tools'

export const HomePage: React.FC = () => {
  const { openToolPreview } = useOutletContext<LayoutContextType>()
  const [heroSearchQuery, setHeroSearchQuery] = useState('')

  usePageSEO({
    title: 'SmartTools India — Free Online Tools for Everyday Life',
    description: 'Free online calculators and everyday digital tools for Indian users. Calculate EMI, GST, salary, percentage, age, discounts, dates, units, and word count instantly without login.',
    canonicalPath: '/',
    schema: createWebSiteSchema(),
  })

  // Category shortcuts
  const categoryShortcuts = [
    { label: 'Finance', id: 'finance' },
    { label: 'Calculators', id: 'calculators' },
    { label: 'Converters', id: 'converters' },
    { label: 'Date & Time', id: 'date-time' },
    { label: 'Education', id: 'education' },
    { label: 'Creator Tools', id: 'creator-tools' },
  ]

  // Filter tools if user types in the hero search box
  const filteredPopularTools = useMemo(() => {
    const q = heroSearchQuery.trim().toLowerCase()
    if (!q) return POPULAR_TOOLS

    return POPULAR_TOOLS.filter((tool) => {
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.categoryName.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      )
    })
  }, [heroSearchQuery])

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-200/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-6">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
            100% Free • No Login Required • Browser-Based
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Free Online Tools for Everyday Life
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Calculate, convert and solve everyday problems with simple, fast and free online tools.
          </p>

          {/* Prominent Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-white p-2 shadow-lg shadow-slate-200/50 border border-slate-200 transition-all focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100">
              <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                placeholder="Search for a tool..."
                className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {heroSearchQuery && (
                <button
                  type="button"
                  onClick={() => setHeroSearchQuery('')}
                  className="mr-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Shortcuts */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-slate-400 mr-1">Quick:</span>
              {categoryShortcuts.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/tools?category=${cat.id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. POPULAR TOOLS SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Featured Utilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Popular Tools
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Most used online calculators and utility helpers across India.
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>View All Tools</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {filteredPopularTools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center bg-white">
            <p className="text-slate-600 font-medium">No tools found matching &ldquo;{heroSearchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => setHeroSearchQuery('')}
              className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPopularTools.map((tool: Tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onOpenPreview={openToolPreview}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. CATEGORY SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Browse
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Explore Tools by Category
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose from specialized collections suited for your daily calculation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* 4. WHY SMARTTOOLS INDIA SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Why SmartTools India
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Simple Tools. No Sign-Up.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Everything runs locally in your browser with zero friction, zero sign-ups, and zero cost.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-slate-100/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mb-3">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">⚡ Fast</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Tools load quickly and work directly in your browser.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-slate-100/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-3">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">🔒 Private</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Your calculations stay in your browser.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-slate-100/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 mb-3">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">🆓 Free</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                No subscription required.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition-colors hover:bg-slate-100/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-3">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">📱 Mobile Friendly</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Works smoothly on phones, tablets and computers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEO & EDUCATIONAL SECTIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* What is SmartTools India? */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Platform Overview</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                What is SmartTools India?
              </h2>
            </div>
          </div>
          <div className="space-y-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            <p>
              SmartTools India is a dedicated, lightning-fast digital utility platform built to simplify mathematical, financial, date, and text calculations for users across India. Whether you are a college student solving assignment problems, a salaried professional planning your monthly budget, a freelance creator writing articles, or a shopkeeper generating billing figures, SmartTools India provides accurate and instant answers directly in your browser.
            </p>
            <p>
              Unlike conventional online calculation portals cluttered with intrusive popup advertisements, forced email logins, or sluggish server-side processing, every utility on SmartTools India is engineered to run 100% client-side. This means your personal loan details, tax amounts, and private text documents never leave your computer or mobile device.
            </p>
          </div>
        </div>

        {/* What can you calculate online? */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Comprehensive Capabilities</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                What Can You Calculate Online?
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Utilities */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                Financial Calculations
              </h3>
              <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                Make confident personal and commercial money decisions with our Indian finance helpers:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/tools/emi-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    EMI Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Forecast home, car, and personal loan installments</span>
                </li>
                <li>
                  <Link to="/tools/gst-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    GST Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Compute Indian GST tax slabs (5%, 12%, 18%, 28%)</span>
                </li>
                <li>
                  <Link to="/tools/salary-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Salary Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Convert annual CTC to monthly in-hand take-home pay</span>
                </li>
                <li>
                  <Link to="/tools/discount-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Discount Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Calculate shopping markdown and stacked festive deals</span>
                </li>
                <li>
                  <Link to="/tools/profit-loss-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Profit & Loss Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Analyze profit margin, cost price, and business revenue</span>
                </li>
              </ul>
            </div>

            {/* Math & Date Tools */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                Math & Date Calculations
              </h3>
              <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                Solve arithmetic, proportions, and calendar milestones with microsecond precision:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/tools/percentage-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Percentage Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Work out percentages, percentage changes, and ratios</span>
                </li>
                <li>
                  <Link to="/tools/age-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Age Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Find your exact age in years, months, and days</span>
                </li>
                <li>
                  <Link to="/tools/date-difference-calculator" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Date Difference Calculator
                  </Link>
                  <span className="text-xs text-slate-500 block">Count elapsed days and weeks between any two calendar dates</span>
                </li>
              </ul>
            </div>

            {/* Everyday Converters & Text Tools */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-5">
              <h3 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                Converters & Content Tools
              </h3>
              <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                Streamline practical measurements and optimize copy for essays, blogs, and social feeds:
              </p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/tools/unit-converter" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Unit Converter
                  </Link>
                  <span className="text-xs text-slate-500 block">Convert units across length, weight, area, volume & temp</span>
                </li>
                <li>
                  <Link to="/tools/word-counter" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Word Counter
                  </Link>
                  <span className="text-xs text-slate-500 block">Live word count, character count, and reading time analyzer</span>
                </li>
                <li className="pt-2">
                  <Link to="/tools" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                    Explore all 10 tools <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Free Online Calculators and Useful Tools */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">Why Use Our Platform</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Free Online Calculators and Useful Tools for Everyday Life
              </h2>
            </div>
          </div>
          <div className="space-y-3.5 text-sm text-slate-600 leading-relaxed">
            <p>
              In our fast-paced daily routines, quick and accurate calculations are indispensable. Whether you need to figure out how much you save during a festive e-commerce sale with our <Link to="/tools/discount-calculator" className="font-medium text-blue-600 hover:underline">Discount Calculator</Link>, double-check your merchant&apos;s invoice using the <Link to="/tools/gst-calculator" className="font-medium text-blue-600 hover:underline">GST Calculator</Link>, or evaluate multiple home loan offers using our <Link to="/tools/emi-calculator" className="font-medium text-blue-600 hover:underline">EMI Calculator</Link>, SmartTools India eliminates mental arithmetic friction.
            </p>
            <p>
              We believe everyday web utilities should be lightweight, distraction-free, and respectful of user privacy. You don&apos;t need to download bloated native mobile applications or share phone numbers to get simple answers. Simply bookmark SmartTools India, choose the calculator you need, and receive real-time answers formatted cleanly in Indian numbering conventions (lakhs and crores).
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
