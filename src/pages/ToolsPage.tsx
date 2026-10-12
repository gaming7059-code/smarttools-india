import React, { useState, useMemo } from 'react'
import { useSearchParams, useOutletContext, useNavigate, Link } from 'react-router-dom'
import { Search, Filter, ArrowRight } from 'lucide-react'
import { ALL_TOOLS } from '../data/toolsData'
import { CATEGORIES } from '../data/categoriesData'
import { GAMES_LIST } from '../games/types'
import { GameIcon } from '../games/GameIcon'
import { ToolCard } from '../components/common/ToolCard'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'
import type { LayoutContextType } from '../layouts/MainLayout'
import type { CategoryId, Tool } from '../types/tools'

export const ToolsPage: React.FC = () => {
  const { openToolPreview } = useOutletContext<LayoutContextType>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
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

  // Check if a tool belongs to a given category
  const isToolInCategory = (tool: Tool, catId: string): boolean => {
    if (catId === 'all') return true
    if (tool.categoryId === catId) return true
    if (tool.categoryIds && tool.categoryIds.includes(catId as CategoryId)) return true
    return false
  }

  const handleSelectCategory = (catId: string) => {
    if (catId === 'games') {
      navigate('/games')
      return
    }
    if (catId === 'all') {
      searchParams.delete('category')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ category: catId })
    }
  }

  const currentCategoryObj = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory)
  }, [activeCategory])

  const filteredTools = useMemo(() => {
    return uniqueTools.filter((tool) => {
      const matchCategory = isToolInCategory(tool, activeCategory)
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
      {/* Dynamic Header */}
      <div className="animate-fade-in-up">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          {activeCategory === 'all' ? 'Directory' : 'Category'}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          {currentCategoryObj && activeCategory !== 'all' ? currentCategoryObj.name : 'All Online Tools'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          {currentCategoryObj && activeCategory !== 'all'
            ? currentCategoryObj.description
            : 'Browse our complete catalog of calculators, converters, and digital utilities. Free and ready to use in your browser.'}
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
          {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
            const count =
              cat.id === 'games'
                ? 5
                : uniqueTools.filter((t) => isToolInCategory(t, cat.id)).length

            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
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

      {/* Special Games Banner if activeCategory === 'games' */}
      {activeCategory === 'games' && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 p-6 sm:p-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Play in Browser
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                Free Online Browser Games
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                All 5 games are 100% free with custom vector icons and responsive touch controls.
              </p>
            </div>
            <Link
              to="/games"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <span>Open Dedicated Games Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {GAMES_LIST.map((game) => (
              <Link
                key={game.id}
                to={`/games?play=${game.id}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <GameIcon gameId={game.id} size="sm" withContainer />
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {game.tag}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {game.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {game.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Play</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tools Grid */}
      {filteredTools.length === 0 && activeCategory !== 'games' ? (
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
