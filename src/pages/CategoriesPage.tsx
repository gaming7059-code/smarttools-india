import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { CATEGORIES } from '../data/categoriesData'
import { ALL_TOOLS } from '../data/toolsData'
import { GAMES_LIST } from '../games/types'
import { GameIcon } from '../games/GameIcon'
import { ToolCard } from '../components/common/ToolCard'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { ScrollReveal } from '../components/common/ScrollReveal'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'
import type { LayoutContextType } from '../layouts/MainLayout'
import type { CategoryId, Tool } from '../types/tools'

export const CategoriesPage: React.FC = () => {
  const { openToolPreview } = useOutletContext<LayoutContextType>()

  usePageSEO({
    title: 'Browse Tools by Category — SmartTools India',
    description: 'Explore free online calculators and digital utilities organized by category: finance, mathematical calculations, date & time, unit converters, and creator tools.',
    canonicalPath: '/categories',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/categories' },
    ]),
  })

  // Multi-category helper
  const isToolInCategory = (tool: Tool, catId: string): boolean => {
    if (tool.id === 'date-calculator') return false
    if (tool.categoryId === catId) return true
    if (tool.categoryIds && tool.categoryIds.includes(catId as CategoryId)) return true
    return false
  }

  // Display categories excluding the generic "all" container
  const displayCategories = CATEGORIES.filter((c) => c.id !== 'all')

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Header */}
      <div className="animate-fade-in-up">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Collections
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Explore All Categories
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Discover all tools and games grouped by domain: finance, math calculations, date intervals, unit conversions, creator helpers, and browser games.
        </p>

        {/* Quick Jump Category Anchor Pills */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-1 shrink-0">Jump to:</span>
          {displayCategories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-2xs hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 whitespace-nowrap active:scale-95"
            >
              {cat.emoji} {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Category Sections */}
      <div className="space-y-12">
        {displayCategories.map((category) => {
          const categoryTools = ALL_TOOLS.filter((t) => isToolInCategory(t, category.id))
          const isGamesCategory = category.id === 'games'
          const targetUrl = category.path || `/tools?category=${category.id}`

          return (
            <ScrollReveal key={category.id} delay={50}>
              <div
                id={category.id}
                className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xs space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 p-2.5 transition-transform duration-300 hover:scale-105 border border-blue-100 dark:border-blue-900/40">
                      <CategoryIcon categoryId={category.id} size="md" className="w-full h-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {category.name}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {category.itemLabel || `${categoryTools.length} Tools`}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={targetUrl}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors shrink-0"
                  >
                    <span>{isGamesCategory ? 'Play All Games' : `View all in ${category.name}`}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {isGamesCategory ? (
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
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {categoryTools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onOpenPreview={openToolPreview}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  )
}
