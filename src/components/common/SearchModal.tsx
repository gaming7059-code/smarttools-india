import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react'
import { POPULAR_TOOLS } from '../../data/toolsData'
import type { Tool } from '../../types/tools'
import { DynamicIcon } from './DynamicIcon'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTool: (tool: Tool) => void
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
}) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])



  const filteredTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return POPULAR_TOOLS.slice(0, 6)

    return POPULAR_TOOLS.filter((tool) => {
      const matchName = tool.name.toLowerCase().includes(cleanQuery)
      const matchDesc = tool.description.toLowerCase().includes(cleanQuery)
      const matchCategory = tool.categoryName.toLowerCase().includes(cleanQuery)
      const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(cleanQuery))
      return matchName || matchDesc || matchCategory || matchKeywords
    })
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a tool (e.g., GST, EMI, Age, Percentage)..."
            className="w-full bg-transparent text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {query.trim() ? `Search Results (${filteredTools.length})` : 'Popular Tools'}
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No tools matching &ldquo;{query}&rdquo; found.
            </div>
          ) : (
            filteredTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  onSelectTool(tool)
                  onClose()
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <DynamicIcon name={tool.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1">
                      {tool.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {tool.categoryName}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3.5 w-3.5" /> Press Enter or Click to view tool
          </span>
          <span>100% Free &amp; Browser-based</span>
        </div>
      </div>
    </div>
  )
}
