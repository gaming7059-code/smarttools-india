import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Category } from '../../types/tools'


interface CategoryCardProps {
  category: Category
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  return (
    <Link
      to={`/tools?category=${category.id}`}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-800 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
            <span className="text-xl" role="img" aria-label={category.name}>
              {category.emoji}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            {category.toolCount} tools
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
          {category.name}
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {category.tagline}
        </p>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:text-blue-700">
        <span>Browse {category.name} tools</span>
        <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
