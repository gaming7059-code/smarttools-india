import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  LayoutGrid,
  Plus,
  FilePlus,
  Files,
  Split,
  Download,
  RotateCw,
  RotateCcw,
  Copy,
  Trash2,
  CheckSquare,
  Square,
  MoveLeft,
  MoveRight,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import type { PDFPageItem, Annotation, SourcePdfDocument } from './types'
import {
  renderPdfPageToCanvas,
  loadPdfData,
  exportSelectedPagesPdf,
  splitPdf,
  type SplitRange,
} from './pdfEngine'

interface PageOrganizerModalProps {
  isOpen: boolean
  onClose: () => void
  pages: PDFPageItem[]
  currentPageIndex: number
  annotations: Annotation[]
  sourceDocs?: Record<string, SourcePdfDocument>
  originalArrayBuffer: ArrayBuffer
  baseFileName: string
  onUpdatePagesAndAnnotations: (newPages: PDFPageItem[], newAnns: Annotation[]) => void
  onSelectPage: (index: number) => void
  onRegisterSourceDoc?: (sourceDoc: SourcePdfDocument) => void
}

type ActiveDialog = 'none' | 'addBlank' | 'insertPdf' | 'mergePdf' | 'splitPdf'

export const PageOrganizerModal: React.FC<PageOrganizerModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  annotations,
  sourceDocs,
  originalArrayBuffer,
  baseFileName,
  onUpdatePagesAndAnnotations,
  onSelectPage,
  onRegisterSourceDoc,
}) => {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([currentPageIndex])
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>('none')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)

  // Dialog State: Add Blank Page
  const [blankPagePreset, setBlankPagePreset] = useState<'a4-portrait' | 'a4-landscape' | 'letter-portrait' | 'letter-landscape'>('a4-portrait')
  const [blankInsertPos, setBlankInsertPos] = useState<'after' | 'before' | 'start' | 'end'>('after')

  // Dialog State: Insert PDF
  const insertFileInputRef = useRef<HTMLInputElement | null>(null)
  const [insertedFile, setInsertedFile] = useState<File | null>(null)
  const [insertedFilePageCount, setInsertedFilePageCount] = useState<number>(0)
  const [insertPageRange, setInsertPageRange] = useState<string>('all')
  const [insertPdfPos, setInsertPdfPos] = useState<'after' | 'before' | 'start' | 'end'>('after')

  // Dialog State: Merge PDFs
  const mergeFileInputRef = useRef<HTMLInputElement | null>(null)
  const [mergeFiles, setMergeFiles] = useState<File[]>([])

  // Dialog State: Split PDF
  const [splitMode, setSplitMode] = useState<'single' | 'atCurrent' | 'custom'>('atCurrent')
  const [customSplitRanges, setCustomSplitRanges] = useState<string>('')

  // Escape key handling
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (activeDialog !== 'none') {
          setActiveDialog('none')
          setDialogError(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeDialog, onClose])

  // Map old indices to new indices during page reordering
  const reorderAnns = useCallback(
    (fromIdx: number, toIdx: number, currentAnns: Annotation[]): Annotation[] => {
      const mapIdx = (oldIdx: number): number => {
        if (oldIdx === fromIdx) return toIdx
        if (fromIdx < toIdx) {
          if (oldIdx > fromIdx && oldIdx <= toIdx) return oldIdx - 1
        } else {
          if (oldIdx >= toIdx && oldIdx < fromIdx) return oldIdx + 1
        }
        return oldIdx
      }
      return currentAnns.map((a) => ({
        ...a,
        pageIndex: mapIdx(a.pageIndex),
      }))
    },
    []
  )

  // Selection toggles
  const toggleSelectPage = (idx: number, e?: React.MouseEvent) => {
    if (e?.shiftKey && selectedIndices.length > 0) {
      const lastSelected = selectedIndices[selectedIndices.length - 1]
      const start = Math.min(lastSelected, idx)
      const end = Math.max(lastSelected, idx)
      const range: number[] = []
      for (let i = start; i <= end; i++) range.push(i)
      setSelectedIndices((prev) => [...new Set([...prev, ...range])])
    } else {
      setSelectedIndices((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      )
    }
  }

  const handleSelectAll = () => setSelectedIndices(pages.map((_, i) => i))
  const handleDeselectAll = () => setSelectedIndices([])
  const handleSelectOdd = () => setSelectedIndices(pages.map((_, i) => i).filter((i) => i % 2 === 0))
  const handleSelectEven = () => setSelectedIndices(pages.map((_, i) => i).filter((i) => i % 2 !== 0))
  const handleInvertSelection = () =>
    setSelectedIndices(pages.map((_, i) => i).filter((i) => !selectedIndices.includes(i)))

  // Rotate single or selected pages
  const handleRotateSelected = (degreesDelta: number) => {
    const targets = selectedIndices.length > 0 ? selectedIndices : [currentPageIndex]
    const newPages = pages.map((p, i) =>
      targets.includes(i)
        ? { ...p, rotation: ((p.rotation + degreesDelta) % 360 + 360) % 360 }
        : p
    )
    onUpdatePagesAndAnnotations(newPages, annotations)
  }

  // Duplicate selected pages
  const handleDuplicateSelected = () => {
    const targets = (selectedIndices.length > 0 ? [...selectedIndices] : [currentPageIndex]).sort((a, b) => a - b)
    let newPages = [...pages]
    let newAnns = [...annotations]

    // Process from end to start so indices remain stable
    for (let t = targets.length - 1; t >= 0; t--) {
      const targetIdx = targets[t]
      const originalPage = newPages[targetIdx]
      const dupPage: PDFPageItem = {
        ...originalPage,
        id: `page-dup-${Date.now()}-${t}-${Math.random().toString(36).slice(2, 6)}`,
      }
      newPages.splice(targetIdx + 1, 0, dupPage)

      // Clone annotations on targetIdx with new IDs and index + 1
      const clonedAnns = newAnns
        .filter((a) => a.pageIndex === targetIdx)
        .map((a) => ({
          ...a,
          id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pageIndex: targetIdx + 1,
        }))

      // Shift annotations after targetIdx by +1
      newAnns = newAnns.map((a) => (a.pageIndex > targetIdx ? { ...a, pageIndex: a.pageIndex + 1 } : a))
      newAnns = [...newAnns, ...clonedAnns]
    }

    onUpdatePagesAndAnnotations(newPages, newAnns)
    setSelectedIndices(targets.map((idx, i) => idx + 1 + i))
  }

  // Delete selected pages
  const handleDeleteSelected = () => {
    const targets = (selectedIndices.length > 0 ? selectedIndices : [currentPageIndex]).sort((a, b) => a - b)
    if (targets.length >= pages.length) {
      alert('Cannot delete all pages in the document. At least 1 page must remain.')
      return
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${targets.length} ${
          targets.length === 1 ? 'page' : 'pages'
        }?`
      )
    ) {
      return
    }

    const newPages = pages.filter((_, i) => !targets.includes(i))

    // Build index remapping
    const indexMap = new Map<number, number>()
    let currentNewIdx = 0
    pages.forEach((_, oldIdx) => {
      if (!targets.includes(oldIdx)) {
        indexMap.set(oldIdx, currentNewIdx++)
      }
    })

    const newAnns = annotations
      .filter((a) => !targets.includes(a.pageIndex))
      .map((a) => ({
        ...a,
        pageIndex: indexMap.get(a.pageIndex) ?? 0,
      }))

    onUpdatePagesAndAnnotations(newPages, newAnns)
    setSelectedIndices([0])
    onSelectPage(0)
  }

  // Move page left / right in organizer
  const handleMovePage = (fromIdx: number, direction: 'left' | 'right') => {
    const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1
    if (toIdx < 0 || toIdx >= pages.length) return

    const newPages = [...pages]
    const temp = newPages[fromIdx]
    newPages[fromIdx] = newPages[toIdx]
    newPages[toIdx] = temp

    const newAnns = reorderAnns(fromIdx, toIdx, annotations)
    onUpdatePagesAndAnnotations(newPages, newAnns)
    setSelectedIndices([toIdx])
  }

  // 1. ADD BLANK PAGE
  const handleExecuteAddBlankPage = () => {
    let width = 595.28
    let height = 841.89

    if (blankPagePreset === 'a4-landscape') {
      width = 841.89
      height = 595.28
    } else if (blankPagePreset === 'letter-portrait') {
      width = 612
      height = 792
    } else if (blankPagePreset === 'letter-landscape') {
      width = 792
      height = 612
    }

    const newBlankPage: PDFPageItem = {
      id: `page-blank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      originalIndex: -1,
      rotation: 0,
      width,
      height,
      isBlank: true,
    }

    const anchorIdx = selectedIndices.length > 0 ? selectedIndices[0] : currentPageIndex
    let insertIdx = anchorIdx + 1
    if (blankInsertPos === 'before') insertIdx = anchorIdx
    else if (blankInsertPos === 'start') insertIdx = 0
    else if (blankInsertPos === 'end') insertIdx = pages.length

    const newPages = [...pages]
    newPages.splice(insertIdx, 0, newBlankPage)

    const newAnns = annotations.map((a) =>
      a.pageIndex >= insertIdx ? { ...a, pageIndex: a.pageIndex + 1 } : a
    )

    onUpdatePagesAndAnnotations(newPages, newAnns)
    setSelectedIndices([insertIdx])
    onSelectPage(insertIdx)
    setActiveDialog('none')
  }

  // 2. INSERT PDF PAGES
  const handleInsertFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsProcessing(true)
      setProcessingMessage('Analyzing PDF file...')
      setDialogError(null)

      const result = await loadPdfData(file)
      setInsertedFile(file)
      setInsertedFilePageCount(result.pages.length)
      setInsertPageRange(`1-${result.pages.length}`)
    } catch (err) {
      console.error(err)
      setDialogError('Could not load this PDF file. Please ensure it is a valid document.')
    } finally {
      setIsProcessing(false)
      e.target.value = ''
    }
  }

  const handleExecuteInsertPdf = async () => {
    if (!insertedFile) return
    setIsProcessing(true)
    setProcessingMessage('Inserting pages...')
    setDialogError(null)

    try {
      const result = await loadPdfData(insertedFile)
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      if (onRegisterSourceDoc) {
        onRegisterSourceDoc({
          id: docId,
          name: insertedFile.name,
          pdfDoc: result.pdfDoc,
          arrayBuffer: result.arrayBuffer,
        })
      }

      // Parse page range
      const selectedPageIndices: number[] = []
      if (insertPageRange.trim().toLowerCase() === 'all') {
        for (let i = 0; i < result.pages.length; i++) selectedPageIndices.push(i)
      } else {
        const parts = insertPageRange.split(',')
        for (const part of parts) {
          const trimmed = part.trim()
          if (trimmed.includes('-')) {
            const [sStr, eStr] = trimmed.split('-')
            const s = parseInt(sStr, 10)
            const e = parseInt(eStr, 10)
            if (!isNaN(s) && !isNaN(e)) {
              for (let p = Math.max(1, s); p <= Math.min(result.pages.length, e); p++) {
                selectedPageIndices.push(p - 1)
              }
            }
          } else {
            const p = parseInt(trimmed, 10)
            if (!isNaN(p) && p >= 1 && p <= result.pages.length) {
              selectedPageIndices.push(p - 1)
            }
          }
        }
      }

      const uniqueIndices = [...new Set(selectedPageIndices)].sort((a, b) => a - b)
      if (uniqueIndices.length === 0) {
        setDialogError('Please specify valid pages to insert (e.g. 1-3).')
        setIsProcessing(false)
        return
      }

      const insertedItems: PDFPageItem[] = uniqueIndices.map((pIdx) => ({
        id: `page-ins-${Date.now()}-${pIdx}-${Math.random().toString(36).slice(2, 6)}`,
        originalIndex: pIdx,
        rotation: result.pages[pIdx]?.rotation || 0,
        width: result.pages[pIdx]?.width || 595.28,
        height: result.pages[pIdx]?.height || 841.89,
        sourceDocId: docId,
      }))

      const anchorIdx = selectedIndices.length > 0 ? selectedIndices[0] : currentPageIndex
      let insertIdx = anchorIdx + 1
      if (insertPdfPos === 'before') insertIdx = anchorIdx
      else if (insertPdfPos === 'start') insertIdx = 0
      else if (insertPdfPos === 'end') insertIdx = pages.length

      const newPages = [...pages]
      newPages.splice(insertIdx, 0, ...insertedItems)

      const shiftCount = insertedItems.length
      const newAnns = annotations.map((a) =>
        a.pageIndex >= insertIdx ? { ...a, pageIndex: a.pageIndex + shiftCount } : a
      )

      onUpdatePagesAndAnnotations(newPages, newAnns)
      setSelectedIndices(insertedItems.map((_, i) => insertIdx + i))
      onSelectPage(insertIdx)
      setActiveDialog('none')
      setInsertedFile(null)
    } catch (err) {
      console.error(err)
      setDialogError('Failed to insert pages from the PDF document.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. MERGE PDFs
  const handleMergeFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setMergeFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  const handleExecuteMergePdfs = async () => {
    if (mergeFiles.length === 0) return
    setIsProcessing(true)
    setProcessingMessage('Merging PDF documents in memory...')
    setDialogError(null)

    try {
      let combinedPages = [...pages]
      let combinedAnns = [...annotations]

      for (let f = 0; f < mergeFiles.length; f++) {
        const file = mergeFiles[f]
        setProcessingMessage(`Merging "${file.name}" (${f + 1} of ${mergeFiles.length})...`)
        const result = await loadPdfData(file)
        const docId = `doc-merge-${Date.now()}-${f}-${Math.random().toString(36).slice(2, 6)}`

        if (onRegisterSourceDoc) {
          onRegisterSourceDoc({
            id: docId,
            name: file.name,
            pdfDoc: result.pdfDoc,
            arrayBuffer: result.arrayBuffer,
          })
        }

        const newItems: PDFPageItem[] = result.pages.map((p, pIdx) => ({
          id: `page-mrg-${Date.now()}-${f}-${pIdx}-${Math.random().toString(36).slice(2, 6)}`,
          originalIndex: pIdx,
          rotation: p.rotation || 0,
          width: p.width,
          height: p.height,
          sourceDocId: docId,
        }))

        combinedPages = [...combinedPages, ...newItems]
      }

      onUpdatePagesAndAnnotations(combinedPages, combinedAnns)
      setActiveDialog('none')
      setMergeFiles([])
    } catch (err) {
      console.error(err)
      setDialogError('Failed to merge PDF documents. Please check file format.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 4. EXTRACT SELECTED PAGES
  const handleExecuteExtractSelected = async () => {
    if (selectedIndices.length === 0) {
      alert('Please select at least 1 page to extract.')
      return
    }

    setIsProcessing(true)
    setProcessingMessage('Extracting selected pages to new PDF...')

    try {
      const sorted = [...selectedIndices].sort((a, b) => a - b)
      const label = sorted.map((i) => i + 1).join('_')
      const fileName = `${baseFileName.replace(/\.[^/.]+$/, '')}_extracted_p${label}.pdf`

      await exportSelectedPagesPdf(
        originalArrayBuffer,
        pages,
        annotations,
        sorted,
        fileName,
        sourceDocs
      )
    } catch (err) {
      console.error(err)
      alert('Failed to extract selected pages.')
    } finally {
      setIsProcessing(false)
    }
  }

  // 5. SPLIT PDF
  const handleExecuteSplitPdf = async () => {
    setIsProcessing(true)
    setProcessingMessage('Splitting PDF document...')
    setDialogError(null)

    try {
      const ranges: SplitRange[] = []

      if (splitMode === 'single') {
        for (let i = 1; i <= pages.length; i++) {
          ranges.push({ fromPage: i, toPage: i })
        }
      } else if (splitMode === 'atCurrent') {
        const splitPoint = (selectedIndices.length > 0 ? selectedIndices[0] : currentPageIndex) + 1
        ranges.push({ fromPage: 1, toPage: splitPoint, label: `part1_p1-p${splitPoint}` })
        if (splitPoint < pages.length) {
          ranges.push({
            fromPage: splitPoint + 1,
            toPage: pages.length,
            label: `part2_p${splitPoint + 1}-p${pages.length}`,
          })
        }
      } else if (splitMode === 'custom') {
        const parts = customSplitRanges.split(',')
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (part.includes('-')) {
            const [sStr, eStr] = part.split('-')
            const s = parseInt(sStr, 10)
            const e = parseInt(eStr, 10)
            if (!isNaN(s) && !isNaN(e)) {
              ranges.push({
                fromPage: Math.max(1, s),
                toPage: Math.min(pages.length, e),
                label: `range${i + 1}_p${s}-p${e}`,
              })
            }
          } else {
            const p = parseInt(part, 10)
            if (!isNaN(p) && p >= 1 && p <= pages.length) {
              ranges.push({ fromPage: p, toPage: p, label: `page_${p}` })
            }
          }
        }

        if (ranges.length === 0) {
          setDialogError('Please provide valid page ranges, e.g. 1-2, 3-5')
          setIsProcessing(false)
          return
        }
      }

      await splitPdf(originalArrayBuffer, pages, annotations, baseFileName, ranges, sourceDocs)
      setActiveDialog('none')
    } catch (err) {
      console.error(err)
      setDialogError('Failed to split PDF. Please check page range inputs.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Page Organizer & Management
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add blank sheets, insert PDFs, merge, split, reorder, rotate, or extract pages directly in memory.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
          {/* Main Action Buttons: Add Blank, Insert, Merge, Split, Extract */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Add Blank Page */}
            <button
              type="button"
              onClick={() => {
                setDialogError(null)
                setActiveDialog('addBlank')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 cursor-pointer transition-colors"
            >
              <FilePlus className="h-4 w-4" />
              <span>Add Blank</span>
            </button>

            {/* Insert PDF */}
            <button
              type="button"
              onClick={() => {
                setDialogError(null)
                setActiveDialog('insertPdf')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Insert PDF</span>
            </button>

            {/* Merge PDFs */}
            <button
              type="button"
              onClick={() => {
                setDialogError(null)
                setActiveDialog('mergePdf')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 cursor-pointer transition-colors"
            >
              <Files className="h-4 w-4" />
              <span>Merge PDFs</span>
            </button>

            {/* Split PDF */}
            <button
              type="button"
              onClick={() => {
                setDialogError(null)
                setActiveDialog('splitPdf')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 cursor-pointer transition-colors"
            >
              <Split className="h-4 w-4" />
              <span>Split PDF</span>
            </button>

            {/* Extract Selected */}
            <button
              type="button"
              onClick={handleExecuteExtractSelected}
              disabled={selectedIndices.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 disabled:opacity-40 cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Extract Selected ({selectedIndices.length})</span>
            </button>
          </div>

          {/* Quick Selection Helpers */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Select:</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium"
            >
              All
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              None
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleSelectOdd}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Odd
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleSelectEven}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Even
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleInvertSelection}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Invert
            </button>
          </div>
        </div>

        {/* Selected Batch Controls Ribbon */}
        {selectedIndices.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-xs">
            <span className="font-semibold text-blue-900 dark:text-blue-200">
              {selectedIndices.length} {selectedIndices.length === 1 ? 'page' : 'pages'} selected
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRotateSelected(-90)}
                title="Rotate 90° CCW"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>-90°</span>
              </button>
              <button
                type="button"
                onClick={() => handleRotateSelected(90)}
                title="Rotate 90° CW"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>+90°</span>
              </button>
              <button
                type="button"
                onClick={handleDuplicateSelected}
                title="Duplicate Selected"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Duplicate</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={pages.length <= 1}
                title="Delete Selected"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-600 text-white text-xs font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{processingMessage || 'Processing PDF in memory...'}</span>
          </div>
        )}

        {/* Main Grid Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-950/40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {pages.map((p, idx) => {
              const isSelected = selectedIndices.includes(idx)
              const isCurrent = idx === currentPageIndex

              return (
                <div
                  key={p.id}
                  onClick={(e) => toggleSelectPage(idx, e)}
                  className={`group relative flex flex-col rounded-2xl border-2 transition-all cursor-pointer bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar on Thumbnail Card */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelectPage(idx)
                        }}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 fill-blue-50 dark:fill-blue-950" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="text-[10px] px-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                          Active
                        </span>
                      )}
                      {p.isBlank && (
                        <span className="text-[10px] px-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                          Blank
                        </span>
                      )}
                      {p.rotation !== 0 && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {p.rotation}°
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Card Preview */}
                  <div className="relative aspect-[3/4] p-3 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/50 overflow-hidden">
                    <PageThumbnail
                      page={p}
                      pageIndex={idx}
                      sourceDocs={sourceDocs}
                      originalArrayBuffer={originalArrayBuffer}
                    />

                    {/* Hover Quick Actions */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectPage(idx)
                          onClose()
                        }}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs font-semibold shadow-sm"
                        title="Jump to Edit Page"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const newPages = pages.map((page, i) =>
                            i === idx
                              ? { ...page, rotation: ((page.rotation + 90) % 360 + 360) % 360 }
                              : page
                          )
                          onUpdatePagesAndAnnotations(newPages, annotations)
                        }}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white shadow-sm"
                        title="Rotate 90° CW"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Navigation & Actions */}
                  <div className="flex items-center justify-between px-2 py-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMovePage(idx, 'left')
                        }}
                        disabled={idx === 0}
                        title="Move Left / Earlier"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      >
                        <MoveLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMovePage(idx, 'right')
                        }}
                        disabled={idx === pages.length - 1}
                        title="Move Right / Later"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                      >
                        <MoveRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const originalPage = pages[idx]
                          const dupPage: PDFPageItem = {
                            ...originalPage,
                            id: `page-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          }
                          const newPages = [...pages.slice(0, idx + 1), dupPage, ...pages.slice(idx + 1)]
                          const clonedAnns = annotations
                            .filter((a) => a.pageIndex === idx)
                            .map((a) => ({
                              ...a,
                              id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              pageIndex: idx + 1,
                            }))
                          const shiftedAnns = annotations.map((a) =>
                            a.pageIndex > idx ? { ...a, pageIndex: a.pageIndex + 1 } : a
                          )
                          onUpdatePagesAndAnnotations(newPages, [...shiftedAnns, ...clonedAnns])
                        }}
                        title="Duplicate this page"
                        className="p-1 rounded text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (pages.length <= 1) {
                            alert('Cannot delete the only page in the document.')
                            return
                          }
                          const newPages = pages.filter((_, i) => i !== idx)
                          const newAnns = annotations
                            .filter((a) => a.pageIndex !== idx)
                            .map((a) => (a.pageIndex > idx ? { ...a, pageIndex: a.pageIndex - 1 } : a))
                          onUpdatePagesAndAnnotations(newPages, newAnns)
                        }}
                        disabled={pages.length <= 1}
                        title="Delete this page"
                        className="p-1 rounded text-slate-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SUB-MODAL 1: ADD BLANK PAGE */}
        {activeDialog === 'addBlank' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <FilePlus className="h-5 w-5 text-emerald-600" />
                  <span>Add Blank Page</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preset Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Page Dimensions Preset
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setBlankPagePreset('a4-portrait')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      blankPagePreset === 'a4-portrait'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold">A4 Portrait</div>
                    <div className="text-[11px] text-slate-500">595 × 842 pt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankPagePreset('a4-landscape')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      blankPagePreset === 'a4-landscape'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold">A4 Landscape</div>
                    <div className="text-[11px] text-slate-500">842 × 595 pt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankPagePreset('letter-portrait')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      blankPagePreset === 'letter-portrait'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold">US Letter</div>
                    <div className="text-[11px] text-slate-500">612 × 792 pt</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlankPagePreset('letter-landscape')}
                    className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                      blankPagePreset === 'letter-landscape'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold">Letter Landscape</div>
                    <div className="text-[11px] text-slate-500">792 × 612 pt</div>
                  </button>
                </div>
              </div>

              {/* Insertion Position */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Insert Location
                </label>
                <select
                  value={blankInsertPos}
                  onChange={(e) => setBlankInsertPos(e.target.value as 'after' | 'before' | 'start' | 'end')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="after">After Selected Page (Page {(selectedIndices[0] ?? currentPageIndex) + 1})</option>
                  <option value="before">Before Selected Page (Page {(selectedIndices[0] ?? currentPageIndex) + 1})</option>
                  <option value="start">At Document Beginning (Page 1)</option>
                  <option value="end">At Document End (Page {pages.length + 1})</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAddBlankPage}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Insert Blank Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: INSERT PDF PAGES */}
        {activeDialog === 'insertPdf' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <FilePlus className="h-5 w-5 text-blue-600" />
                  <span>Insert Pages from PDF</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {dialogError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              {/* Upload Input */}
              <div>
                <input
                  ref={insertFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleInsertFileSelected}
                  className="hidden"
                />
                {!insertedFile ? (
                  <button
                    type="button"
                    onClick={() => insertFileInputRef.current?.click()}
                    className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileText className="h-8 w-8 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Choose PDF file to insert
                    </span>
                    <span className="text-[11px] text-slate-400">PDF documents up to 50MB</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 text-xs">
                        <div className="font-bold truncate text-slate-900 dark:text-white">
                          {insertedFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {insertedFilePageCount} pages detected
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInsertedFile(null)
                        setInsertedFilePageCount(0)
                      }}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {insertedFile && (
                <>
                  {/* Page Range */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pages to Insert (e.g. "all" or "1-3, 5")
                    </label>
                    <input
                      type="text"
                      value={insertPageRange}
                      onChange={(e) => setInsertPageRange(e.target.value)}
                      placeholder="all or 1-3"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Insert Location
                    </label>
                    <select
                      value={insertPdfPos}
                      onChange={(e) => setInsertPdfPos(e.target.value as 'after' | 'before' | 'start' | 'end')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="after">After Selected Page (Page {(selectedIndices[0] ?? currentPageIndex) + 1})</option>
                      <option value="before">Before Selected Page (Page {(selectedIndices[0] ?? currentPageIndex) + 1})</option>
                      <option value="start">At Document Beginning (Page 1)</option>
                      <option value="end">At Document End (Page {pages.length + 1})</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDialog('none')
                    setInsertedFile(null)
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteInsertPdf}
                  disabled={!insertedFile || isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm"
                >
                  Insert Pages
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 3: MERGE PDFs */}
        {activeDialog === 'mergePdf' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Files className="h-5 w-5 text-indigo-600" />
                  <span>Merge Additional PDFs</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {dialogError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              <div>
                <input
                  ref={mergeFileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  onChange={handleMergeFilesSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mergeFileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Files className="h-6 w-6 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    + Choose PDF files to merge
                  </span>
                </button>
              </div>

              {/* Selected files list */}
              {mergeFiles.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {mergeFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-indigo-600">{idx + 1}.</span>
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMergeFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All pages from selected files will be seamlessly appended to the end of the current document in your local memory.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveDialog('none')
                    setMergeFiles([])
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteMergePdfs}
                  disabled={mergeFiles.length === 0 || isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm"
                >
                  Merge All into Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-MODAL 4: SPLIT PDF */}
        {activeDialog === 'splitPdf' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Split className="h-5 w-5 text-purple-600" />
                  <span>Split PDF Document</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {dialogError && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{dialogError}</span>
                </div>
              )}

              {/* Split Mode Options */}
              <div className="space-y-2">
                <label
                  onClick={() => setSplitMode('atCurrent')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    splitMode === 'atCurrent'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    checked={splitMode === 'atCurrent'}
                    onChange={() => setSplitMode('atCurrent')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Split into 2 parts at page {(selectedIndices[0] ?? currentPageIndex) + 1}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Part 1: Pages 1 to {(selectedIndices[0] ?? currentPageIndex) + 1} • Part 2: Pages {(selectedIndices[0] ?? currentPageIndex) + 2} to {pages.length}
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setSplitMode('single')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    splitMode === 'single'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    checked={splitMode === 'single'}
                    onChange={() => setSplitMode('single')}
                    className="mt-0.5"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Split into individual single-page PDFs</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Extracts each page as its own standalone PDF file ({pages.length} files)
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => setSplitMode('custom')}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    splitMode === 'custom'
                      ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    checked={splitMode === 'custom'}
                    onChange={() => setSplitMode('custom')}
                    className="mt-0.5"
                  />
                  <div className="text-xs flex-1">
                    <div className="font-bold">Split by custom page ranges</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                      Example: "1-2, 3-5, 6-8"
                    </div>
                    {splitMode === 'custom' && (
                      <input
                        type="text"
                        value={customSplitRanges}
                        onChange={(e) => setCustomSplitRanges(e.target.value)}
                        placeholder="1-2, 3-5"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDialog('none')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSplitPdf}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white shadow-sm"
                >
                  Split & Download
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Total Pages: <strong>{pages.length}</strong> • Click any thumbnail to select • Drag or use arrows to reorder
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
          >
            Done Organizing
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Renders an offscreen canvas thumbnail for a PDF page item
 */
const PageThumbnail: React.FC<{
  page: PDFPageItem
  pageIndex: number
  sourceDocs?: Record<string, SourcePdfDocument>
  originalArrayBuffer: ArrayBuffer
}> = ({ page, sourceDocs }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return

    if (page.isBlank) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = 120
        canvas.height = 160
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 120, 160)
        setRendered(true)
      }
      return
    }

    const docToUse =
      (page.sourceDocId && sourceDocs?.[page.sourceDocId]?.pdfDoc) ||
      sourceDocs?.['primary']?.pdfDoc

    if (!docToUse) return

    renderPdfPageToCanvas(
      docToUse,
      page.originalIndex,
      page.rotation,
      0.2, // Small thumbnail scale
      canvas,
      false,
      page.width,
      page.height
    )
      .then(() => {
        if (!cancelled) setRendered(true)
      })
      .catch((err) => {
        console.warn('Thumbnail render warning:', err)
      })

    return () => {
      cancelled = true
    }
  }, [page, sourceDocs])

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain shadow-xs bg-white rounded-xs"
      />
      {!rendered && !page.isBlank && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
    </div>
  )
}
