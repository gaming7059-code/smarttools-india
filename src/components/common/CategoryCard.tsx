import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Category } from '../../types/tools'
import { CategoryIcon } from './CategoryIcon'

interface CategoryCardProps {
  category: Category
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const targetPath = category.path || `/tools?category=${category.id}`
  const countLabel = category.itemLabel || `${category.toolCount} Tools`

  return (
    <Link
      to={targetPath}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {/* Custom Vector Category Icon Container */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 p-2.5 shadow-2xs transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-sm">
            <CategoryIcon categoryId={category.id} size="lg" className="w-full h-full" />
          </div>

          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors">
            {countLabel}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {category.name}
        </h3>
        
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {category.tagline}
        </p>

        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {category.description}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
          Explore {category.name}
        </span>
        <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 ease-out group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
