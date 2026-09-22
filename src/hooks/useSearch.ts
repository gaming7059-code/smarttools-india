import { useState, useMemo } from 'react'
import type { Tool } from '../types/tools'

export function useSearch(tools: Tool[]) {
  const [query, setQuery] = useState('')

  const filteredTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()
    if (!cleanQuery) return tools

    return tools.filter((tool) => {
      const matchName = tool.name.toLowerCase().includes(cleanQuery)
      const matchDesc = tool.description.toLowerCase().includes(cleanQuery)
      const matchCategory = tool.categoryName.toLowerCase().includes(cleanQuery)
      const matchKeywords = tool.keywords.some((k) => k.toLowerCase().includes(cleanQuery))
      return matchName || matchDesc || matchCategory || matchKeywords
    })
  }, [tools, query])

  return {
    query,
    setQuery,
    filteredTools,
    hasResults: filteredTools.length > 0,
  }
}
