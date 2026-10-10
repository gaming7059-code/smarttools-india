import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Replace,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  WholeWord,
  CheckCircle2,
} from 'lucide-react'
import type { PDFPageItem, Annotation, DetectedTextItem } from './types'
import { extractPageTextItems } from './pdfEngine'
import type * as pdfjsLib from 'pdfjs-dist'

export interface FindMatch {
  pageIndex: number
  item: DetectedTextItem
}

interface FindAndReplaceModalProps {
  isOpen: boolean
  onClose: () => void
  pages: PDFPageItem[]
  currentPageIndex: number
  onNavigateToPage: (pageIndex: number) => void
  detectedTextItems: DetectedTextItem[]
  pdfDoc: pdfjsLib.PDFDocumentProxy | null
  annotations?: Annotation[]
  onAddAnnotation: (ann: Annotation) => void
  onBatchAddAnnotations: (anns: Annotation[]) => void
  onHighlightMatch: (matchId: string | null) => void
  initialTab?: 'find' | 'replace'
  focusNonce?: number
}

let findReplaceCounter = 0
function generateId(): string {
  findReplaceCounter += 1
  return `find-rep-${Date.now()}-${findReplaceCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export const FindAndReplaceModal: React.FC<FindAndReplaceModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  onNavigateToPage,
  detectedTextItems,
  pdfDoc,
  onAddAnnotation,
  onBatchAddAnnotations,
  onHighlightMatch,
  initialTab = 'find',
  focusNonce = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'find' | 'replace'>(initialTab)
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    setActiveTab(initialTab)
  }
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [scope, setScope] = useState<'currentPage' | 'allPages'>('currentPage')

  const findInputRef = React.useRef<HTMLInputElement | null>(null)

  // Cache for text items of other pages when searching all pages
  const [docTextItems, setDocTextItems] = useState<Map<number, DetectedTextItem[]>>(new Map())
  const [isLoadingDocText, setIsLoadingDocText] = useState(false)

  const [currentMatchIdx, setCurrentMatchIdx] = useState(0)
  const [notification, setNotification] = useState<string | null>(null)

  // Clear notification after 3 seconds
  useEffect(() => {
    if (!notification) return
    const timer = setTimeout(() => setNotification(null), 3500)
    return () => clearTimeout(timer)
  }, [notification])

  // Pre-load all page text items if scope is allPages and doc is present
  useEffect(() => {
    if (!isOpen || scope !== 'allPages' || !pdfDoc) return

    let isCancelled = false
    const loadAllPages = async () => {
      setIsLoadingDocText(true)
      const newMap = new Map<number, DetectedTextItem[]>()
      for (let i = 0; i < pages.length; i++) {
        if (isCancelled) break
        const page = pages[i]
        try {
          const items = await extractPageTextItems(pdfDoc, page.originalIndex, page.rotation, null)
          newMap.set(i, items)
        } catch (err) {
          console.error(`Failed to extract text for page ${i}:`, err)
        }
      }
      if (!isCancelled) {
        setDocTextItems(newMap)
        setIsLoadingDocText(false)
      }
    }

    loadAllPages()
    return () => {
      isCancelled = true
    }
  }, [isOpen, scope, pdfDoc, pages])

  // Compute all matches in current scope
  const matches: FindMatch[] = useMemo(() => {
    const trimmed = findText.trim()
    if (!trimmed) return []

    // Build regex
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped
    const flags = matchCase ? 'g' : 'gi'

    let regex: RegExp
    try {
      regex = new RegExp(pattern, flags)
    } catch {
      return []
    }

    const found: FindMatch[] = []

    if (scope === 'currentPage') {
      for (const item of detectedTextItems) {
        if (regex.test(item.str)) {
          found.push({ pageIndex: currentPageIndex, item })
        }
      }
    } else {
      // All pages
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pageItems = pIdx === currentPageIndex ? detectedTextItems : docTextItems.get(pIdx) || []
        for (const item of pageItems) {
          if (regex.test(item.str)) {
            found.push({ pageIndex: pIdx, item })
          }
        }
      }
    }

    return found
  }, [
    findText,
    matchCase,
    wholeWord,
    scope,
    currentPageIndex,
    detectedTextItems,
    docTextItems,
    pages.length,
  ])

  const effectiveMatchIdx = matches.length === 0 ? 0 : Math.min(currentMatchIdx, matches.length - 1)

  // Update highlighted match on page
  useEffect(() => {
    if (!isOpen || matches.length === 0) {
      onHighlightMatch(null)
      return
    }

    const activeMatch = matches[effectiveMatchIdx]
    if (activeMatch) {
      onHighlightMatch(activeMatch.item.id)
      if (activeMatch.pageIndex !== currentPageIndex) {
        onNavigateToPage(activeMatch.pageIndex)
      }
    }
  }, [effectiveMatchIdx, matches, isOpen, currentPageIndex, onNavigateToPage, onHighlightMatch])

  const handleNextMatch = useCallback(() => {
    if (matches.length <= 1) return
    setCurrentMatchIdx((prev) => (prev + 1) % matches.length)
  }, [matches.length])

  const handlePrevMatch = useCallback(() => {
    if (matches.length <= 1) return
    setCurrentMatchIdx((prev) => (prev - 1 + matches.length) % matches.length)
  }, [matches.length])

  // Auto-focus and select find input when opening modal
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        findInputRef.current?.focus()
        findInputRef.current?.select()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, focusNonce, activeTab])

  // Global keyboard shortcuts when search modal is open
  useEffect(() => {
    if (!isOpen) return

    const handleModalKeyDown = (e: KeyboardEvent) => {
      // Escape: Close search dialog
      if (e.key === 'Escape') {
        e.preventDefault()
        onHighlightMatch(null)
        onClose()
        return
      }

      // F3 or Ctrl+G: Next match
      if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && (e.key === 'g' || e.key === 'G'))) {
        e.preventDefault()
        if (e.shiftKey) {
          handlePrevMatch()
        } else {
          handleNextMatch()
        }
        return
      }
    }

    window.addEventListener('keydown', handleModalKeyDown)
    return () => window.removeEventListener('keydown', handleModalKeyDown)
  }, [isOpen, handleNextMatch, handlePrevMatch, onClose, onHighlightMatch])

  // Replace single match
  const handleReplaceSingle = () => {
    if (matches.length === 0) return
    const active = matches[effectiveMatchIdx]
    if (!active) return

    const escaped = findText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped
    const regex = new RegExp(pattern, matchCase ? '' : 'i')

    const newText = active.item.str.replace(regex, replaceText)

    const ann: Annotation = {
      id: generateId(),
      pageIndex: active.pageIndex,
      type: 'text',
      isPdfTextReplacement: true,
      x: active.item.x,
      y: active.item.y,
      width: active.item.width,
      height: active.item.height,
      text: newText,
      fontSize: active.item.fontSize,
      fontName: active.item.fontName,
      fontFamily: active.item.fontFamily,
      color: active.item.color || '#000000',
      backgroundColor: active.item.backgroundColor || '#ffffff',
      isBold: active.item.isBold,
      isItalic: active.item.isItalic,
      isUnderline: active.item.isUnderline,
      textAlign: active.item.textAlign,
      lineSpacing: active.item.lineSpacing,
      isMonospace: active.item.isMonospace,
      isSerif: active.item.isSerif,
      pdfX: active.item.pdfX,
      pdfY: active.item.pdfY,
      pdfWidth: active.item.pdfWidth,
      pdfHeight: active.item.pdfHeight,
      autoFit: true,
      rotation: active.item.rotation || 0,
      strokeWidth: 0,
      strokeColor: 'transparent',
    }

    onAddAnnotation(ann)
    setNotification('Replaced 1 occurrence.')

    if (matches.length > 1) {
      handleNextMatch()
    }
  }

  // Replace All in scope
  const handleReplaceAll = () => {
    if (matches.length === 0) return

    const escaped = findText.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped
    const regex = new RegExp(pattern, matchCase ? 'g' : 'gi')

    const newAnns: Annotation[] = []

    for (const match of matches) {
      const newText = match.item.str.replace(regex, replaceText)
      const ann: Annotation = {
        id: generateId(),
        pageIndex: match.pageIndex,
        type: 'text',
        isPdfTextReplacement: true,
        x: match.item.x,
        y: match.item.y,
        width: match.item.width,
        height: match.item.height,
        text: newText,
        fontSize: match.item.fontSize,
        fontName: match.item.fontName,
        fontFamily: match.item.fontFamily,
        color: match.item.color || '#000000',
        backgroundColor: match.item.backgroundColor || '#ffffff',
        isBold: match.item.isBold,
        isItalic: match.item.isItalic,
        isUnderline: match.item.isUnderline,
        textAlign: match.item.textAlign,
        lineSpacing: match.item.lineSpacing,
        isMonospace: match.item.isMonospace,
        isSerif: match.item.isSerif,
        pdfX: match.item.pdfX,
        pdfY: match.item.pdfY,
        pdfWidth: match.item.pdfWidth,
        pdfHeight: match.item.pdfHeight,
        autoFit: true,
        rotation: match.item.rotation || 0,
        strokeWidth: 0,
        strokeColor: 'transparent',
      }
      newAnns.push(ann)
    }

    onBatchAddAnnotations(newAnns)
    setNotification(`Successfully replaced all ${newAnns.length} occurrences!`)
    onHighlightMatch(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-20 right-6 z-50 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 text-xs animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
      {/* Header with Mode Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'find'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('replace')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'replace'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Replace className="h-3.5 w-3.5" />
            <span>Find & Replace</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            onHighlightMatch(null)
            onClose()
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 text-[11px] font-medium animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Find Input */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            <span>Search in document:</span>
            {findText.trim() && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  matches.length > 0
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                }`}
              >
                {matches.length > 0
                  ? `${effectiveMatchIdx + 1} of ${matches.length} matches`
                  : '0 matches'}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              ref={findInputRef}
              type="text"
              autoFocus
              value={findText}
              onChange={(e) => {
                setFindText(e.target.value)
                setCurrentMatchIdx(0)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (e.shiftKey) handlePrevMatch()
                  else handleNextMatch()
                }
              }}
              placeholder="Search text in document (Press Enter)..."
              className="w-full pl-2.5 pr-16 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {/* Inline Nav Arrows */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevMatch}
                disabled={matches.length === 0}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                title="Previous Match (Shift+Enter / Shift+F3)"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMatch}
                disabled={matches.length === 0}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer"
                title="Next Match (Enter / F3)"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Replace Input (Only visible in Replace tab) */}
        {activeTab === 'replace' && (
          <div className="flex flex-col gap-1 animate-in fade-in duration-150">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Replace with:
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleReplaceSingle()
                }
              }}
              placeholder="New replacement text..."
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Options Row */}
        <div className="flex items-center justify-between gap-1 pt-1 text-[11px] flex-wrap">
          <div className="flex items-center gap-1">
            {/* Match Case */}
            <button
              type="button"
              onClick={() => setMatchCase(!matchCase)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                matchCase
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Match Case"
            >
              <CaseSensitive className="h-3.5 w-3.5" />
              <span>Aa</span>
            </button>

            {/* Whole Word */}
            <button
              type="button"
              onClick={() => setWholeWord(!wholeWord)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                wholeWord
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title="Match Whole Word"
            >
              <WholeWord className="h-3.5 w-3.5" />
              <span>Word</span>
            </button>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
            <button
              type="button"
              onClick={() => setScope('currentPage')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                scope === 'currentPage'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              This Page
            </button>
            <button
              type="button"
              onClick={() => setScope('allPages')}
              className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                scope === 'allPages'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Pages {isLoadingDocText && '...'}
            </button>
          </div>
        </div>

        {/* Action Buttons for Find Mode */}
        {activeTab === 'find' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevMatch}
              disabled={matches.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Match (Shift+Enter / Shift+F3)"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={handleNextMatch}
              disabled={matches.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Match (Enter / F3)"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Next</span>
            </button>
          </div>
        )}

        {/* Action Buttons for Replace Mode */}
        {activeTab === 'replace' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReplaceSingle}
              disabled={matches.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Replace className="h-3.5 w-3.5" />
              <span>Replace</span>
            </button>

            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={matches.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Replace className="h-3.5 w-3.5" />
              <span>Replace All ({matches.length})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
