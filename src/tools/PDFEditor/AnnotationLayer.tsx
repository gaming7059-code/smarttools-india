import React, { useRef, useState, useEffect } from 'react'
import { Trash2, Edit3, X, ScanText } from 'lucide-react'
import type { Annotation, EditorToolMode, Point, DetectedTextItem } from './types'

interface AnnotationLayerProps {
  pageIndex: number
  pageWidth: number
  pageHeight: number
  scale: number
  activeTool: EditorToolMode
  selectedColor: string
  fontSize: number
  strokeWidth: number
  annotations: Annotation[]
  selectedAnnotationId: string | null
  detectedTextItems?: DetectedTextItem[]
  onSelectAnnotation: (id: string | null) => void
  onAddAnnotation: (ann: Annotation) => void
  onUpdateAnnotation: (ann: Annotation) => void
  onDeleteAnnotation: (id: string) => void
}

let annotationCounter = 0
function generateAnnotationId(): string {
  annotationCounter += 1
  return `ann-${Date.now()}-${annotationCounter}-${Math.random().toString(36).slice(2, 7)}`
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageIndex,
  pageWidth,
  pageHeight,
  scale,
  activeTool,
  selectedColor,
  fontSize,
  strokeWidth,
  annotations,
  selectedAnnotationId,
  detectedTextItems = [],
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPoints, setCurrentPoints] = useState<Point[]>([])
  const [shapeStart, setShapeStart] = useState<Point | null>(null)
  const [shapeCurrent, setShapeCurrent] = useState<Point | null>(null)

  // Dragging state (local preview during drag for 60fps responsiveness)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [dragTargetId, setDragTargetId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)

  // Resizing state (local preview during resize)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState<Point | null>(null)
  const [resizeTargetId, setResizeTargetId] = useState<string | null>(null)
  const [resizeDims, setResizeDims] = useState<{ width: number; height: number } | null>(null)

  // Text inline editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextVal, setEditingTextVal] = useState('')

  // Selected region and editing state for Edit PDF Text workflow
  const [selectedActionBox, setSelectedActionBox] = useState<{
    id?: string
    str: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    fontName?: string
    fontFamily?: string
    color?: string
    backgroundColor?: string
    isBold?: boolean
    isItalic?: boolean
    isMonospace?: boolean
    isSerif?: boolean
    pdfX?: number
    pdfY?: number
    pdfWidth?: number
    pdfHeight?: number
    rotation?: number
  } | null>(null)

  const [editInputText, setEditInputText] = useState('')
  const [editFontSize, setEditFontSize] = useState(14)
  const [editColor, setEditColor] = useState('#000000')
  const [editBgColor, setEditBgColor] = useState('#ffffff')
  const [editIsBold, setEditIsBold] = useState(false)
  const [editIsItalic, setEditIsItalic] = useState(false)
  const [editAutoFit, setEditAutoFit] = useState(true)

  const openActionBox = (box: {
    id?: string
    str: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    fontName?: string
    fontFamily?: string
    color?: string
    backgroundColor?: string
    isBold?: boolean
    isItalic?: boolean
    isMonospace?: boolean
    isSerif?: boolean
    pdfX?: number
    pdfY?: number
    pdfWidth?: number
    pdfHeight?: number
    rotation?: number
  }) => {
    setSelectedActionBox(box)
    setEditInputText(box.str === 'Selected Area' ? '' : box.str)
    setEditFontSize(box.fontSize || fontSize || 14)
    setEditColor(box.color || selectedColor || '#000000')
    setEditBgColor(box.backgroundColor || '#ffffff')
    setEditIsBold(Boolean(box.isBold))
    setEditIsItalic(Boolean(box.isItalic))
    setEditAutoFit(true)
  }

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex)

  // Converts client event coordinates to normalized [0, 1] relative to page container
  const getNormalizedPoint = (e: React.PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    return { x, y }
  }

  // Commit text editing
  const handleCommitText = (annId: string, valueToCommit: string) => {
    const target = annotations.find((a) => a.id === annId)
    if (!target) {
      setEditingTextId(null)
      return
    }

    const trimmed = valueToCommit.trim()
    if (!trimmed) {
      onDeleteAnnotation(annId)
      if (selectedAnnotationId === annId) onSelectAnnotation(null)
    } else {
      onUpdateAnnotation({ ...target, text: valueToCommit })
    }
    setEditingTextId(null)
  }

  // Redact/Delete original PDF text cleanly using detected background color
  const handleDeleteOriginalText = () => {
    if (!selectedActionBox) return
    const id = generateAnnotationId()
    const redactionAnn: Annotation = {
      id,
      pageIndex,
      type: 'rectangle',
      isPdfTextReplacement: true,
      x: selectedActionBox.x,
      y: selectedActionBox.y,
      width: selectedActionBox.width,
      height: selectedActionBox.height,
      fillColor: editBgColor || selectedActionBox.backgroundColor || '#ffffff',
      backgroundColor: editBgColor || selectedActionBox.backgroundColor || '#ffffff',
      pdfX: selectedActionBox.pdfX,
      pdfY: selectedActionBox.pdfY,
      pdfWidth: selectedActionBox.pdfWidth,
      pdfHeight: selectedActionBox.pdfHeight,
      rotation: selectedActionBox.rotation || 0,
      strokeWidth: 0,
      strokeColor: 'transparent',
    }
    onAddAnnotation(redactionAnn)
    setSelectedActionBox(null)
  }

  // Replace original PDF text with a new vector replacement text
  const handleApplyReplacement = () => {
    if (!selectedActionBox) return
    const id = selectedActionBox.id || generateAnnotationId()
    const replacementAnn: Annotation = {
      id,
      pageIndex,
      type: 'text',
      isPdfTextReplacement: true,
      x: selectedActionBox.x,
      y: selectedActionBox.y,
      width: selectedActionBox.width,
      height: selectedActionBox.height,
      text: editInputText,
      fontSize: editFontSize,
      fontName: selectedActionBox.fontName,
      fontFamily: selectedActionBox.fontFamily,
      color: editColor,
      backgroundColor: editBgColor,
      isBold: editIsBold,
      isItalic: editIsItalic,
      isMonospace: selectedActionBox.isMonospace,
      isSerif: selectedActionBox.isSerif,
      autoFit: editAutoFit,
      pdfX: selectedActionBox.pdfX,
      pdfY: selectedActionBox.pdfY,
      pdfWidth: selectedActionBox.pdfWidth,
      pdfHeight: selectedActionBox.pdfHeight,
      rotation: selectedActionBox.rotation || 0,
      strokeWidth: 0,
      strokeColor: 'transparent',
    }
    if (selectedActionBox.id && annotations.some((a) => a.id === selectedActionBox.id)) {
      onUpdateAnnotation(replacementAnn)
    } else {
      onAddAnnotation(replacementAnn)
    }
    onSelectAnnotation(id)
    setSelectedActionBox(null)
  }

  // Handle Pointer Down on Container
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    // Ignore clicks on form inputs or action buttons
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.closest('button')) {
      return
    }

    // Commit any currently open text editing first
    if (editingTextId) {
      handleCommitText(editingTextId, editingTextVal)
    }

    const pt = getNormalizedPoint(e)

    if (activeTool === 'editText') {
      setSelectedActionBox(null)
      setIsDrawing(true)
      setShapeStart(pt)
      setShapeCurrent(pt)
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (activeTool === 'select') {
      if (target === containerRef.current) {
        onSelectAnnotation(null)
      }
      return
    }

    if (activeTool === 'draw' || activeTool === 'highlight') {
      setIsDrawing(true)
      setCurrentPoints([pt])
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'line' ||
      activeTool === 'arrow'
    ) {
      setIsDrawing(true)
      setShapeStart(pt)
      setShapeCurrent(pt)
      e.currentTarget.setPointerCapture(e.pointerId)
      return
    }

    if (activeTool === 'text' || activeTool === 'textbox') {
      // Create new text element on background click
      const id = generateAnnotationId()
      const isBox = activeTool === 'textbox'
      const initialText = 'Type text...'
      const newAnn: Annotation = {
        id,
        pageIndex,
        type: activeTool,
        x: Math.max(0, Math.min(0.75, pt.x)),
        y: Math.max(0, Math.min(0.92, pt.y)),
        width: isBox ? 0.35 : 0.25,
        height: isBox ? 0.12 : 0.06,
        text: initialText,
        fontSize,
        color: selectedColor,
        backgroundColor: isBox ? '#ffffff' : 'transparent',
      }
      onAddAnnotation(newAnn)
      onSelectAnnotation(id)
      setEditingTextId(id)
      setEditingTextVal(initialText)
    }
  }

  // Handle Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing && !isDragging && !isResizing) return
    const pt = getNormalizedPoint(e)

    if (isDrawing) {
      if (activeTool === 'draw' || activeTool === 'highlight') {
        setCurrentPoints((prev) => [...prev, pt])
      } else if (shapeStart) {
        setShapeCurrent(pt)
      }
      return
    }

    if (isDragging && dragStart && dragTargetId) {
      const target = annotations.find((a) => a.id === dragTargetId)
      if (target) {
        const dx = pt.x - dragStart.x
        const dy = pt.y - dragStart.y
        const newX = Math.max(0, Math.min(1 - target.width, target.x + dx))
        const newY = Math.max(0, Math.min(1 - target.height, target.y + dy))
        setDragPos({ x: newX, y: newY })
      }
      return
    }

    if (isResizing && resizeStart && resizeTargetId) {
      const target = annotations.find((a) => a.id === resizeTargetId)
      if (target) {
        const dx = pt.x - resizeStart.x
        const dy = pt.y - resizeStart.y
        const newW = Math.max(0.05, Math.min(1 - target.x, target.width + dx))
        const newH = Math.max(0.03, Math.min(1 - target.y, target.height + dy))
        setResizeDims({ width: newW, height: newH })
      }
    }
  }

  // Handle Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing) {
      setIsDrawing(false)

      if (activeTool === 'editText' && shapeStart && shapeCurrent) {
        const minX = Math.min(shapeStart.x, shapeCurrent.x)
        const minY = Math.min(shapeStart.y, shapeCurrent.y)
        const w = Math.abs(shapeCurrent.x - shapeStart.x)
        const h = Math.abs(shapeCurrent.y - shapeStart.y)

        if (w > 0.015 && h > 0.008) {
          const overlapping = detectedTextItems.find((it) => {
            const ox = Math.max(0, Math.min(minX + w, it.x + it.width) - Math.max(minX, it.x))
            const oy = Math.max(0, Math.min(minY + h, it.y + it.height) - Math.max(minY, it.y))
            return ox * oy > 0.0001
          })

          openActionBox({
            str: overlapping?.str || 'Selected Area',
            x: minX,
            y: minY,
            width: w,
            height: h,
            fontSize: overlapping?.fontSize || fontSize || 14,
            fontName: overlapping?.fontName,
            fontFamily: overlapping?.fontFamily,
            color: overlapping?.color || selectedColor || '#000000',
            backgroundColor: overlapping?.backgroundColor || '#ffffff',
            isBold: overlapping?.isBold,
            isItalic: overlapping?.isItalic,
            isMonospace: overlapping?.isMonospace,
            isSerif: overlapping?.isSerif,
            pdfX: overlapping?.pdfX,
            pdfY: overlapping?.pdfY,
            pdfWidth: overlapping?.pdfWidth,
            pdfHeight: overlapping?.pdfHeight,
          })
        }
        setShapeStart(null)
        setShapeCurrent(null)
      } else if ((activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 1) {
        const id = generateAnnotationId()
        const newAnn: Annotation = {
          id,
          pageIndex,
          type: activeTool,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          points: currentPoints,
          strokeColor: selectedColor,
          strokeWidth,
          opacity: activeTool === 'highlight' ? 0.35 : 1.0,
        }
        onAddAnnotation(newAnn)
        setCurrentPoints([])
      } else if (shapeStart && shapeCurrent) {
        const id = generateAnnotationId()
        const minX = Math.min(shapeStart.x, shapeCurrent.x)
        const minY = Math.min(shapeStart.y, shapeCurrent.y)
        const w = Math.abs(shapeCurrent.x - shapeStart.x)
        const h = Math.abs(shapeCurrent.y - shapeStart.y)

        if (w > 0.005 || h > 0.005) {
          const newAnn: Annotation = {
            id,
            pageIndex,
            type: activeTool,
            x: activeTool === 'line' || activeTool === 'arrow' ? shapeStart.x : minX,
            y: activeTool === 'line' || activeTool === 'arrow' ? shapeStart.y : minY,
            width: activeTool === 'line' || activeTool === 'arrow' ? shapeCurrent.x - shapeStart.x : w,
            height: activeTool === 'line' || activeTool === 'arrow' ? shapeCurrent.y - shapeStart.y : h,
            strokeColor: selectedColor,
            strokeWidth,
            fillColor: 'transparent',
          }
          onAddAnnotation(newAnn)
        }
        setShapeStart(null)
        setShapeCurrent(null)
      }

      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Safe fallback
      }
    }

    if (isDragging) {
      if (dragTargetId && dragPos) {
        const target = annotations.find((a) => a.id === dragTargetId)
        if (target && (target.x !== dragPos.x || target.y !== dragPos.y)) {
          onUpdateAnnotation({ ...target, x: dragPos.x, y: dragPos.y })
        }
      }
      setIsDragging(false)
      setDragStart(null)
      setDragTargetId(null)
      setDragPos(null)
    }

    if (isResizing) {
      if (resizeTargetId && resizeDims) {
        const target = annotations.find((a) => a.id === resizeTargetId)
        if (target && (target.width !== resizeDims.width || target.height !== resizeDims.height)) {
          onUpdateAnnotation({
            ...target,
            width: resizeDims.width,
            height: resizeDims.height,
          })
        }
      }
      setIsResizing(false)
      setResizeStart(null)
      setResizeTargetId(null)
      setResizeDims(null)
    }
  }

  // Keyboard shortcut for deleting selected element
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedAnnotationId &&
        !editingTextId
      ) {
        e.preventDefault()
        onDeleteAnnotation(selectedAnnotationId)
        onSelectAnnotation(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedAnnotationId, editingTextId, onDeleteAnnotation, onSelectAnnotation])

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute inset-0 select-none ${
        activeTool === 'select'
          ? 'cursor-default'
          : activeTool === 'editText'
          ? 'cursor-pointer'
          : activeTool === 'text' || activeTool === 'textbox'
          ? 'cursor-text'
          : 'cursor-crosshair'
      }`}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
    >
      {/* Detected Text Highlights when in "editText" mode */}
      {activeTool === 'editText' &&
        detectedTextItems.map((item) => (
          <div
            key={item.id}
            onClick={(e) => {
              e.stopPropagation()
              openActionBox({
                id: item.id,
                str: item.str,
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                fontSize: item.fontSize,
                fontName: item.fontName,
                fontFamily: item.fontFamily,
                color: item.color,
                backgroundColor: item.backgroundColor,
                isBold: item.isBold,
                isItalic: item.isItalic,
                isMonospace: item.isMonospace,
                isSerif: item.isSerif,
                pdfX: item.pdfX,
                pdfY: item.pdfY,
                pdfWidth: item.pdfWidth,
                pdfHeight: item.pdfHeight,
                rotation: item.rotation,
              })
            }}
            style={{
              position: 'absolute',
              left: `${item.x * 100}%`,
              top: `${item.y * 100}%`,
              width: `${item.width * 100}%`,
              height: `${item.height * 100}%`,
            }}
            className="border border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/25 hover:border-amber-600 rounded-xs cursor-pointer transition-colors z-20 group"
            title={`Click to edit "${item.str}"`}
          >
            <div className="hidden group-hover:flex absolute -top-5 left-0 bg-slate-900/90 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30">
              Click to edit text
            </div>
          </div>
        ))}

      {/* Floating Inspector Popover for Selected Original Text Region */}
      {selectedActionBox && (
        <div
          className="absolute z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-3 min-w-[320px] max-w-[380px] text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.min(0.6, Math.max(0.02, selectedActionBox.x)) * 100}%`,
            top: `${Math.max(0.02, selectedActionBox.y - 0.05) * 100}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100 text-sm">
              <ScanText className="h-4 w-4 text-amber-500" />
              <span>Edit PDF Text</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedActionBox(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Detected Properties Metadata Bar */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col gap-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Detected Original Properties
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              {/* Font Name */}
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200/50 dark:border-slate-600/50">
                {selectedActionBox.fontFamily || 'Sans-Serif'}
              </span>
              {/* Font Size */}
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-200 shadow-xs border border-slate-200/50 dark:border-slate-600/50">
                {selectedActionBox.fontSize} pt
              </span>
              {/* Style badges */}
              {selectedActionBox.isBold && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                  Bold
                </span>
              )}
              {selectedActionBox.isItalic && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 italic text-[10px]">
                  Italic
                </span>
              )}
              {/* Color previews */}
              <div className="flex items-center gap-1 ml-auto text-[10px] text-slate-500 dark:text-slate-400">
                <span>Color:</span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block"
                  style={{ backgroundColor: selectedActionBox.color || '#000000' }}
                  title={`Text Color: ${selectedActionBox.color}`}
                />
              </div>
            </div>
          </div>

          {/* Replacement Text Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Replacement Text:
            </label>
            <input
              type="text"
              value={editInputText}
              onChange={(e) => setEditInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyReplacement()
                }
              }}
              autoFocus
              placeholder="Enter replacement text..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Typography & Controls */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Font Size & Auto-fit */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Font Size:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{editFontSize}pt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="6"
                  max="72"
                  value={editFontSize}
                  onChange={(e) => setEditFontSize(Number(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer mt-0.5">
                <input
                  type="checkbox"
                  checked={editAutoFit}
                  onChange={(e) => setEditAutoFit(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span>Auto-fit to original bounds</span>
              </label>
            </div>

            {/* Style & Color Toggles */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Style & Colors:</span>
              <div className="flex items-center gap-1">
                {/* Bold Button */}
                <button
                  type="button"
                  onClick={() => setEditIsBold(!editIsBold)}
                  title="Toggle Bold"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    editIsBold
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  B
                </button>

                {/* Italic Button */}
                <button
                  type="button"
                  onClick={() => setEditIsItalic(!editIsItalic)}
                  title="Toggle Italic"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center italic text-xs transition-colors cursor-pointer ${
                    editIsItalic
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  I
                </button>

                {/* Text Color Picker */}
                <label
                  title="Change Text Color"
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer shadow-xs relative overflow-hidden"
                  style={{ backgroundColor: editColor }}
                >
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                </label>

                {/* Background Color Picker */}
                <label
                  title="Change Background Fill Color"
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer shadow-xs relative overflow-hidden ml-auto"
                  style={{ backgroundColor: editBgColor }}
                >
                  <input
                    type="color"
                    value={editBgColor}
                    onChange={(e) => setEditBgColor(e.target.value)}
                    className="opacity-0 absolute inset-0 cursor-pointer"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-400">
                <span>Text: {editColor}</span>
                <span>Bg: {editBgColor}</span>
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Preview:
            </span>
            <div
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center truncate min-h-[36px] flex items-center justify-center transition-colors"
              style={{
                backgroundColor: editBgColor,
                color: editColor,
                fontSize: `${editFontSize}px`,
                fontWeight: editIsBold ? 'bold' : 'normal',
                fontStyle: editIsItalic ? 'italic' : 'normal',
                fontFamily:
                  selectedActionBox.fontFamily === 'Serif (Times)'
                    ? 'Georgia, serif'
                    : selectedActionBox.fontFamily === 'Monospace (Courier)'
                    ? 'monospace'
                    : 'system-ui, sans-serif',
              }}
            >
              {editInputText || <span className="opacity-40 italic text-xs">Empty text</span>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleApplyReplacement}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Replace Text</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteOriginalText}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-900/50 active:scale-95 transition-all cursor-pointer"
              title="Cover and remove this original text"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Existing Annotations for this Page */}
      {pageAnnotations.map((ann) => {
        const isSelected = selectedAnnotationId === ann.id
        const isEditing = editingTextId === ann.id

        // Apply local drag or resize preview position if currently being transformed
        const currentX = isDragging && dragTargetId === ann.id && dragPos ? dragPos.x : ann.x
        const currentY = isDragging && dragTargetId === ann.id && dragPos ? dragPos.y : ann.y
        const currentW = isResizing && resizeTargetId === ann.id && resizeDims ? resizeDims.width : ann.width
        const currentH = isResizing && resizeTargetId === ann.id && resizeDims ? resizeDims.height : ann.height

        if (ann.type === 'draw' || ann.type === 'highlight') {
          // Render SVG polyline
          const ptsStr = (ann.points || [])
            .map((p) => `${p.x * pageWidth},${p.y * pageHeight}`)
            .join(' ')
          return (
            <svg
              key={ann.id}
              viewBox={`0 0 ${pageWidth} ${pageHeight}`}
              className="absolute inset-0 pointer-events-auto"
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                if (activeTool === 'select') {
                  e.stopPropagation()
                  onSelectAnnotation(ann.id)
                }
              }}
            >
              <polyline
                points={ptsStr}
                fill="none"
                stroke={ann.strokeColor || '#2563eb'}
                strokeWidth={(ann.strokeWidth || 3) * (ann.type === 'highlight' ? 4 : 1)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={ann.opacity !== undefined ? ann.opacity : ann.type === 'highlight' ? 0.35 : 1.0}
                className={isSelected ? 'filter drop-shadow-[0_0_4px_rgba(37,99,235,0.8)]' : ''}
              />
            </svg>
          )
        }

        if (ann.type === 'line' || ann.type === 'arrow') {
          const x1 = currentX * pageWidth
          const y1 = currentY * pageHeight
          const x2 = (currentX + currentW) * pageWidth
          const y2 = (currentY + currentH) * pageHeight
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const headLen = Math.max(12, (ann.strokeWidth || 3) * 3)

          return (
            <svg
              key={ann.id}
              viewBox={`0 0 ${pageWidth} ${pageHeight}`}
              className="absolute inset-0 pointer-events-auto"
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                if (activeTool === 'select') {
                  e.stopPropagation()
                  onSelectAnnotation(ann.id)
                }
              }}
            >
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ann.strokeColor || '#2563eb'}
                strokeWidth={ann.strokeWidth || 3}
                strokeLinecap="round"
                className={isSelected ? 'filter drop-shadow-[0_0_4px_rgba(37,99,235,0.8)]' : ''}
              />
              {ann.type === 'arrow' && (
                <polygon
                  points={`
                    ${x2},${y2} 
                    ${x2 - headLen * Math.cos(angle - Math.PI / 6)},${y2 - headLen * Math.sin(angle - Math.PI / 6)} 
                    ${x2 - headLen * Math.cos(angle + Math.PI / 6)},${y2 - headLen * Math.sin(angle + Math.PI / 6)}
                  `}
                  fill={ann.strokeColor || '#2563eb'}
                />
              )}
            </svg>
          )
        }

        return (
          <div
            key={ann.id}
            onPointerDown={(e) => {
              e.stopPropagation()
              onSelectAnnotation(ann.id)

              // If Text tool is active and user clicked a text element, switch directly to editing it
              if ((activeTool === 'text' || activeTool === 'textbox') && (ann.type === 'text' || ann.type === 'textbox')) {
                setEditingTextId(ann.id)
                setEditingTextVal(ann.text || '')
                return
              }

              // Otherwise start dragging
              if (activeTool === 'select' && !isEditing) {
                setIsDragging(true)
                setDragStart(getNormalizedPoint(e))
                setDragTargetId(ann.id)
              }
            }}
            onDoubleClick={(e) => {
              if (ann.isPdfTextReplacement) {
                e.stopPropagation()
                openActionBox({
                  id: ann.id,
                  str: ann.text || '',
                  x: ann.x,
                  y: ann.y,
                  width: ann.width,
                  height: ann.height,
                  fontSize: ann.fontSize || 14,
                  fontName: ann.fontName,
                  fontFamily: ann.fontFamily,
                  color: ann.color,
                  backgroundColor: ann.backgroundColor,
                  isBold: ann.isBold,
                  isItalic: ann.isItalic,
                  isMonospace: ann.isMonospace,
                  isSerif: ann.isSerif,
                  pdfX: ann.pdfX,
                  pdfY: ann.pdfY,
                  pdfWidth: ann.pdfWidth,
                  pdfHeight: ann.pdfHeight,
                })
                onSelectAnnotation(ann.id)
              } else if (ann.type === 'text' || ann.type === 'textbox') {
                e.stopPropagation()
                setEditingTextId(ann.id)
                setEditingTextVal(ann.text || '')
                onSelectAnnotation(ann.id)
              }
            }}
            style={{
              position: 'absolute',
              left: `${currentX * 100}%`,
              top: `${currentY * 100}%`,
              width: `${currentW * 100}%`,
              minHeight: `${currentH * 100}%`,
            }}
            className={`pointer-events-auto group ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 cursor-move' : ''
            }`}
          >
            {/* Visual Element Rendering */}
            {ann.type === 'rectangle' && (
              <div
                className="w-full h-full"
                style={{
                  minHeight: '12px',
                  border:
                    ann.strokeWidth && ann.strokeWidth > 0 && ann.strokeColor !== 'transparent'
                      ? `${(ann.strokeWidth || 3) * scale}px solid ${ann.strokeColor || '#2563eb'}`
                      : 'none',
                  backgroundColor: ann.fillColor || 'transparent',
                }}
              />
            )}

            {ann.type === 'circle' && (
              <div
                className="w-full h-full rounded-full"
                style={{
                  minHeight: '24px',
                  border: `${(ann.strokeWidth || 3) * scale}px solid ${ann.strokeColor || '#2563eb'}`,
                  backgroundColor: ann.fillColor || 'transparent',
                }}
              />
            )}

            {(ann.isPdfTextReplacement || ann.type === 'text' || ann.type === 'textbox') && (
              <div
                className="w-full h-full p-0.5 rounded-xs"
                style={{
                  backgroundColor: ann.backgroundColor || 'transparent',
                  color: ann.color || '#0f172a',
                  fontSize: `${(ann.fontSize || 14) * scale}px`,
                  fontWeight: ann.isPdfTextReplacement ? (ann.isBold ? 'bold' : 'normal') : 'bold',
                  fontStyle: ann.isItalic ? 'italic' : 'normal',
                  fontFamily: ann.isMonospace
                    ? '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
                    : ann.isSerif
                    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                    : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  lineHeight: '1.15',
                  border:
                    ann.type === 'textbox' && !ann.isPdfTextReplacement && ann.strokeWidth && ann.strokeWidth > 0
                      ? '1px solid #cbd5e1'
                      : 'none',
                }}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editingTextVal}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setEditingTextVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
                        e.preventDefault()
                        handleCommitText(ann.id, editingTextVal)
                      }
                    }}
                    onBlur={() => handleCommitText(ann.id, editingTextVal)}
                    className="w-full h-full min-h-[44px] resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-1.5 rounded border border-blue-500 focus:outline-none shadow-sm"
                  />
                ) : (
                  <span className="whitespace-pre-wrap break-words block">
                    {ann.text || 'Type text...'}
                  </span>
                )}
              </div>
            )}

            {/* Selection Controls: Delete, Edit Text, and Resize Handle */}
            {isSelected && !isEditing && (
              <>
                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteAnnotation(ann.id)
                    onSelectAnnotation(null)
                  }}
                  className="absolute -top-3.5 -right-3.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all cursor-pointer"
                  title="Delete element"
                  aria-label="Delete element"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* Edit Text Button (for text and textbox items) */}
                {(ann.type === 'text' || ann.type === 'textbox') && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingTextId(ann.id)
                      setEditingTextVal(ann.text || '')
                    }}
                    className="absolute -top-3.5 right-4 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
                    title="Edit text"
                    aria-label="Edit text"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                )}

                {/* Resize Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                    setResizeStart(getNormalizedPoint(e))
                    setResizeTargetId(ann.id)
                  }}
                  className="absolute -bottom-2 -right-2 z-20 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm cursor-se-resize"
                  title="Resize element"
                />
              </>
            )}
          </div>
        )
      })}

      {/* Live Freehand Drawing Preview */}
      {isDrawing && (activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 0 && (
        <svg
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <polyline
            points={currentPoints.map((p) => `${p.x * pageWidth},${p.y * pageHeight}`).join(' ')}
            fill="none"
            stroke={selectedColor}
            strokeWidth={strokeWidth * (activeTool === 'highlight' ? 4 : 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={activeTool === 'highlight' ? 0.35 : 1.0}
          />
        </svg>
      )}

      {/* Live Selection Rectangle Preview when drawing a custom region in editText mode */}
      {isDrawing && activeTool === 'editText' && shapeStart && shapeCurrent && (
        <svg
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
          className="absolute inset-0 pointer-events-none z-30"
          style={{ width: '100%', height: '100%' }}
        >
          <rect
            x={Math.min(shapeStart.x, shapeCurrent.x) * pageWidth}
            y={Math.min(shapeStart.y, shapeCurrent.y) * pageHeight}
            width={Math.abs(shapeCurrent.x - shapeStart.x) * pageWidth}
            height={Math.abs(shapeCurrent.y - shapeStart.y) * pageHeight}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#2563eb"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </svg>
      )}

      {/* Live Shape Preview */}
      {isDrawing && activeTool !== 'editText' && shapeStart && shapeCurrent && (
        <svg
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {activeTool === 'rectangle' && (
            <rect
              x={Math.min(shapeStart.x, shapeCurrent.x) * pageWidth}
              y={Math.min(shapeStart.y, shapeCurrent.y) * pageHeight}
              width={Math.abs(shapeCurrent.x - shapeStart.x) * pageWidth}
              height={Math.abs(shapeCurrent.y - shapeStart.y) * pageHeight}
              fill="none"
              stroke={selectedColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          )}

          {activeTool === 'circle' && (
            <ellipse
              cx={((shapeStart.x + shapeCurrent.x) / 2) * pageWidth}
              cy={((shapeStart.y + shapeCurrent.y) / 2) * pageHeight}
              rx={(Math.abs(shapeCurrent.x - shapeStart.x) / 2) * pageWidth}
              ry={(Math.abs(shapeCurrent.y - shapeStart.y) / 2) * pageHeight}
              fill="none"
              stroke={selectedColor}
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          )}

          {(activeTool === 'line' || activeTool === 'arrow') && (
            <line
              x1={shapeStart.x * pageWidth}
              y1={shapeStart.y * pageHeight}
              x2={shapeCurrent.x * pageWidth}
              y2={shapeCurrent.y * pageHeight}
              stroke={selectedColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
          )}
        </svg>
      )}
    </div>
  )
}
