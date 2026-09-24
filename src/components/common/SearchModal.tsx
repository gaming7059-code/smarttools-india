import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
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
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div 
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3 focus-within:bg-blue-50/20 dark:focus-within:bg-blue-950/20 transition-colors duration-200">
          <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a tool (e.g., GST, EMI, Age, Percentage)..."
            className="w-full bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-2 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {query.trim() ? `Search Results (${filteredTools.length})` : 'Popular Tools'}
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
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
                className="w-full flex items-center justify-between p-3 rounded-xl text-left hover:bg-blue-50/50 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-[0.99] group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 group-hover:scale-105">
                    <DynamicIcon name={tool.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {tool.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors">
                    {tool.categoryName}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Press</span>
            <kbd className="rounded bg-white dark:bg-slate-800 px-1 border border-slate-200 dark:border-slate-700">Enter</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  )
}
