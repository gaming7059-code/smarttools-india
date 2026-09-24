import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Search, Zap, Shield, Gift, Smartphone, ArrowRight, Calculator, Landmark, CheckCircle2 } from 'lucide-react'
import { POPULAR_TOOLS } from '../data/toolsData'
import { CATEGORIES } from '../data/categoriesData'
import { ToolCard } from '../components/common/ToolCard'
import { CategoryCard } from '../components/common/CategoryCard'
import { ScrollReveal } from '../components/common/ScrollReveal'
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
      {/* 1. HERO SECTION WITH AMBIENT MOTION GRAPHICS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-200/60 dark:border-slate-800">
        {/* Subtle Ambient Moving Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
          <div className="absolute -top-24 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-tr from-blue-400/25 to-indigo-400/20 dark:from-blue-600/15 dark:to-cyan-500/15 blur-3xl animate-blob-1" />
          <div className="absolute top-10 -right-20 w-72 sm:w-88 h-72 sm:h-88 rounded-full bg-gradient-to-br from-indigo-300/25 to-sky-300/25 dark:from-indigo-600/15 dark:to-blue-700/15 blur-3xl animate-blob-2" />
          <div className="absolute -bottom-20 left-1/3 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-gradient-to-r from-cyan-300/20 to-blue-300/20 dark:from-blue-900/15 dark:to-indigo-950/20 blur-3xl animate-blob-3" />

          {/* Floating Subtle Geometric Particles */}
          <div className="absolute top-20 right-12 sm:right-28 text-blue-400/40 dark:text-blue-500/20 font-mono text-2xl select-none animate-float-gentle">
            +
          </div>
          <div className="absolute bottom-16 left-10 sm:left-24 text-indigo-400/40 dark:text-indigo-500/20 font-mono text-xl select-none animate-float-reverse">
            +
          </div>
          <div className="absolute top-16 left-12 sm:left-32 w-3.5 h-3.5 rounded-full border border-blue-400/35 dark:border-blue-500/20 animate-float-reverse" />
          <div className="absolute bottom-20 right-16 sm:right-36 w-3 h-3 rotate-45 border border-sky-400/35 dark:border-cyan-500/20 animate-float-gentle" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in-up inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-6 shadow-2xs">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-subtle-pulse"></span>
            100% Free • No Login Required • Browser-Based
          </div>

          <h1 className="animate-fade-in-up animation-delay-100 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Free Online Tools for Everyday Life
          </h1>

          <p className="animate-fade-in-up animation-delay-200 mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Calculate, convert and solve everyday problems with simple, fast and free online tools.
          </p>

          {/* Prominent Search Box */}
          <div className="animate-fade-in-up animation-delay-300 mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 dark:focus-within:ring-blue-500/20">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 ml-3 shrink-0 transition-colors" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                placeholder="Search for a tool..."
                className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              {heroSearchQuery && (
                <button
                  type="button"
                  onClick={() => setHeroSearchQuery('')}
                  className="mr-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Shortcuts */}
            <div className="animate-fade-in-up animation-delay-400 mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">Quick:</span>
              {categoryShortcuts.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/tools?category=${cat.id}`}
                  className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95"
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
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Featured Utilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Popular Tools
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Most used online calculators and utility helpers across India.
              </p>
            </div>

            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
            >
              <span>View All Tools</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        {filteredPopularTools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-300 font-medium">No tools found matching &ldquo;{heroSearchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => setHeroSearchQuery('')}
              className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset search
            </button>
          </div>
        ) : (
          <ScrollReveal delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredPopularTools.map((tool: Tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onOpenPreview={openToolPreview}
                />
              ))}
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* 3. CATEGORY SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Browse
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Explore Tools by Category
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Choose from specialized collections suited for your daily calculation needs.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 4. WHY SMARTTOOLS INDIA SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-xs">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Why SmartTools India
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Simple Tools. No Sign-Up.
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Everything runs locally in your browser with zero friction, zero sign-ups, and zero cost.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Benefit 1 */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">⚡ Fast</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tools load quickly and work directly in your browser.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">🔒 Private</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your calculations stay in your browser.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">🆓 Free</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  No subscription required.
                </p>
              </div>

              {/* Benefit 4 */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">📱 Mobile Friendly</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Works smoothly on phones, tablets and computers.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. SEO & EDUCATIONAL SECTIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* What is SmartTools India? */}
        <ScrollReveal>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Platform Overview</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  What is SmartTools India?
                </h2>
              </div>
            </div>
            <div className="space-y-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                SmartTools India is a dedicated, lightning-fast digital utility platform built to simplify mathematical, financial, date, and text calculations for users across India. Whether you are a college student solving assignment problems, a salaried professional planning your monthly budget, a freelance creator writing articles, or a shopkeeper generating billing figures, SmartTools India provides accurate and instant answers directly in your browser.
              </p>
              <p>
                Unlike conventional online calculation portals cluttered with intrusive popup advertisements, forced email logins, or sluggish server-side processing, every utility on SmartTools India is engineered to run 100% client-side. This means your personal loan details, tax amounts, and private text documents never leave your computer or mobile device.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* What can you calculate online? */}
        <ScrollReveal delay={100}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Comprehensive Capabilities</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  What Can You Calculate Online?
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financial Utilities */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                  Financial Calculations
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3.5 leading-relaxed">
                  Make confident personal and commercial money decisions with our Indian finance helpers:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/tools/emi-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      EMI Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Forecast home, car, and personal loan installments</span>
                  </li>
                  <li>
                    <Link to="/tools/gst-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      GST Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Compute Indian GST tax slabs (5%, 12%, 18%, 28%)</span>
                  </li>
                  <li>
                    <Link to="/tools/salary-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Salary Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Convert annual CTC to monthly in-hand take-home pay</span>
                  </li>
                  <li>
                    <Link to="/tools/discount-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Discount Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Calculate shopping markdown and stacked festive deals</span>
                  </li>
                  <li>
                    <Link to="/tools/profit-loss-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Profit & Loss Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Analyze profit margin, cost price, and business revenue</span>
                  </li>
                </ul>
              </div>

              {/* Math & Date Tools */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                  Math & Date Calculations
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3.5 leading-relaxed">
                  Solve arithmetic, proportions, and calendar milestones with microsecond precision:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/tools/percentage-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Percentage Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Work out percentages, percentage changes, and ratios</span>
                  </li>
                  <li>
                    <Link to="/tools/age-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Age Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Find your exact age in years, months, and days</span>
                  </li>
                  <li>
                    <Link to="/tools/date-difference-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Date Difference Calculator
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Count elapsed days and weeks between any two calendar dates</span>
                  </li>
                </ul>
              </div>

              {/* Everyday Converters & Text Tools */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600 dark:bg-purple-400"></span>
                  Converters & Content Tools
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3.5 leading-relaxed">
                  Streamline practical measurements and optimize copy for essays, blogs, and social feeds:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/tools/unit-converter" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Unit Converter
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Convert units across length, weight, area, volume & temp</span>
                  </li>
                  <li>
                    <Link to="/tools/word-counter" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline">
                      Word Counter
                    </Link>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Live word count, character count, and reading time analyzer</span>
                  </li>
                  <li className="pt-2">
                    <Link to="/tools" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                      Explore all 10 tools <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Free Online Calculators and Useful Tools */}
        <ScrollReveal delay={100}>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Why Use Our Platform</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Free Online Calculators and Useful Tools for Everyday Life
                </h2>
              </div>
            </div>
            <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                In our fast-paced daily routines, quick and accurate calculations are indispensable. Whether you need to figure out how much you save during a festive e-commerce sale with our <Link to="/tools/discount-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Discount Calculator</Link>, double-check your merchant&apos;s invoice using the <Link to="/tools/gst-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">GST Calculator</Link>, or evaluate multiple home loan offers using our <Link to="/tools/emi-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">EMI Calculator</Link>, SmartTools India eliminates mental arithmetic friction.
              </p>
              <p>
                We believe everyday web utilities should be lightweight, distraction-free, and respectful of user privacy. You don&apos;t need to download bloated native mobile applications or share phone numbers to get simple answers. Simply bookmark SmartTools India, choose the calculator you need, and receive real-time answers formatted cleanly in Indian numbering conventions (lakhs and crores).
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
