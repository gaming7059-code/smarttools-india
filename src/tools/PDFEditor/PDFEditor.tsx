import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload,
  FileText,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Download,
  MousePointer,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Pencil,
  Highlighter,
  Sliders,
  AlertCircle,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  ScanText,
  Search,
  Replace,
  Image as ImageIcon,
  PenTool,
  RotateCcw,
  LayoutGrid,
  FilePlus,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  StickyNote,
  Lock,
  Maximize,
  Minimize,
  CheckCircle2,
  Info,
  Check,
} from 'lucide-react'
import type {
  EditorToolMode,
  Annotation,
  PDFPageItem,
  HistoryState,
  DetectedTextItem,
  SourcePdfDocument,
  PdfSecuritySettings,
} from './types'
import {
  loadPdfData,
  renderPdfPageToCanvas,
  createSamplePdf,
  exportEditedPdf,
  extractPageTextItems,
  PasswordRequiredError,
  type LoadedPdfResult,
} from './pdfEngine'
import { AnnotationLayer } from './AnnotationLayer'
import { FindAndReplaceModal } from './FindAndReplaceModal'
import { SignatureModal } from './SignatureModal'
import { PageOrganizerModal } from './PageOrganizerModal'
import { SecurityModal } from './SecurityModal'
import { PasswordPromptModal } from './PasswordPromptModal'

const COLOR_PALETTE = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Dark', value: '#0f172a' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'White', value: '#ffffff' },
]

const FONT_SIZES = [12, 14, 16, 20, 24, 32, 40]
const STROKE_WIDTHS = [1, 2, 3, 5, 8, 12]

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function isTypingInInput(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null
  if (!target) return false
  const tagName = target.tagName?.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return true
  return false
}

interface TooltipProps {
  content: string
  shortcut?: string
  children: React.ReactNode
  placement?: 'top' | 'bottom'
}

const Tooltip: React.FC<TooltipProps> = ({ content, shortcut, children, placement = 'bottom' }) => {
  return (
    <div className="group/tooltip relative inline-flex items-center">
      {children}
      <div
        className={`absolute left-1/2 -translate-x-1/2 hidden group-hover/tooltip:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800/95 text-white text-[11px] font-medium whitespace-nowrap shadow-xl border border-slate-700/50 backdrop-blur-xs pointer-events-none z-50 animate-in fade-in duration-150 ${
          placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}
      >
        <span>{content}</span>
        {shortcut && (
          <kbd className="px-1 py-0.2 rounded bg-slate-800 dark:bg-slate-700 border border-slate-600/50 font-mono text-[9px] text-slate-300">
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  )
}

const SidebarThumbnail: React.FC<{
  page: PDFPageItem
  pdfDoc: any
  sourceDocs?: Record<string, SourcePdfDocument>
}> = ({ page, pdfDoc, sourceDocs }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    if (page.isBlank) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = 64
        canvas.height = 88
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 64, 88)
        setRendered(true)
      }
      return
    }

    const docToUse =
      (page.sourceDocId && sourceDocs?.[page.sourceDocId]?.pdfDoc) ||
      pdfDoc

    if (!docToUse) return

    renderPdfPageToCanvas(
      docToUse,
      page.originalIndex,
      page.rotation,
      0.15,
      canvas,
      false,
      page.width,
      page.height
    )
      .then(() => {
        if (!cancelled) setRendered(true)
      })
      .catch((err) => {
        console.warn('Sidebar thumbnail render error:', err)
      })

    return () => {
      cancelled = true
    }
  }, [page, pdfDoc, sourceDocs])

  return (
    <div className="relative w-12 sm:w-14 h-16 sm:h-20 flex items-center justify-center bg-white dark:bg-slate-800 rounded-sm shadow-2xs overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-700/80">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
      />
      {!rendered && !page.isBlank && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xs">
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}

interface EditorToast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  subMessage?: string
}

export const PDFEditor: React.FC = () => {
  // Document state
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdfResult | null>(null)
  const [pages, setPages] = useState<PDFPageItem[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Toast & Fullscreen UI states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [toasts, setToasts] = useState<EditorToast[]>([])

  // Editor tool state
  const [activeTool, setActiveTool] = useState<EditorToolMode>('select')
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb')
  const [fontSize, setFontSize] = useState<number>(16)
  const [strokeWidth, setStrokeWidth] = useState<number>(3)
  const [zoom, setZoom] = useState<number>(1.0)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [detectedTextItems, setDetectedTextItems] = useState<DetectedTextItem[]>([])
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false)

  // Find & Replace state
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState<boolean>(false)
  const [findReplaceTab, setFindReplaceTab] = useState<'find' | 'replace'>('find')
  const [findReplaceFocusNonce, setFindReplaceFocusNonce] = useState<number>(0)
  const [highlightedMatchId, setHighlightedMatchId] = useState<string | null>(null)

  // Signature state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false)

  // Page Organizer state
  const [isPageOrganizerOpen, setIsPageOrganizerOpen] = useState<boolean>(false)

  // Security & Password Protection state
  const [securitySettings, setSecuritySettings] = useState<PdfSecuritySettings | null>(null)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false)
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState<boolean>(false)
  const [pendingProtectedFile, setPendingProtectedFile] = useState<File | null>(null)
  const [passwordPromptError, setPasswordPromptError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false)

  // History state (undo / redo)
  const [history, setHistory] = useState<HistoryState[]>([])
  const [redoStack, setRedoStack] = useState<HistoryState[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageFileInputRef = useRef<HTMLInputElement | null>(null)
  const renderTaskRef = useRef<number>(0)

  // Toast notifications helper
  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string, subMessage?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((prev) => [...prev.slice(-2), { id, type, message, subMessage }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3500)
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Helper to push history state
  const pushHistory = useCallback(
    (newPages: PDFPageItem[], newAnns: Annotation[]) => {
      setHistory((prev) => [...prev.slice(-19), { pages, annotations }])
      setRedoStack([])
      setPages(newPages)
      setAnnotations(newAnns)
    },
    [pages, annotations]
  )

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setRedoStack((stack) => [...stack, { pages, annotations }])
    setHistory((stack) => stack.slice(0, stack.length - 1))
    setPages(prev.pages)
    setAnnotations(prev.annotations)
    if (currentPageIndex >= prev.pages.length) {
      setCurrentPageIndex(Math.max(0, prev.pages.length - 1))
    }
    setSelectedAnnotationId(null)
  }, [history, pages, annotations, currentPageIndex])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setHistory((stack) => [...stack, { pages, annotations }])
    setRedoStack((stack) => stack.slice(0, stack.length - 1))
    setPages(next.pages)
    setAnnotations(next.annotations)
    if (currentPageIndex >= next.pages.length) {
      setCurrentPageIndex(Math.max(0, next.pages.length - 1))
    }
    setSelectedAnnotationId(null)
  }, [redoStack, pages, annotations, currentPageIndex])

  // Process File Loading
  const handleLoadFile = async (file: File, password?: string) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf file format).')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await loadPdfData(file, password)
      setLoadedPdf(result)
      setPages(result.pages)
      setCurrentPageIndex(0)
      setAnnotations([])
      setHistory([])
      setRedoStack([])
      setSelectedAnnotationId(null)
      setZoom(1.0)
      setDetectedTextItems([])
      setSecuritySettings(null)
      setIsPasswordPromptOpen(false)
      setPendingProtectedFile(null)
      setPasswordPromptError(null)
      showToast(
        'success',
        'PDF Loaded Successfully',
        `${result.pages.length} ${result.pages.length === 1 ? 'page' : 'pages'} loaded in local memory`
      )
    } catch (err: unknown) {
      console.error('[PDF ERROR] Failed to load PDF in handleLoadFile:', err)
      const errName = (err as { name?: string })?.name || ''
      const errMsg = (err as { message?: string })?.message || ''

      if (
        err instanceof PasswordRequiredError ||
        errName === 'PasswordException' ||
        errMsg.toLowerCase().includes('password')
      ) {
        setPendingProtectedFile(file)
        setPasswordPromptError(password ? 'Incorrect password. Please try again.' : null)
        setIsPasswordPromptOpen(true)
        setErrorMessage(null)
      } else if (
        errName === 'InvalidPDFException' ||
        errMsg.toLowerCase().includes('invalid pdf') ||
        errMsg.toLowerCase().includes('corrupted')
      ) {
        setErrorMessage('This file is corrupted or is not a valid PDF.')
      } else if (import.meta.env.DEV) {
        setErrorMessage(`Could not open PDF: ${errName ? `${errName} - ` : ''}${errMsg || 'Unknown error'}`)
      } else {
        setErrorMessage(
          errMsg
            ? `Could not open PDF: ${errMsg}`
            : 'Unable to open this PDF document. Please check the file and try again.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlockAndLoad = async (password: string) => {
    if (!pendingProtectedFile) return
    setIsUnlocking(true)
    setPasswordPromptError(null)
    try {
      await handleLoadFile(pendingProtectedFile, password)
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleSampleLoad = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { file } = await createSamplePdf()
      await handleLoadFile(file)
    } catch (err) {
      console.error('Failed to generate sample PDF:', err)
      setErrorMessage('Failed to generate sample PDF.')
      setIsLoading(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleLoadFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleLoadFile(file)
    }
  }

  // Render current page to canvas whenever relevant state changes
  useEffect(() => {
    if (!loadedPdf || pages.length === 0 || !canvasRef.current) return

    const currentPage = pages[currentPageIndex]
    if (!currentPage) return

    const currentTaskId = ++renderTaskRef.current
    queueMicrotask(() => {
      if (renderTaskRef.current === currentTaskId) {
        setIsRendering(true)
      }
    })

    const docToRender =
      (currentPage.sourceDocId && loadedPdf.sourceDocs?.[currentPage.sourceDocId]?.pdfDoc) ||
      loadedPdf.pdfDoc

    renderPdfPageToCanvas(
      docToRender,
      currentPage.originalIndex,
      currentPage.rotation,
      zoom,
      canvasRef.current,
      currentPage.isBlank,
      currentPage.width,
      currentPage.height
    )
      .then(() => {
        if (renderTaskRef.current === currentTaskId) {
          setIsRendering(false)
        }
      })
      .catch((err) => {
        console.error('Error rendering page to canvas:', err)
        if (renderTaskRef.current === currentTaskId) {
          setIsRendering(false)
        }
      })
  }, [loadedPdf, pages, currentPageIndex, zoom])

  // Extract text items from current page whenever document, page, or rotation changes
  useEffect(() => {
    if (!loadedPdf || pages.length === 0) return

    const page = pages[currentPageIndex]
    if (!page) return

    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) {
        setIsExtractingText(true)
      }
    })

    const docToExtract =
      (page.sourceDocId && loadedPdf.sourceDocs?.[page.sourceDocId]?.pdfDoc) ||
      loadedPdf.pdfDoc

    extractPageTextItems(
      docToExtract,
      page.originalIndex,
      page.rotation,
      canvasRef.current,
      page.isBlank
    )
      .then((items) => {
        if (!cancelled) {
          setDetectedTextItems(items)
          setIsExtractingText(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to extract page text items:', err)
          setDetectedTextItems([])
          setIsExtractingText(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadedPdf, pages, currentPageIndex])

  // Page Operations
  const handleRotatePage = (index: number, degreesDelta: number = 90) => {
    const newPages = pages.map((p, i) =>
      i === index ? { ...p, rotation: ((p.rotation + degreesDelta) % 360 + 360) % 360 } : p
    )
    pushHistory(newPages, annotations)
    showToast('info', 'Page Rotated', `Page ${index + 1} rotated ${degreesDelta > 0 ? '90° CW' : '90° CCW'}`)
  }

  const handleDuplicatePage = (index: number) => {
    const targetPage = pages[index]
    const duplicatedPage: PDFPageItem = {
      ...targetPage,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    const newPages = [...pages.slice(0, index + 1), duplicatedPage, ...pages.slice(index + 1)]
    const clonedAnns = annotations
      .filter((a) => a.pageIndex === index)
      .map((a) => ({
        ...a,
        id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageIndex: index + 1,
      }))
    const shiftedAnns = annotations.map((a) =>
      a.pageIndex > index ? { ...a, pageIndex: a.pageIndex + 1 } : a
    )
    pushHistory(newPages, [...shiftedAnns, ...clonedAnns])
    setCurrentPageIndex(index + 1)
    showToast('success', 'Page Duplicated', `Duplicate of page ${index + 1} created`)
  }

  const handleQuickAddBlankPage = () => {
    const newBlankPage: PDFPageItem = {
      id: `page-blank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originalIndex: -1,
      rotation: 0,
      width: 595.28,
      height: 841.89,
      isBlank: true,
    }
    const insertIdx = currentPageIndex + 1
    const newPages = [...pages]
    newPages.splice(insertIdx, 0, newBlankPage)
    const newAnns = annotations.map((a) =>
      a.pageIndex >= insertIdx ? { ...a, pageIndex: a.pageIndex + 1 } : a
    )
    pushHistory(newPages, newAnns)
    setCurrentPageIndex(insertIdx)
    showToast('success', 'Blank Page Inserted', `Added after page ${currentPageIndex + 1}`)
  }

  const handleRegisterSourceDoc = (sourceDoc: SourcePdfDocument) => {
    setLoadedPdf((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sourceDocs: {
          ...(prev.sourceDocs || {}),
          [sourceDoc.id]: sourceDoc,
        },
      }
    })
  }

  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('Cannot delete the only remaining page in the document.')
      return
    }
    const newPages = pages.filter((_, i) => i !== index)
    const newAnns = annotations
      .filter((a) => a.pageIndex !== index)
      .map((a) => (a.pageIndex > index ? { ...a, pageIndex: a.pageIndex - 1 } : a))

    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1)
    } else if (currentPageIndex === index && index > 0) {
      setCurrentPageIndex(index - 1)
    }

    pushHistory(newPages, newAnns)
    showToast('info', 'Page Deleted', `Removed page ${index + 1}`)
  }

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= pages.length) return

    const newPages = [...pages]
    const temp = newPages[index]
    newPages[index] = newPages[targetIndex]
    newPages[targetIndex] = temp

    const newAnns = annotations.map((a) => {
      if (a.pageIndex === index) return { ...a, pageIndex: targetIndex }
      if (a.pageIndex === targetIndex) return { ...a, pageIndex: index }
      return a
    })

    if (currentPageIndex === index) {
      setCurrentPageIndex(targetIndex)
    } else if (currentPageIndex === targetIndex) {
      setCurrentPageIndex(index)
    }

    pushHistory(newPages, newAnns)
    showToast('info', 'Page Reordered', `Moved page ${index + 1} ${direction}`)
  }

  // Annotation handlers
  const handleAddAnnotation = (ann: Annotation) => {
    pushHistory(pages, [...annotations, ann])
    setSelectedAnnotationId(ann.id)
  }

  const handleUpdateAnnotation = (updated: Annotation) => {
    pushHistory(
      pages,
      annotations.map((a) => (a.id === updated.id ? updated : a))
    )
  }

  const handleDeleteAnnotation = useCallback(
    (id: string) => {
      pushHistory(
        pages,
        annotations.filter((a) => a.id !== id)
      )
      if (selectedAnnotationId === id) setSelectedAnnotationId(null)
    },
    [pages, annotations, selectedAnnotationId, pushHistory]
  )

  const handleBatchAddAnnotations = (newAnns: Annotation[]) => {
    if (newAnns.length === 0) return
    pushHistory(pages, [...annotations, ...newAnns])
  }

  // Comprehensive Productivity Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Search (Ctrl+F / Cmd+F)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        if (loadedPdf) {
          e.preventDefault()
          setFindReplaceTab('find')
          setIsFindReplaceOpen(true)
          setFindReplaceFocusNonce((n) => n + 1)
        }
        return
      }

      // 2. Find & Replace (Ctrl+H / Cmd+H)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
        if (loadedPdf) {
          e.preventDefault()
          setFindReplaceTab('replace')
          setIsFindReplaceOpen(true)
          setFindReplaceFocusNonce((n) => n + 1)
        }
        return
      }

      // If user is actively typing in an input, textarea or contenteditable element, do not hijack other keys
      if (isTypingInInput(e)) {
        return
      }

      // 3. Undo (Ctrl+Z / Cmd+Z) & Redo (Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault()
        handleRedo()
        return
      }

      // 4. Zoom shortcuts: Ctrl + '+' / '=' (Zoom in), Ctrl + '-' (Zoom out), Ctrl + '0' (Reset zoom)
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        setZoom((z) => Math.min(3.0, +(z + 0.1).toFixed(2)))
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoom(1.0)
        return
      }

      // 5. Escape: Dismiss selection, revert tool, exit fullscreen, or close modals
      if (e.key === 'Escape') {
        if (isFindReplaceOpen) {
          setIsFindReplaceOpen(false)
          setHighlightedMatchId(null)
          return
        }
        if (isSecurityModalOpen) {
          setIsSecurityModalOpen(false)
          return
        }
        if (isSignatureModalOpen) {
          setIsSignatureModalOpen(false)
          return
        }
        if (isPageOrganizerOpen) {
          setIsPageOrganizerOpen(false)
          return
        }
        if (selectedAnnotationId) {
          setSelectedAnnotationId(null)
          return
        }
        if (activeTool !== 'select') {
          setActiveTool('select')
          return
        }
        if (isFullscreen) {
          setIsFullscreen(false)
          return
        }
        return
      }

      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
        return
      }

      // 6. Delete / Backspace: Delete selected element (if no modal is open)
      const isAnyModalOpen =
        isFindReplaceOpen ||
        isSignatureModalOpen ||
        isPageOrganizerOpen ||
        isSecurityModalOpen ||
        isPasswordPromptOpen

      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedAnnotationId &&
        !isAnyModalOpen
      ) {
        e.preventDefault()
        handleDeleteAnnotation(selectedAnnotationId)
        return
      }

      // 7. Navigation: Page navigation & single-key tools (when no modal is open & no modifier keys)
      if (!isAnyModalOpen && pages.length > 0 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === 'PageDown' || e.key === 'ArrowRight') {
          if (currentPageIndex < pages.length - 1) {
            e.preventDefault()
            setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1))
          }
          return
        }
        if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
          if (currentPageIndex > 0) {
            e.preventDefault()
            setCurrentPageIndex((i) => Math.max(0, i - 1))
          }
          return
        }
        if (e.key === 'Home') {
          e.preventDefault()
          setCurrentPageIndex(0)
          return
        }
        if (e.key === 'End') {
          e.preventDefault()
          setCurrentPageIndex(pages.length - 1)
          return
        }

        // Quick Tool Switchers
        if (e.key === 'v' || e.key === 'V') {
          setActiveTool('select')
          return
        }
        if (e.key === 't' || e.key === 'T') {
          setActiveTool('text')
          return
        }
        if (e.key === 'd' || e.key === 'D') {
          setActiveTool('draw')
          return
        }
        if (e.key === 'e' || e.key === 'E') {
          setActiveTool('editText')
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    loadedPdf,
    pages.length,
    currentPageIndex,
    activeTool,
    selectedAnnotationId,
    isFindReplaceOpen,
    isSecurityModalOpen,
    isSignatureModalOpen,
    isPageOrganizerOpen,
    isPasswordPromptOpen,
    isFullscreen,
    toggleFullscreen,
    handleUndo,
    handleRedo,
    handleDeleteAnnotation,
  ])

  // Export Trigger
  const handleExport = async () => {
    if (!loadedPdf) return
    setIsExporting(true)
    try {
      await exportEditedPdf(
        loadedPdf.arrayBuffer,
        pages,
        annotations,
        loadedPdf.fileName,
        loadedPdf.sourceDocs,
        true,
        securitySettings
      )
      showToast('success', 'PDF Export Complete', 'Downloaded edited document successfully')
    } catch (err) {
      console.error('Export failed:', err)
      const errTxt = err instanceof Error ? err.message : 'Unknown error'
      setErrorMessage(`Failed to export edited PDF: ${errTxt}`)
      showToast('error', 'Export Failed', errTxt)
    } finally {
      setIsExporting(false)
    }
  }

  const handleResetDocument = () => {
    if (window.confirm('Are you sure you want to close this PDF? Any unsaved edits will be lost.')) {
      showToast('info', 'Document Closed', 'Workspace reset')
      setLoadedPdf(null)
      setPages([])
      setAnnotations([])
      setHistory([])
      setRedoStack([])
      setSelectedAnnotationId(null)
      setDetectedTextItems([])
      setErrorMessage(null)
      setIsFindReplaceOpen(false)
      setHighlightedMatchId(null)
      setIsSignatureModalOpen(false)
      setIsPageOrganizerOpen(false)
      setSecuritySettings(null)
      setIsSecurityModalOpen(false)
      setIsPasswordPromptOpen(false)
      setPendingProtectedFile(null)
      setPasswordPromptError(null)
    }
  }

  const handleImageFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return

      const img = new window.Image()
      img.onload = () => {
        const naturalW = img.naturalWidth || 400
        const naturalH = img.naturalHeight || 300
        const aspect = naturalW / naturalH

        // Default width: 35% of page width, calculate height maintaining aspect
        const pageAspect = effectivePageWidth / effectivePageHeight
        const normWidth = 0.35
        const normHeight = Math.max(0.04, Math.min(0.8, (normWidth / aspect) * pageAspect))

        const newAnn: Annotation = {
          id: `ann-img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pageIndex: currentPageIndex,
          type: 'image',
          x: Math.max(0.02, Math.min(1 - normWidth, (1 - normWidth) / 2)),
          y: Math.max(0.02, Math.min(1 - normHeight, (1 - normHeight) / 3)),
          width: normWidth,
          height: normHeight,
          imageUrl: dataUrl,
          originalImageUrl: dataUrl,
          rotation: 0,
        }

        handleAddAnnotation(newAnn)
        setActiveTool('select')
        setSelectedAnnotationId(newAnn.id)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleInsertSignature = (dataUrl: string, aspectRatio: number) => {
    const pageAspect = effectivePageWidth / effectivePageHeight
    const normWidth = 0.28
    const normHeight = Math.max(0.04, Math.min(0.5, (normWidth / (aspectRatio || 2.5)) * pageAspect))

    const newAnn: Annotation = {
      id: `sig-ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageIndex: currentPageIndex,
      type: 'signature',
      isSignature: true,
      x: Math.max(0.02, Math.min(1 - normWidth, (1 - normWidth) / 2)),
      y: Math.max(0.02, Math.min(1 - normHeight, 0.72)),
      width: normWidth,
      height: normHeight,
      imageUrl: dataUrl,
      originalImageUrl: dataUrl,
      rotation: 0,
    }

    handleAddAnnotation(newAnn)
    setActiveTool('select')
    setSelectedAnnotationId(newAnn.id)
  }

  const currentPage = pages[currentPageIndex]
  const isRotatedSideways = currentPage && (currentPage.rotation % 180 !== 0)
  const effectivePageWidth = currentPage
    ? (isRotatedSideways ? currentPage.height : currentPage.width)
    : 595
  const effectivePageHeight = currentPage
    ? (isRotatedSideways ? currentPage.width : currentPage.height)
    : 842

  // 1. EMPTY / UPLOAD STATE
  if (!loadedPdf) {
    return (
      <div className="relative space-y-6">
        {/* Ambient Decorative Background Glow */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-12 -left-12 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl animate-blob-1 dark:bg-blue-600/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-12 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl animate-blob-2 dark:bg-indigo-600/10" />

        {/* Privacy Highlight Badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-2xs backdrop-blur-xs animate-fade-in-up">
          <ShieldCheck className="h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm">
            <span className="font-bold">100% Client-Side Privacy: </span>
            Your PDF is processed entirely within your local browser memory. Files are never uploaded to any server or external cloud.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
            <div className="text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Upload Drop Zone Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 sm:p-14 border-2 border-dashed rounded-3xl transition-all duration-300 text-center ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/30 scale-[1.01] shadow-xl shadow-blue-500/10'
              : 'border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/70 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-md'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
            id="pdf-upload-input"
          />

          <div className="relative mb-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transition-transform duration-300 hover:scale-105">
              {isLoading ? (
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin" />
              ) : (
                <Upload className="h-8 w-8 sm:h-10 sm:w-10" />
              )}
            </div>
            {/* Subtle Pulsing Ring */}
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-subtle-pulse -z-10" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Upload PDF Document
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md text-sm sm:text-base mb-6">
            Drag and drop your PDF here, browse your device, or test immediately with our pre-built sample document.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>Browse PDF File</span>
            </button>

            <button
              type="button"
              onClick={handleSampleLoad}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 active:scale-95 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Try with Sample PDF</span>
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Supports standard PDF documents (.pdf) up to 50MB</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Zero Uploads</span>
          </div>
        </div>

        {/* Feature Highlights Grid (6 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <ScanText className="h-4 w-4 text-amber-500" />
              <span>Edit PDF Text</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Detect original text snippets and redact or replace existing wording with crisp vector typography.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-500" />
              <span>Markup & Annotations</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Add freehand pen notes, highlighters, underlines, strikethroughs, shapes, sticky notes, and images.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <PenTool className="h-4 w-4 text-indigo-500" />
              <span>Digital Signatures</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Draw handwritten signatures, type with calligraphy script fonts, or upload signature images for reuse.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-purple-500" />
              <span>Page Organizer</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rotate, reorder, duplicate, split, merge external files, extract pages, and add blank pages in memory.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>PDF Security & Encryption</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Set AES-256 passwords to protect sensitive documents with printing, copying, and modification permissions.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-2xs hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              <span>Lossless Local Export</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export high-resolution edited PDFs locally directly in your browser without watermarks or penalties.
            </p>
          </div>
        </div>

        {/* Password Prompt Modal for Protected PDFs */}
        {isPasswordPromptOpen && pendingProtectedFile && (
          <PasswordPromptModal
            isOpen={isPasswordPromptOpen}
            fileName={pendingProtectedFile.name}
            errorMessage={passwordPromptError}
            isLoading={isUnlocking}
            onSubmit={handleUnlockAndLoad}
            onCancel={() => {
              setIsPasswordPromptOpen(false)
              setPendingProtectedFile(null)
              setPasswordPromptError(null)
            }}
          />
        )}

        {/* Toast Notification Container */}
        {toasts.length > 0 && (
          <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                  toast.type === 'success'
                    ? 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900 dark:text-white ring-1 ring-emerald-500/20'
                    : toast.type === 'error'
                    ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900 dark:text-white ring-1 ring-rose-500/20'
                    : 'bg-white/95 dark:bg-slate-900/95 border-blue-500/30 text-slate-900 dark:text-white ring-1 ring-blue-500/20'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                  {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold leading-snug">{toast.message}</div>
                  {toast.subMessage && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {toast.subMessage}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 2. ACTIVE EDITOR STATE
  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden animate-in fade-in duration-200"
          : "flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl overflow-hidden transition-all duration-300"
      }
    >
      {/* Hidden Image File Upload Input */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
        onChange={handleImageFileInputChange}
        className="hidden"
      />

      {/* Top Application Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 backdrop-blur-md">
        {/* Document Info & Sidebar Toggle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Tooltip content={isSidebarOpen ? 'Hide Pages Panel' : 'Show Pages Panel'}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
          </Tooltip>

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-xs md:max-w-sm">
                  {loadedPdf.fileName}
                </span>
                {securitySettings?.enabled && (
                  <span
                    title={`Protected with ${securitySettings.algorithm} encryption`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    <span>Protected</span>
                  </span>
                )}
                {isFullscreen && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                    Zen Mode
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(loadedPdf.fileSize)} • {pages.length} {pages.length === 1 ? 'page' : 'pages'}
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls: Undo, Redo, Zoom, Fullscreen, Export, Close */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Undo / Redo Pill */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <Tooltip content="Undo" shortcut="Ctrl+Z">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Undo2 className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Redo" shortcut="Ctrl+Y">
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
            <Tooltip content="Zoom Out" shortcut="Ctrl+-">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
            </Tooltip>
            <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300 min-w-[44px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip content="Zoom In" shortcut="Ctrl++">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip content="Reset to 100%" shortcut="Ctrl+0">
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l border-slate-200 dark:border-slate-800"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>

          {/* Fullscreen Toggle */}
          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen / Zen Mode'} shortcut="F11 / Esc">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </Tooltip>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          {/* Close Document */}
          <Tooltip content="Close PDF">
            <button
              type="button"
              onClick={handleResetDocument}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Primary Editing Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
          {/* Select Mode */}
          <Tooltip content="Select & Move Tool" shortcut="v">
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'select'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MousePointer className="h-4 w-4" />
              <span className="hidden sm:inline">Select</span>
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Edit PDF Text */}
          <Tooltip content="Edit Existing PDF Text" shortcut="e">
            <button
              type="button"
              onClick={() => setActiveTool('editText')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTool === 'editText'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
            >
              {isExtractingText ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <ScanText className="h-4 w-4" />
              )}
              <span className="font-semibold">Edit PDF Text</span>
              {detectedTextItems.length > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTool === 'editText'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {detectedTextItems.length}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Search Text */}
          <Tooltip content="Search in Document" shortcut="Ctrl+F">
            <button
              type="button"
              onClick={() => {
                setFindReplaceTab('find')
                setIsFindReplaceOpen(true)
                setFindReplaceFocusNonce((n) => n + 1)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                isFindReplaceOpen && findReplaceTab === 'find'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-700 dark:text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
              }`}
            >
              <Search className="h-4 w-4" />
              <span className="font-semibold text-xs sm:text-sm">Search</span>
            </button>
          </Tooltip>

          {/* Find & Replace */}
          <Tooltip content="Find & Replace" shortcut="Ctrl+H">
            <button
              type="button"
              onClick={() => {
                setFindReplaceTab('replace')
                setIsFindReplaceOpen(true)
                setFindReplaceFocusNonce((n) => n + 1)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                isFindReplaceOpen && findReplaceTab === 'replace'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Replace className="h-4 w-4" />
              <span className="font-semibold text-xs sm:text-sm">Replace</span>
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Text Tool */}
          <Tooltip content="Add Free Text" shortcut="t">
            <button
              type="button"
              onClick={() => setActiveTool('text')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'text'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span>
            </button>
          </Tooltip>

          {/* Text Box */}
          <Tooltip content="Add Boxed Text">
            <button
              type="button"
              onClick={() => setActiveTool('textbox')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'textbox'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Type className="h-4 w-4 border border-current rounded-xs px-0.5" />
              <span className="hidden sm:inline">Box</span>
            </button>
          </Tooltip>

          {/* Sticky Note */}
          <Tooltip content="Add Sticky Note">
            <button
              type="button"
              onClick={() => setActiveTool('stickyNote')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'stickyNote'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
            >
              <StickyNote className="h-4 w-4 text-amber-500" />
              <span className="hidden sm:inline font-semibold">Note</span>
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Freehand Pen */}
          <Tooltip content="Freehand Pen" shortcut="d">
            <button
              type="button"
              onClick={() => setActiveTool('draw')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'draw'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Pen</span>
            </button>
          </Tooltip>

          {/* Highlighter */}
          <Tooltip content="Highlighter">
            <button
              type="button"
              onClick={() => setActiveTool('highlight')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'highlight'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Highlighter className="h-4 w-4" />
              <span className="hidden sm:inline">Highlight</span>
            </button>
          </Tooltip>

          {/* Underline */}
          <Tooltip content="Underline">
            <button
              type="button"
              onClick={() => setActiveTool('underline')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'underline'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
          </Tooltip>

          {/* Strikethrough */}
          <Tooltip content="Strikethrough">
            <button
              type="button"
              onClick={() => setActiveTool('strikethrough')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'strikethrough'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <StrikethroughIcon className="h-4 w-4" />
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Shapes */}
          <Tooltip content="Rectangle">
            <button
              type="button"
              onClick={() => setActiveTool('rectangle')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'rectangle'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Square className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Circle">
            <button
              type="button"
              onClick={() => setActiveTool('circle')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'circle'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Circle className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Straight Line">
            <button
              type="button"
              onClick={() => setActiveTool('line')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'line'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Minus className="h-4 w-4" />
            </button>
          </Tooltip>

          <Tooltip content="Arrow">
            <button
              type="button"
              onClick={() => setActiveTool('arrow')}
              className={`p-1.5 rounded-lg font-medium transition-all ${
                activeTool === 'arrow'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Media & Sign */}
          <Tooltip content="Insert Image">
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ImageIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Image</span>
            </button>
          </Tooltip>

          <Tooltip content="Digital Signature">
            <button
              type="button"
              onClick={() => setIsSignatureModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer"
            >
              <PenTool className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold">Sign</span>
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

          {/* Document Tools */}
          <Tooltip content="Page Organizer & Split/Merge">
            <button
              type="button"
              onClick={() => setIsPageOrganizerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden md:inline font-medium">Pages</span>
            </button>
          </Tooltip>

          <Tooltip content="PDF Security & Permissions">
            <button
              type="button"
              onClick={() => setIsSecurityModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                securitySettings?.enabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {securitySettings?.enabled ? (
                <ShieldCheck className="h-4 w-4 text-white" />
              ) : (
                <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              )}
              <span className="hidden md:inline font-medium">Protect</span>
              {securitySettings?.enabled && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-700 text-white">
                  ON
                </span>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Tool Options Context Sub-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Color Palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium hidden sm:inline">Color:</span>
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.value)
                    if (selectedAnnotationId) {
                      const target = annotations.find((a) => a.id === selectedAnnotationId)
                      if (target) {
                        handleUpdateAnnotation({
                          ...target,
                          color: c.value,
                          strokeColor: c.value,
                        })
                      }
                    }
                  }}
                  title={c.name}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    selectedColor === c.value
                      ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 scale-110 shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Font Size Selector (for text) */}
          {(activeTool === 'text' || activeTool === 'textbox') && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Size:</span>
              <select
                value={fontSize}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setFontSize(val)
                  if (selectedAnnotationId) {
                    const target = annotations.find((a) => a.id === selectedAnnotationId)
                    if (target) handleUpdateAnnotation({ ...target, fontSize: val })
                  }
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden text-xs cursor-pointer"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}px
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stroke Width Selector (for pen/shapes) */}
          {activeTool !== 'text' && activeTool !== 'textbox' && activeTool !== 'select' && (
            <div className="flex items-center gap-1.5 text-xs">
              <Sliders className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={strokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setStrokeWidth(val)
                  if (selectedAnnotationId) {
                    const target = annotations.find((a) => a.id === selectedAnnotationId)
                    if (target) handleUpdateAnnotation({ ...target, strokeWidth: val })
                  }
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden text-xs cursor-pointer"
              >
                {STROKE_WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w}px Stroke
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Delete active selected element */}
          {selectedAnnotationId && (
            <button
              type="button"
              onClick={() => handleDeleteAnnotation(selectedAnnotationId)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Element (Del)</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block">
          {activeTool === 'select' && 'Click any element to select, move or resize'}
          {activeTool === 'editText' && 'Click highlighted text to edit or redact'}
          {activeTool === 'text' && 'Click anywhere on page to place text'}
          {activeTool === 'textbox' && 'Click and drag on page to place text box'}
          {activeTool === 'draw' && 'Draw freely with pen'}
          {activeTool === 'highlight' && 'Draw to highlight text or diagrams'}
          {(activeTool === 'rectangle' || activeTool === 'circle' || activeTool === 'line' || activeTool === 'arrow') &&
            'Click and drag on canvas to draw shape'}
        </div>
      </div>

      {/* Edit PDF Text Guidance Banner */}
      {activeTool === 'editText' && (
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ScanText className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>
              <strong>Edit PDF Text Mode:</strong> Click any detected text snippet (highlighted in blue) or drag a box over any text area to <strong>Edit/Replace</strong> or <strong>Delete</strong> it.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className="text-xs px-2.5 py-1 rounded bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 font-semibold cursor-pointer transition-colors"
          >
            Done Editing
          </button>
        </div>
      )}

      {/* Main Workspace Area: Sidebar + Canvas */}
      <div className="flex flex-1 min-h-[550px] relative overflow-hidden bg-slate-100/70 dark:bg-slate-950/60">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Page Management Sidebar */}
        {isSidebarOpen && (
          <aside className="fixed inset-y-0 left-0 z-40 md:static md:z-10 w-64 sm:w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:bg-white/90 md:dark:bg-slate-900/80 backdrop-blur-md flex flex-col flex-shrink-0 shadow-2xl md:shadow-none transition-all">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
                  Pages ({pages.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip content="Add Blank Page">
                  <button
                    type="button"
                    onClick={handleQuickAddBlankPage}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <FilePlus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">+ Blank</span>
                  </button>
                </Tooltip>
                <Tooltip content="Organize & Manage Pages">
                  <button
                    type="button"
                    onClick={() => setIsPageOrganizerOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Organize</span>
                  </button>
                </Tooltip>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg ml-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail / Page list */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5 scrollbar-thin">
              {pages.map((p, idx) => {
                const isActive = idx === currentPageIndex
                return (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`group relative p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Real PDF Canvas Miniature Thumbnail */}
                      <SidebarThumbnail
                        page={p}
                        pdfDoc={loadedPdf.pdfDoc}
                        sourceDocs={loadedPdf.sourceDocs}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Page number badge & status */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              Page {idx + 1}
                            </span>
                            {p.isBlank && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                                Blank
                              </span>
                            )}
                          </div>
                          {p.rotation !== 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.rotation}°
                            </span>
                          )}
                        </div>

                        {/* Action buttons with tooltips */}
                        <div className="flex items-center gap-0.5 pt-1">
                          <Tooltip content="Rotate 90° CCW" placement="top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRotatePage(idx, -90)
                              }}
                              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Rotate 90° CW" placement="top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRotatePage(idx, 90)
                              }}
                              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <RotateCw className="h-3 w-3" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Duplicate Page" placement="top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDuplicatePage(idx)
                              }}
                              className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </Tooltip>
                          <Tooltip content="Delete Page" placement="top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeletePage(idx)
                              }}
                              disabled={pages.length <= 1}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Tooltip>
                        </div>

                        {/* Page reordering up/down */}
                        <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                          <span>Src: #{p.originalIndex + 1}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMovePage(idx, 'up')
                              }}
                              disabled={idx === 0}
                              title="Move Page Up"
                              className="p-0.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMovePage(idx, 'down')
                              }}
                              disabled={idx === pages.length - 1}
                              title="Move Page Down"
                              className="p-0.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>
        )}

        {/* Center Viewport */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-auto min-h-[500px]">
          {/* Canvas Wrapper with Box Shadow */}
          <div
            className="relative shadow-2xl rounded-sm transition-all"
            style={{
              width: effectivePageWidth * zoom,
              height: effectivePageHeight * zoom,
            }}
          >
            {/* The rendered PDF Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 bg-white"
              style={{
                width: effectivePageWidth * zoom,
                height: effectivePageHeight * zoom,
              }}
            />

            {/* Interactive Annotation Overlay */}
            <AnnotationLayer
              pageIndex={currentPageIndex}
              pageWidth={effectivePageWidth}
              pageHeight={effectivePageHeight}
              scale={zoom}
              activeTool={activeTool}
              selectedColor={selectedColor}
              fontSize={fontSize}
              strokeWidth={strokeWidth}
              annotations={annotations}
              selectedAnnotationId={selectedAnnotationId}
              detectedTextItems={detectedTextItems}
              highlightedMatchId={highlightedMatchId}
              onSelectAnnotation={setSelectedAnnotationId}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
            />

            {/* Rendering Spinner Overlay */}
            {isRendering && (
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Page Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-sm text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPageIndex + 1} of {pages.length}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          Click and drag to markup • Select elements to move or resize
        </div>
      </div>

      {/* Find & Replace Floating Modal */}
      {isFindReplaceOpen && loadedPdf && (
        <FindAndReplaceModal
          isOpen={isFindReplaceOpen}
          initialTab={findReplaceTab}
          focusNonce={findReplaceFocusNonce}
          onClose={() => {
            setIsFindReplaceOpen(false)
            setHighlightedMatchId(null)
          }}
          pages={pages}
          currentPageIndex={currentPageIndex}
          onNavigateToPage={(pageIdx) => setCurrentPageIndex(pageIdx)}
          detectedTextItems={detectedTextItems}
          pdfDoc={loadedPdf.pdfDoc}
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onBatchAddAnnotations={handleBatchAddAnnotations}
          onHighlightMatch={setHighlightedMatchId}
        />
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onInsertSignature={handleInsertSignature}
        />
      )}

      {/* Page Organizer Modal */}
      {isPageOrganizerOpen && loadedPdf && (
        <PageOrganizerModal
          isOpen={isPageOrganizerOpen}
          onClose={() => setIsPageOrganizerOpen(false)}
          pages={pages}
          currentPageIndex={currentPageIndex}
          annotations={annotations}
          sourceDocs={loadedPdf.sourceDocs}
          originalArrayBuffer={loadedPdf.arrayBuffer}
          baseFileName={loadedPdf.fileName}
          onUpdatePagesAndAnnotations={(newPages, newAnns) => pushHistory(newPages, newAnns)}
          onSelectPage={(pageIdx) => setCurrentPageIndex(pageIdx)}
          onRegisterSourceDoc={handleRegisterSourceDoc}
        />
      )}

      {/* PDF Security Modal */}
      {isSecurityModalOpen && (
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          currentSettings={securitySettings}
          onSaveSettings={(settings) => setSecuritySettings(settings)}
        />
      )}

      {/* Password Prompt Modal for Protected PDFs */}
      {isPasswordPromptOpen && pendingProtectedFile && (
        <PasswordPromptModal
          isOpen={isPasswordPromptOpen}
          fileName={pendingProtectedFile.name}
          errorMessage={passwordPromptError}
          isLoading={isUnlocking}
          onSubmit={handleUnlockAndLoad}
          onCancel={() => {
            setIsPasswordPromptOpen(false)
            setPendingProtectedFile(null)
            setPasswordPromptError(null)
          }}
        />
      )}

      {/* Exporting Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-sm text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Exporting Document</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Preserving vector fonts, high-definition annotations and layout...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 duration-200 ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/30 text-rose-100'
                  : 'bg-slate-900/90 border-slate-700/50 text-white'
              }`}
            >
              <div className="pt-0.5">
                {toast.type === 'success' && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />}
                {toast.type === 'info' && <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight">{toast.message}</p>
                {toast.subMessage && (
                  <p className="text-[11px] text-slate-300/80 mt-0.5 leading-snug">{toast.subMessage}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
