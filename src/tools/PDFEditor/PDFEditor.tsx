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
} from 'lucide-react'
import type { EditorToolMode, Annotation, PDFPageItem, HistoryState, DetectedTextItem } from './types'
import {
  loadPdfData,
  renderPdfPageToCanvas,
  createSamplePdf,
  exportEditedPdf,
  extractPageTextItems,
  type LoadedPdfResult,
} from './pdfEngine'
import { AnnotationLayer } from './AnnotationLayer'

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

export const PDFEditor: React.FC = () => {
  // Document state
  const [loadedPdf, setLoadedPdf] = useState<LoadedPdfResult | null>(null)
  const [pages, setPages] = useState<PDFPageItem[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0)
  const [annotations, setAnnotations] = useState<Annotation[]>([])

  // Editor tool state
  const [activeTool, setActiveTool] = useState<EditorToolMode>('select')
  const [selectedColor, setSelectedColor] = useState<string>('#2563eb')
  const [fontSize, setFontSize] = useState<number>(16)
  const [strokeWidth, setStrokeWidth] = useState<number>(3)
  const [zoom, setZoom] = useState<number>(1.0)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const [detectedTextItems, setDetectedTextItems] = useState<DetectedTextItem[]>([])
  const [isExtractingText, setIsExtractingText] = useState<boolean>(false)

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
  const renderTaskRef = useRef<number>(0)

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
  const handleLoadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please upload a valid PDF document (.pdf file format).')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await loadPdfData(file)
      setLoadedPdf(result)
      setPages(result.pages)
      setCurrentPageIndex(0)
      setAnnotations([])
      setHistory([])
      setRedoStack([])
      setSelectedAnnotationId(null)
      setZoom(1.0)
      setDetectedTextItems([])
    } catch (err: unknown) {
      console.error('[PDF ERROR] Failed to load PDF in handleLoadFile:', err)
      const errName = (err as { name?: string })?.name || ''
      const errMsg = (err as { message?: string })?.message || ''

      if (errName === 'PasswordException' || errMsg.toLowerCase().includes('password')) {
        setErrorMessage('This PDF is password-protected. Please unlock it before editing.')
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

    renderPdfPageToCanvas(
      loadedPdf.pdfDoc,
      currentPage.originalIndex,
      currentPage.rotation,
      zoom,
      canvasRef.current
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

    extractPageTextItems(loadedPdf.pdfDoc, page.originalIndex, page.rotation, canvasRef.current)
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
  const handleRotatePage = (index: number) => {
    const newPages = pages.map((p, i) =>
      i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    )
    pushHistory(newPages, annotations)
  }

  const handleDuplicatePage = (index: number) => {
    const targetPage = pages[index]
    const duplicatedPage: PDFPageItem = {
      ...targetPage,
      id: `page-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }
    const newPages = [...pages.slice(0, index + 1), duplicatedPage, ...pages.slice(index + 1)]
    const newAnns = annotations.map((a) => {
      if (a.pageIndex > index) return { ...a, pageIndex: a.pageIndex + 1 }
      return a
    })
    pushHistory(newPages, newAnns)
    setCurrentPageIndex(index + 1)
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

  const handleDeleteAnnotation = (id: string) => {
    pushHistory(
      pages,
      annotations.filter((a) => a.id !== id)
    )
    if (selectedAnnotationId === id) setSelectedAnnotationId(null)
  }

  // Export Trigger
  const handleExport = async () => {
    if (!loadedPdf) return
    setIsExporting(true)
    try {
      await exportEditedPdf(loadedPdf.arrayBuffer, pages, annotations, loadedPdf.fileName)
    } catch (err) {
      console.error('Export failed:', err)
      setErrorMessage('Failed to export edited PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleResetDocument = () => {
    if (window.confirm('Are you sure you want to close this PDF? Any unsaved edits will be lost.')) {
      setLoadedPdf(null)
      setPages([])
      setAnnotations([])
      setHistory([])
      setRedoStack([])
      setSelectedAnnotationId(null)
      setDetectedTextItems([])
      setErrorMessage(null)
    }
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
      <div className="space-y-6">
        {/* Privacy Highlight Badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-sm">
            <span className="font-bold">100% Client-Side Privacy: </span>
            Your PDF is processed entirely within your local browser memory. Files are never uploaded to any server or external cloud.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
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
              ? 'border-blue-500 bg-blue-50/50 dark:border-blue-400 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500'
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

          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            {isLoading ? (
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 sm:h-10 sm:w-10" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Upload PDF Document
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md text-sm sm:text-base mb-6">
            Drag and drop your PDF here, browse your files, or test immediately with our pre-built sample document.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>Browse PDF File</span>
            </button>

            <button
              type="button"
              onClick={handleSampleLoad}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 active:scale-95 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Try with Sample PDF</span>
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            Supports standard PDF documents (.pdf) up to 50MB
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Type className="h-4 w-4 text-blue-500" />
              <span>Annotate & Markup</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Add custom text, text boxes, freehand pen drawings, highlighters, rectangles, circles, and directional arrows.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <RotateCw className="h-4 w-4 text-blue-500" />
              <span>Page Management</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Rotate pages 90°, reorder pages up or down, duplicate important sheets, and delete unwanted pages with one click.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
            <div className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-500" />
              <span>Lossless Export</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Export high-resolution edited PDFs locally directly from your browser without watermarks or file size penalties.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 2. ACTIVE EDITOR STATE
  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl overflow-hidden">
      {/* Top Application Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-sm">
        {/* Document Info & Sidebar Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'Hide Page Thumbnails' : 'Show Page Thumbnails'}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
                {loadedPdf.fileName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {formatFileSize(loadedPdf.fileSize)} • {pages.length} {pages.length === 1 ? 'page' : 'pages'}
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls: Undo, Redo, Zoom, Export, Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Undo / Redo */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-slate-700 dark:text-slate-300 min-w-[44px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
              title="Zoom In"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.0)}
              title="Reset Zoom to 100%"
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-l border-slate-200 dark:border-slate-800"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          {/* Close Document */}
          <button
            type="button"
            onClick={handleResetDocument}
            title="Close document"
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm">
        {/* Tool selector buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {/* Select Mode */}
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            title="Selection & Move Tool"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'select'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MousePointer className="h-4 w-4" />
            <span className="hidden sm:inline">Select</span>
          </button>

          {/* Edit PDF Text (Native Text Redact/Replace) */}
          <button
            type="button"
            onClick={() => setActiveTool('editText')}
            title="Edit or Delete Existing PDF Text"
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

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Text Tool */}
          <button
            type="button"
            onClick={() => setActiveTool('text')}
            title="Add Text"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Text</span>
          </button>

          {/* Freehand Pen */}
          <button
            type="button"
            onClick={() => setActiveTool('draw')}
            title="Freehand Pen"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'draw'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Pen</span>
          </button>

          {/* Highlighter */}
          <button
            type="button"
            onClick={() => setActiveTool('highlight')}
            title="Highlighter"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'highlight'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Highlighter className="h-4 w-4" />
            <span className="hidden sm:inline">Highlight</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Rectangle */}
          <button
            type="button"
            onClick={() => setActiveTool('rectangle')}
            title="Rectangle"
            className={`p-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'rectangle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Square className="h-4 w-4" />
          </button>

          {/* Circle */}
          <button
            type="button"
            onClick={() => setActiveTool('circle')}
            title="Circle"
            className={`p-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'circle'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Circle className="h-4 w-4" />
          </button>

          {/* Line */}
          <button
            type="button"
            onClick={() => setActiveTool('line')}
            title="Line"
            className={`p-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'line'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Arrow */}
          <button
            type="button"
            onClick={() => setActiveTool('arrow')}
            title="Arrow"
            className={`p-1.5 rounded-lg font-medium transition-all ${
              activeTool === 'arrow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Tool options: Color, Size, Stroke */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Color Palette */}
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
                className={`w-5 h-5 rounded-full border transition-transform ${
                  selectedColor === c.value
                    ? 'ring-2 ring-blue-500 scale-110 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Font Size Selector (for text) */}
          {(activeTool === 'text' || activeTool === 'textbox') && (
            <div className="flex items-center gap-1 text-xs">
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
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
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
            <div className="flex items-center gap-1 text-xs">
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
                className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                {STROKE_WIDTHS.map((w) => (
                  <option key={w} value={w}>
                    {w}px
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
              title="Delete Selected Item"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          )}
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
        {/* Left Page Management Sidebar */}
        {isSidebarOpen && (
          <aside className="w-56 sm:w-64 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 flex flex-col flex-shrink-0 z-10 transition-all">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pages ({pages.length})
              </span>
              <span className="text-xs text-slate-400">Reorder & Rotate</span>
            </div>

            {/* Thumbnail / Page list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {pages.map((p, idx) => {
                const isActive = idx === currentPageIndex
                return (
                  <div
                    key={p.id}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`group relative p-2 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Page number & actions */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        {p.rotation !== 0 && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRotatePage(idx)
                          }}
                          title="Rotate 90°"
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <RotateCw className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicatePage(idx)
                          }}
                          title="Duplicate Page"
                          className="p-1 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePage(idx)
                          }}
                          disabled={pages.length <= 1}
                          title="Delete Page"
                          className="p-1 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Page order movers */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                      <span>Source: #{p.originalIndex + 1}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMovePage(idx, 'up')
                          }}
                          disabled={idx === 0}
                          title="Move Page Up"
                          className="p-0.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20"
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
                          className="p-0.5 rounded text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
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
    </div>
  )
}
