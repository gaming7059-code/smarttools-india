import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Clock } from 'lucide-react'
import type { Tool } from '../../types/tools'
import { DynamicIcon } from './DynamicIcon'

interface ToolCardProps {
  tool: Tool
  onOpenPreview?: (tool: Tool) => void
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onOpenPreview }) => {
  const isReady = tool.isFunctional

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
            <DynamicIcon name={tool.icon} className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-1.5">
            {!isReady && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                <Clock className="h-2.5 w-2.5" /> Coming Soon
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {tool.categoryName}
            </span>
          </div>
        </div>

        {isReady ? (
          <Link to={tool.path}>
            <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {tool.name}
            </h3>
          </Link>
        ) : (
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {tool.name}
          </h3>
        )}

        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 line-clamp-2">
          {tool.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        {tool.isPopular && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            <Sparkles className="h-3 w-3" /> Popular
          </span>
        )}

        {isReady ? (
          <Link
            to={tool.path}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            title={`Open ${tool.name}`}
          >
            <span>Open Tool</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenPreview ? onOpenPreview(tool) : undefined}
            className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            title={`Preview ${tool.name}`}
          >
            <span>Open Tool</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}
