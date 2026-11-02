import React, { useState, useMemo } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import {
  Search,
  ArrowRight,
  Mic,
  FileText,
  Gamepad2,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  FileEdit,
  FileImage,
  Zap,
  Shield,
  Gift,
  Smartphone,
  Landmark,
  CheckCircle2,
  Layers
} from 'lucide-react'
import { POPULAR_TOOLS, ALL_TOOLS } from '../data/toolsData'
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
    title: 'SmartTools India — Free Online Voice Tools, PDF Tools, Games & Calculators',
    description: 'Free online voice tools, client-side PDF editor, instant browser games, AI video prompt generator, and calculators for Indian users. 100% free, private and simple to use.',
    canonicalPath: '/',
    keywords: 'smarttools india, free voice tools, text to speech, pdf editor, free online games, ai prompt generator, sora prompt generator, emi calculator, gst calculator india, percentage calculator, free online tools',
    schema: createWebSiteSchema(),
  })

  // Category shortcuts for hero quick access
  const categoryShortcuts = [
    { label: '🎙️ Voice Tools', path: '/tools/text-to-speech' },
    { label: '📄 PDF Tools', path: '/tools/pdf-editor' },
    { label: '🎮 Games', path: '/games' },
    { label: '✨ AI Prompts', path: '/tools/video-prompt-generator' },
    { label: '🧮 Calculators', path: '/tools?category=calculators' },
    { label: '💰 Finance', path: '/tools?category=finance' },
    { label: '🛠️ All Tools', path: '/tools' },
  ]

  // Filter tools if user types in the hero search box
  const searchResults = useMemo(() => {
    const q = heroSearchQuery.trim().toLowerCase()
    if (!q) return null

    return ALL_TOOLS.filter((tool) => {
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.categoryName.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      )
    })
  }, [heroSearchQuery])

  // Popular utilities & converters for discovery (including our new flagship image & PDF tools)
  const popularUtilityTools = useMemo(() => {
    const selectedIds = [
      'jpg-to-pdf',
      'image-quality-increaser',
      'emi-calculator',
      'gst-calculator',
      'salary-calculator',
      'percentage-calculator',
      'age-calculator',
      'discount-calculator',
    ]
    return POPULAR_TOOLS.filter((tool) => selectedIds.includes(tool.id))
  }, [])

  return (
    <div className="space-y-16 sm:space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200/60 dark:border-slate-800">
        {/* Subtle Ambient Moving Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
          <div className="absolute -top-24 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-gradient-to-tr from-blue-400/25 to-indigo-400/20 dark:from-blue-600/15 dark:to-cyan-500/15 blur-3xl animate-blob-1" />
          <div className="absolute top-10 -right-20 w-72 sm:w-88 h-72 sm:h-88 rounded-full bg-gradient-to-br from-indigo-300/25 to-sky-300/25 dark:from-indigo-600/15 dark:to-blue-700/15 blur-3xl animate-blob-2" />
          <div className="absolute -bottom-20 left-1/3 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-gradient-to-r from-cyan-300/20 to-blue-300/20 dark:from-blue-900/15 dark:to-indigo-950/20 blur-3xl animate-blob-3" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Trust Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50/90 dark:bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-6 shadow-2xs backdrop-blur-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-subtle-pulse"></span>
            100% Free • No Sign-Up Required • Private &amp; Browser-Based
          </div>

          {/* Main Headline */}
          <h1 className="animate-fade-in-up animation-delay-100 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Everything You Need,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
              All in One Place
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up animation-delay-200 mt-4 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Free online voice tools, PDF tools, games and AI prompt generators — simple, fast and easy to use.
          </p>

          {/* Prominent Search Bar */}
          <div className="animate-fade-in-up animation-delay-300 mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-all duration-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 dark:focus-within:ring-blue-500/20">
              <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 ml-3 shrink-0 transition-colors" />
              <input
                type="text"
                value={heroSearchQuery}
                onChange={(e) => setHeroSearchQuery(e.target.value)}
                placeholder="Search your favourite tools..."
                aria-label="Search your favourite tools"
                className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
              />
              {heroSearchQuery && (
                <button
                  type="button"
                  onClick={() => setHeroSearchQuery('')}
                  className="mr-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Quick Badges */}
            <div className="animate-fade-in-up animation-delay-400 mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1">Quick:</span>
              {categoryShortcuts.map((cat) => (
                <Link
                  key={cat.label}
                  to={cat.path}
                  className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            {/* Call-to-action buttons */}
            <div className="animate-fade-in-up animation-delay-500 mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore All Tools</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/games"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Gamepad2 className="h-4 w-4 text-emerald-500" />
                <span>Play Online Games</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH RESULTS OVERLAY (WHEN SEARCHING IN HERO) */}
      {searchResults && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Search Results for &ldquo;{heroSearchQuery}&rdquo;
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Found {searchResults.length} matching {searchResults.length === 1 ? 'tool' : 'tools'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHeroSearchQuery('')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No tools found. Try searching for &quot;speech&quot;, &quot;pdf&quot;, &quot;video&quot;, &quot;gst&quot;, or &quot;emi&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {searchResults.map((tool: Tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onOpenPreview={openToolPreview}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. FEATURED CATEGORIES — MOST PROMINENT SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Featured Highlights
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-3">
              Explore Our Top Categories
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Instant, privacy-first tools designed to help creators, students, and professionals get work done in seconds.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CARD 1 — VOICE TOOLS */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-md hover:shadow-xl dark:hover:shadow-blue-950/30 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
              
              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Mic className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    3 Studio Tools
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Voice Tools
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Create, convert, record and process voice and audio directly in your browser.
                </p>

                {/* Available Tools List */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Link
                    to="/tools/text-to-speech"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Volume2 className="h-3.5 w-3.5 text-blue-500" />
                      Text to Speech
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">WAV Export</span>
                  </Link>
                  <Link
                    to="/tools/audio-studio"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
                      Audio Studio &amp; Cleaner
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">De-Hum</span>
                  </Link>
                  <Link
                    to="/tools/audio-transcriber"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Mic className="h-3.5 w-3.5 text-cyan-500" />
                      Audio Transcriber
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Live Dictation</span>
                  </Link>
                </div>
              </div>

              {/* Action CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/tools/text-to-speech"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white dark:hover:text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <span>Explore Voice Tools</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* CARD 2 — PDF TOOLS */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-md hover:shadow-xl dark:hover:shadow-rose-950/30 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
              
              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white shadow-md shadow-rose-500/25 group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    2 PDF Tools
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  PDF Tools
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Manage, convert and work with PDF documents easily without uploading to external servers.
                </p>

                {/* Available Tools List */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Link
                    to="/tools/pdf-editor"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileEdit className="h-3.5 w-3.5 text-rose-500" />
                      PDF Editor &amp; Annotator
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Annotate</span>
                  </Link>
                  <Link
                    to="/tools/jpg-to-pdf"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileImage className="h-3.5 w-3.5 text-rose-500" />
                      JPG to PDF Converter
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Multi-Image</span>
                  </Link>
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    ✏️ Convert photos into PDF books and annotate or sign documents 100% locally.
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/tools/pdf-editor"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white dark:hover:text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <span>Explore PDF Tools</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* CARD 3 — GAMES */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-md hover:shadow-xl dark:hover:shadow-emerald-950/30 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              
              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    5 Free Games
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Free Online Games
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Enjoy fun and entertaining browser games for free. No installations or sign-up needed.
                </p>

                {/* Available Tools List */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Link
                    to="/games?play=tic-tac-toe"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Tic-Tac-Toe</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Play AI</span>
                  </Link>
                  <Link
                    to="/games?play=snake"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Retro Snake Game</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Arcade</span>
                  </Link>
                  <Link
                    to="/games?play=memory-match"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>Memory Card Match</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Brain Test</span>
                  </Link>
                </div>
              </div>

              {/* Action CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/games"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white dark:hover:text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <span>Play Games</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

            {/* CARD 4 — AI PROMPT GENERATOR */}
            <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-md hover:shadow-xl dark:hover:shadow-purple-950/30 transition-all duration-300 hover:-translate-y-1.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" />
              
              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Director Studio
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  AI Prompt Generator
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Create powerful prompts for AI images, videos and creative generative models.
                </p>

                {/* Available Tools List */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <Link
                    to="/tools/video-prompt-generator"
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      Video Prompt Generator
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Sora &amp; Kling</span>
                  </Link>
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    🎬 Cinematic camera angles, 35mm lighting, motion physics, and AI prompt enhancer for Runway, Midjourney &amp; Sora.
                  </div>
                </div>
              </div>

              {/* Action CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/tools/video-prompt-generator"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 dark:hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white dark:hover:text-white px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200"
                >
                  <span>Create Prompts</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. POPULAR TOOLS SECTION (EVERYDAY UTILITIES & CALCULATORS) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Essential Helpers
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Popular Tools
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Most used online financial calculators, math solvers, and unit converters across India.
              </p>
            </div>

            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
            >
              <span>View All 17 Tools</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {popularUtilityTools.map((tool: Tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onOpenPreview={openToolPreview}
              />
            ))}
          </div>
        </ScrollReveal>

        {/* View All Tools CTA banner */}
        <div className="mt-8 text-center">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs hover:shadow-md transition-all duration-200"
          >
            <Layers className="h-4 w-4" />
            <span>Browse Complete Directory of All 17 Tools</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 4. EXPLORE ALL CATEGORIES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Browse by Category
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                All Tool Categories
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Choose from our complete catalog of specialized financial calculators, converters, creator helpers, and games.
              </p>
            </div>

            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors group"
            >
              <span>View Category Index</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 5. WHY SMARTTOOLS INDIA SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-xs">
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
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">⚡ Fast</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tools load instantly and compute results directly in your web browser.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">🔒 100% Private</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your calculations, audio files, and PDFs stay strictly on your local device.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">🆓 Completely Free</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Zero subscriptions, zero paywalls, and zero forced account registrations.
                </p>
              </div>

              {/* Benefit 4 */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-blue-950/40 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-3 transition-transform duration-300 group-hover:scale-110">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">📱 Mobile Friendly</h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Optimized for seamless operation across smartphones, tablets, and desktops.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 6. SEO & PLATFORM OVERVIEW SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* What is SmartTools India? */}
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs">
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
                SmartTools India is a dedicated, lightning-fast digital utility platform built to simplify voice processing, PDF editing, prompt engineering, and everyday mathematical and financial calculations. Whether you are a content creator recording speech with our <Link to="/tools/text-to-speech" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Text to Speech Converter</Link>, a professional modifying agreements in the <Link to="/tools/pdf-editor" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">PDF Editor</Link>, an AI creator tuning cinematographic prompts in the <Link to="/tools/video-prompt-generator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">AI Video Prompt Generator</Link>, or a family planning loans with the <Link to="/tools/emi-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">EMI Calculator</Link>, SmartTools India provides accurate and instant answers directly in your browser.
              </p>
              <p>
                Unlike conventional online tools cluttered with intrusive advertisements, forced email logins, or sluggish server-side processing, every utility on SmartTools India is engineered to run 100% client-side. This means your private text, documents, audio clips, and financial numbers never leave your device.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Free Online Calculators and Useful Tools */}
        <ScrollReveal delay={100}>
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Why Use Our Platform</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Fast, Private and Completely Free Web Utilities
                </h2>
              </div>
            </div>
            <div className="space-y-3.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                In our digital day-to-day workflow, quick and accurate tools are indispensable. Whether you need to calculate shopping savings with our <Link to="/tools/discount-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Discount Calculator</Link>, compute tax breakdown using the <Link to="/tools/gst-calculator" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">GST Calculator</Link>, clean up audio hum with our <Link to="/tools/audio-studio" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Audio Studio</Link>, or take a break with our <Link to="/games" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Online Browser Games</Link>, SmartTools India is designed to give you frictionless results.
              </p>
              <p>
                Bookmark SmartTools India to access instant utilities on your phone, tablet, or desktop whenever you need them.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
