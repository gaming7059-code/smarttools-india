import React, { useState, useMemo } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { ALL_TOOLS } from '../data/toolsData'
import { CATEGORIES } from '../data/categoriesData'
import { ToolCard } from '../components/common/ToolCard'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'
import type { LayoutContextType } from '../layouts/MainLayout'
import type { CategoryId, Tool } from '../types/tools'

export const ToolsPage: React.FC = () => {
  const { openToolPreview } = useOutletContext<LayoutContextType>()
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') as CategoryId | null

  usePageSEO({
    title: 'All Online Tools & Calculators — SmartTools India',
    description: 'Browse the complete directory of free online calculators, unit converters, and digital tools. Fast, browser-based, and mobile-friendly.',
    canonicalPath: '/tools',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
    ]),
  })

  const [searchQuery, setSearchQuery] = useState('')

  const activeCategory = categoryParam || 'all'

  // Deduplicate alias entries so only unique tools appear
  const uniqueTools = useMemo(() => {
    return ALL_TOOLS.filter((t) => t.id !== 'date-calculator')
  }, [])

  const handleSelectCategory = (catId: string) => {
    if (catId === 'all') {
      searchParams.delete('category')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ category: catId })
    }
  }

  const filteredTools = useMemo(() => {
    return uniqueTools.filter((tool) => {
      const matchCategory =
        activeCategory === 'all' || tool.categoryId === activeCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchCategory

      const matchText =
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((k) => k.toLowerCase().includes(query))

      return matchCategory && matchText
    })
  }, [uniqueTools, activeCategory, searchQuery])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Directory
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          All Online Tools
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Browse our complete catalog of calculators, converters, and digital utilities. Free and ready to use in your browser.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="animate-fade-in flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter tools by keyword..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-3 focus:ring-blue-500/20 dark:focus:ring-blue-500/20"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleSelectCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All ({uniqueTools.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = uniqueTools.filter((t) => t.categoryId === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.emoji} {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 animate-fade-in">
          <Filter className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">No tools match your criteria</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing your search query or selecting another category.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              handleSelectCategory('all')
            }}
            className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
          {filteredTools.map((tool: Tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onOpenPreview={openToolPreview}
            />
          ))}
        </div>
      )}
    </div>
  )
}
