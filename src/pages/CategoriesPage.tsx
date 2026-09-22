import React from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { CATEGORIES } from '../data/categoriesData'
import { ALL_TOOLS } from '../data/toolsData'
import { ToolCard } from '../components/common/ToolCard'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'
import type { LayoutContextType } from '../layouts/MainLayout'

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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Collections
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Tool Categories
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Discover all tools grouped by domain: finance, math calculations, date intervals, unit conversions, and creator helpers.
        </p>
      </div>

      <div className="space-y-12">
        {CATEGORIES.map((category) => {
          const categoryTools = ALL_TOOLS.filter((t) => t.categoryId === category.id && t.id !== 'date-calculator')
          return (
            <div
              key={category.id}
              id={category.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {category.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {category.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      {category.tagline}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/tools?category=${category.id}`}
                  className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  View only {category.name} →
                </Link>
              </div>

              {categoryTools.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Additional tools for this category are in development.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          )
        })}
      </div>
    </div>
  )
}
