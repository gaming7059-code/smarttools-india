import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Trash2,
  Edit3,
  X,
  ScanText,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  RotateCcw,
  Crop,
  RefreshCw,
  StickyNote,
} from 'lucide-react'
import type { Annotation, EditorToolMode, Point, DetectedTextItem, ImageCropData } from './types'
import { ImageCropModal } from './ImageCropModal'

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
  highlightedMatchId?: string | null
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
  highlightedMatchId = null,
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
    isUnderline?: boolean
    isMonospace?: boolean
    isSerif?: boolean
    textAlign?: 'left' | 'center' | 'right'
    lineSpacing?: number
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
  const [editIsUnderline, setEditIsUnderline] = useState(false)
  const [editTextAlign, setEditTextAlign] = useState<'left' | 'center' | 'right'>('left')
  const [editLineSpacing, setEditLineSpacing] = useState(1.2)
  const [editFontFamily, setEditFontFamily] = useState('Helvetica (Sans-Serif)')
  const [editAutoFit, setEditAutoFit] = useState(true)

  // Image editing state & handlers
  const replaceImageInputRef = useRef<HTMLInputElement>(null)
  const [replacingTargetId, setReplacingTargetId] = useState<string | null>(null)
  const [cropTargetAnnotation, setCropTargetAnnotation] = useState<Annotation | null>(null)

  const handleTriggerReplaceImage = (annId: string) => {
    setReplacingTargetId(annId)
    if (replaceImageInputRef.current) {
      replaceImageInputRef.current.value = ''
      replaceImageInputRef.current.click()
    }
  }

  const handleReplaceImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingTargetId) return

    const targetAnn = annotations.find((a) => a.id === replacingTargetId)
    if (!targetAnn) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl) return

      const img = new window.Image()
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight
        const pageAspect = pageWidth / pageHeight
        const newHeight = Math.max(0.03, Math.min(1 - targetAnn.y, (targetAnn.width / aspect) * pageAspect))

        onUpdateAnnotation({
          ...targetAnn,
          imageUrl: dataUrl,
          originalImageUrl: dataUrl,
          cropData: undefined,
          height: newHeight,
        })
        setReplacingTargetId(null)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleOpenCrop = (ann: Annotation) => {
    setCropTargetAnnotation(ann)
  }

  const handleApplyCrop = (croppedDataUrl: string, cropData: ImageCropData) => {
    if (!cropTargetAnnotation) return
    const targetAnn = annotations.find((a) => a.id === cropTargetAnnotation.id)
    if (!targetAnn) return

    const img = new window.Image()
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight
      const pageAspect = pageWidth / pageHeight
      const newHeight = Math.max(0.03, Math.min(1 - targetAnn.y, (targetAnn.width / aspect) * pageAspect))

      onUpdateAnnotation({
        ...targetAnn,
        imageUrl: croppedDataUrl,
        originalImageUrl: targetAnn.originalImageUrl || targetAnn.imageUrl,
        cropData,
        height: newHeight,
      })
      setCropTargetAnnotation(null)
    }
    img.src = croppedDataUrl
  }

  const handleResetCrop = (ann: Annotation) => {
    if (!ann.originalImageUrl) return
    const img = new window.Image()
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight
      const pageAspect = pageWidth / pageHeight
      const newHeight = Math.max(0.03, Math.min(1 - ann.y, (ann.width / aspect) * pageAspect))

      onUpdateAnnotation({
        ...ann,
        imageUrl: ann.originalImageUrl,
        cropData: undefined,
        height: newHeight,
      })
    }
    img.src = ann.originalImageUrl
  }

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
    isUnderline?: boolean
    isMonospace?: boolean
    isSerif?: boolean
    textAlign?: 'left' | 'center' | 'right'
    lineSpacing?: number
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
    setEditIsUnderline(Boolean(box.isUnderline))
    setEditTextAlign(box.textAlign || 'left')
    setEditLineSpacing(box.lineSpacing || 1.2)
    setEditFontFamily(
      box.fontFamily ||
        (box.isSerif
          ? 'Times Roman (Serif)'
          : box.isMonospace
          ? 'Courier (Monospace)'
          : 'Helvetica (Sans-Serif)')
    )
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
  const handleCommitText = useCallback(
    (annId: string, valueToCommit: string) => {
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
    },
    [annotations, onDeleteAnnotation, selectedAnnotationId, onSelectAnnotation, onUpdateAnnotation]
  )

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
    const isSerif = editFontFamily.includes('Serif') || editFontFamily.includes('Times')
    const isMonospace = editFontFamily.includes('Mono') || editFontFamily.includes('Courier')

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
      fontFamily: editFontFamily,
      color: editColor,
      backgroundColor: editBgColor,
      isBold: editIsBold,
      isItalic: editIsItalic,
      isUnderline: editIsUnderline,
      textAlign: editTextAlign,
      lineSpacing: editLineSpacing,
      isMonospace,
      isSerif,
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

    if (activeTool === 'stickyNote') {
      const id = generateAnnotationId()
      const newAnn: Annotation = {
        id,
        pageIndex,
        type: 'stickyNote',
        x: Math.max(0.02, Math.min(0.75, pt.x)),
        y: Math.max(0.02, Math.min(0.8, pt.y)),
        width: 0.22,
        height: 0.18,
        text: '',
        color: '#713f12',
        backgroundColor: '#fef08a',
        strokeColor: '#ca8a04',
        isOpen: true,
      }
      onAddAnnotation(newAnn)
      onSelectAnnotation(id)
      return
    }

    if (
      activeTool === 'rectangle' ||
      activeTool === 'circle' ||
      activeTool === 'line' ||
      activeTool === 'arrow' ||
      activeTool === 'underline' ||
      activeTool === 'strikethrough'
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
        const newX = Math.max(0, Math.min(1 - Math.abs(target.width), target.x + dx))
        const newY = Math.max(0, Math.min(1 - Math.abs(target.height), target.y + dy))
        setDragPos({ x: newX, y: newY })
      }
      return
    }

    if (isResizing && resizeStart && resizeTargetId) {
      const target = annotations.find((a) => a.id === resizeTargetId)
      if (target) {
        const dx = pt.x - resizeStart.x
        const dy = pt.y - resizeStart.y
        const newW =
          target.type === 'line' || target.type === 'arrow'
            ? target.width + dx
            : Math.max(0.015, Math.min(1 - target.x, target.width + dx))
        const newH =
          target.type === 'line' || target.type === 'arrow'
            ? target.height + dy
            : Math.max(0.015, Math.min(1 - target.y, target.height + dy))
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
        const xs = currentPoints.map((p) => p.x)
        const ys = currentPoints.map((p) => p.y)
        const minX = Math.min(...xs)
        const maxX = Math.max(...xs)
        const minY = Math.min(...ys)
        const maxY = Math.max(...ys)
        const w = Math.max(0.015, maxX - minX)
        const h = Math.max(0.015, maxY - minY)

        const newAnn: Annotation = {
          id,
          pageIndex,
          type: activeTool,
          x: minX,
          y: minY,
          width: w,
          height: h,
          points: currentPoints,
          strokeColor: selectedColor,
          color: selectedColor,
          strokeWidth,
          opacity: activeTool === 'highlight' ? 0.35 : 1.0,
        }
        onAddAnnotation(newAnn)
        onSelectAnnotation(id)
        setCurrentPoints([])
      } else if (shapeStart && shapeCurrent) {
        const id = generateAnnotationId()
        const minX = Math.min(shapeStart.x, shapeCurrent.x)
        const minY = Math.min(shapeStart.y, shapeCurrent.y)
        const w = Math.abs(shapeCurrent.x - shapeStart.x)
        const h = Math.abs(shapeCurrent.y - shapeStart.y)

        if (w > 0.005 || h > 0.005) {
          if (activeTool === 'underline' || activeTool === 'strikethrough') {
            const newAnn: Annotation = {
              id,
              pageIndex,
              type: activeTool,
              x: minX,
              y: minY,
              width: Math.max(0.02, w),
              height: Math.max(0.018, h),
              strokeColor: selectedColor || (activeTool === 'underline' ? '#2563eb' : '#dc2626'),
              strokeWidth: strokeWidth || 3,
              color: selectedColor,
            }
            onAddAnnotation(newAnn)
            onSelectAnnotation(id)
          } else {
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
            onSelectAnnotation(id)
          }
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
          const dx = dragPos.x - target.x
          const dy = dragPos.y - target.y
          if (target.points && target.points.length > 0) {
            const newPoints = target.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }))
            onUpdateAnnotation({ ...target, x: dragPos.x, y: dragPos.y, points: newPoints })
          } else {
            onUpdateAnnotation({ ...target, x: dragPos.x, y: dragPos.y })
          }
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
          if (target.points && target.points.length > 0 && target.width > 0 && target.height > 0) {
            const sx = resizeDims.width / target.width
            const sy = resizeDims.height / target.height
            const newPoints = target.points.map((p) => ({
              x: target.x + (p.x - target.x) * sx,
              y: target.y + (p.y - target.y) * sy,
            }))
            onUpdateAnnotation({
              ...target,
              width: resizeDims.width,
              height: resizeDims.height,
              points: newPoints,
            })
          } else {
            onUpdateAnnotation({
              ...target,
              width: resizeDims.width,
              height: resizeDims.height,
            })
          }
        }
      }
      setIsResizing(false)
      setResizeStart(null)
      setResizeTargetId(null)
      setResizeDims(null)
    }
  }

  // Keyboard shortcut for deleting selected element and canceling with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping =
        e.target instanceof HTMLElement &&
        (e.target.tagName === 'INPUT' ||
          e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable ||
          e.target.getAttribute('contenteditable') === 'true')

      if (e.key === 'Escape') {
        if (selectedActionBox) {
          e.preventDefault()
          setSelectedActionBox(null)
          return
        }
        if (editingTextId) {
          e.preventDefault()
          handleCommitText(editingTextId, editingTextVal)
          return
        }
      }

      if (isTyping) return

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
  }, [
    selectedAnnotationId,
    editingTextId,
    selectedActionBox,
    editingTextVal,
    handleCommitText,
    onDeleteAnnotation,
    onSelectAnnotation,
  ])

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
      {/* Detected Text Highlights when in "editText" mode or when match is highlighted */}
      {(activeTool === 'editText' || highlightedMatchId) &&
        detectedTextItems.map((item) => {
          const isHighlightedMatch = highlightedMatchId === item.id
          if (activeTool !== 'editText' && !isHighlightedMatch) return null

          return (
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
                  isUnderline: item.isUnderline,
                  textAlign: item.textAlign,
                  lineSpacing: item.lineSpacing,
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
              className={`border rounded-xs cursor-pointer transition-all z-20 group ${
                isHighlightedMatch
                  ? 'border-amber-500 bg-amber-400/40 ring-4 ring-amber-400 animate-pulse shadow-lg scale-[1.02]'
                  : 'border-amber-400/80 bg-amber-500/10 hover:bg-amber-500/25 hover:border-amber-600'
              }`}
              title={`Click to edit "${item.str}"`}
            >
              <div className="hidden group-hover:flex absolute -top-5 left-0 bg-slate-900/90 text-white text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-30">
                Click to edit text
              </div>
            </div>
          )
        })}

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

          {/* Replacement Text Multi-line Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <label>Replacement Text:</label>
              <span className="text-[10px] font-normal text-slate-400">Ctrl+Enter to replace</span>
            </div>
            <textarea
              rows={3}
              value={editInputText}
              onChange={(e) => setEditInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleApplyReplacement()
                }
              }}
              autoFocus
              placeholder="Enter replacement text..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium resize-y min-h-[60px]"
            />
          </div>

          {/* Typography Controls: Font Family & Font Size */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Font Family:
              </label>
              <select
                value={editFontFamily}
                onChange={(e) => setEditFontFamily(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="Helvetica (Sans-Serif)">Helvetica (Sans-Serif)</option>
                <option value="Times Roman (Serif)">Times Roman (Serif)</option>
                <option value="Courier (Monospace)">Courier (Monospace)</option>
              </select>
            </div>

            {/* Font Size & Auto-fit */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Font Size:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{editFontSize}pt</span>
              </div>
              <input
                type="range"
                min="6"
                max="72"
                value={editFontSize}
                onChange={(e) => setEditFontSize(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg mt-1"
              />
            </div>
          </div>

          {/* Style, Alignment, Line Spacing, and Colors */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Row 1: Style (B, I, U) + Alignment (Left, Center, Right) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {/* Bold, Italic, Underline */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEditIsBold(!editIsBold)}
                  title="Toggle Bold"
                  className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs transition-colors cursor-pointer ${
                    editIsBold
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setEditIsItalic(!editIsItalic)}
                  title="Toggle Italic"
                  className={`w-7 h-7 rounded-md flex items-center justify-center italic font-serif text-xs transition-colors cursor-pointer ${
                    editIsItalic
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => setEditIsUnderline(!editIsUnderline)}
                  title="Toggle Underline"
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    editIsUnderline
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setEditTextAlign('left')}
                  title="Align Left"
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    editTextAlign === 'left'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditTextAlign('center')}
                  title="Align Center"
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    editTextAlign === 'center'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditTextAlign('right')}
                  title="Align Right"
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    editTextAlign === 'right'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Line Spacing + Color Pickers + Auto-Fit */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
              {/* Line Spacing */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Spacing:</span>
                <select
                  value={editLineSpacing}
                  onChange={(e) => setEditLineSpacing(Number(e.target.value))}
                  className="px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
                >
                  <option value={1.0}>1.0x</option>
                  <option value={1.15}>1.15x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2.0}>2.0x</option>
                </select>
              </div>

              {/* Color Controls */}
              <div className="flex items-center gap-2">
                <label
                  title="Change Text Color"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-slate-500 dark:text-slate-400">Text:</span>
                  <div
                    className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                    style={{ backgroundColor: editColor }}
                  >
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                  </div>
                </label>

                <label
                  title="Change Concealment Background Fill"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <span className="text-slate-500 dark:text-slate-400">Bg:</span>
                  <div
                    className="w-5 h-5 rounded-md border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                    style={{ backgroundColor: editBgColor }}
                  >
                    <input
                      type="color"
                      value={editBgColor}
                      onChange={(e) => setEditBgColor(e.target.value)}
                      className="opacity-0 absolute inset-0 cursor-pointer"
                    />
                  </div>
                </label>
              </div>

              {/* Auto-fit Checkbox */}
              <label className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={editAutoFit}
                  onChange={(e) => setEditAutoFit(e.target.checked)}
                  className="rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span>Auto-fit</span>
              </label>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live Preview:
            </span>
            <div
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[44px] flex flex-col justify-center transition-colors"
              style={{
                backgroundColor: editBgColor,
                color: editColor,
                fontSize: `${editFontSize}px`,
                fontWeight: editIsBold ? 'bold' : 'normal',
                fontStyle: editIsItalic ? 'italic' : 'normal',
                textDecoration: editIsUnderline ? 'underline' : 'none',
                textAlign: editTextAlign,
                lineHeight: `${editLineSpacing}`,
                fontFamily:
                  editFontFamily.includes('Serif') || editFontFamily.includes('Times')
                    ? 'Georgia, serif'
                    : editFontFamily.includes('Mono') || editFontFamily.includes('Courier')
                    ? 'monospace'
                    : 'system-ui, sans-serif',
              }}
            >
              <div className="whitespace-pre-wrap break-words">
                {editInputText || <span className="opacity-40 italic text-xs">Empty text</span>}
              </div>
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
          // If dragging, apply translation offset
          const dx = isDragging && dragTargetId === ann.id && dragPos ? dragPos.x - ann.x : 0
          const dy = isDragging && dragTargetId === ann.id && dragPos ? dragPos.y - ann.y : 0
          // If resizing, apply scaling
          const sx = isResizing && resizeTargetId === ann.id && resizeDims && ann.width > 0 ? resizeDims.width / ann.width : 1
          const sy = isResizing && resizeTargetId === ann.id && resizeDims && ann.height > 0 ? resizeDims.height / ann.height : 1

          const pts = (ann.points || []).map((p) => {
            const rx = ann.x + (p.x - ann.x) * sx + dx
            const ry = ann.y + (p.y - ann.y) * sy + dy
            return { x: rx, y: ry }
          })
          const ptsStr = pts
            .map((p) => `${p.x * pageWidth},${p.y * pageHeight}`)
            .join(' ')

          const bMinX = pts.length > 0 ? Math.min(...pts.map((p) => p.x)) : ann.x
          const bMaxX = pts.length > 0 ? Math.max(...pts.map((p) => p.x)) : ann.x + ann.width
          const bMinY = pts.length > 0 ? Math.min(...pts.map((p) => p.y)) : ann.y
          const bMaxY = pts.length > 0 ? Math.max(...pts.map((p) => p.y)) : ann.y + ann.height
          const bW = Math.max(0.015, bMaxX - bMinX)
          const bH = Math.max(0.015, bMaxY - bMinY)

          return (
            <React.Fragment key={ann.id}>
              <svg
                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                className="absolute inset-0 pointer-events-auto"
                style={{ width: '100%', height: '100%' }}
                onPointerDown={(e) => {
                  if (activeTool === 'select') {
                    e.stopPropagation()
                    onSelectAnnotation(ann.id)
                    setIsDragging(true)
                    setDragStart(getNormalizedPoint(e))
                    setDragTargetId(ann.id)
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
                  className={isSelected ? 'filter drop-shadow-[0_0_4px_rgba(37,99,235,0.8)] cursor-move' : 'cursor-pointer'}
                />
              </svg>

              {/* Selection Bounding Box & Floating Controls for Pen & Highlight */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${bMinX * 100}%`,
                    top: `${bMinY * 100}%`,
                    width: `${bW * 100}%`,
                    height: `${bH * 100}%`,
                    pointerEvents: 'none',
                  }}
                  className="ring-1 ring-blue-500/70 border border-dashed border-blue-400/80 rounded-xs"
                >
                  {/* Floating Toolbar */}
                  <div
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs select-none animate-in fade-in zoom-in-95 pointer-events-auto whitespace-nowrap"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Color Picker */}
                    <label title="Change Color" className="flex items-center gap-1 cursor-pointer">
                      <span className="text-[10px] text-slate-500 font-semibold">Color:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                        style={{ backgroundColor: ann.strokeColor || ann.color || '#2563eb' }}
                      >
                        <input
                          type="color"
                          value={ann.strokeColor && ann.strokeColor.startsWith('#') ? ann.strokeColor : '#2563eb'}
                          onChange={(e) => {
                            const newCol = e.target.value
                            onUpdateAnnotation({ ...ann, strokeColor: newCol, color: newCol })
                          }}
                          className="opacity-0 absolute inset-0 cursor-pointer"
                        />
                      </div>
                    </label>

                    {/* Width Selector */}
                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500 font-semibold">Width:</span>
                      <select
                        value={ann.strokeWidth || 3}
                        onChange={(e) => {
                          onUpdateAnnotation({ ...ann, strokeWidth: Number(e.target.value) })
                        }}
                        className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                      >
                        {[1, 2, 3, 5, 8, 12].map((w) => (
                          <option key={w} value={w}>
                            {w}px
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Button */}
                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAnnotation(ann.id)
                        onSelectAnnotation(null)
                      }}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Corner Resize Handle */}
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setIsResizing(true)
                      setResizeStart(getNormalizedPoint(e))
                      setResizeTargetId(ann.id)
                    }}
                    title="Drag to resize stroke"
                    className="absolute -bottom-2 -right-2 z-20 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm cursor-se-resize pointer-events-auto"
                  />
                </div>
              )}
            </React.Fragment>
          )
        }

        if (ann.type === 'line' || ann.type === 'arrow') {
          const x1 = currentX * pageWidth
          const y1 = currentY * pageHeight
          const x2 = (currentX + currentW) * pageWidth
          const y2 = (currentY + currentH) * pageHeight
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const headLen = Math.max(12, (ann.strokeWidth || 3) * 3)

          const minX = Math.min(x1, x2)
          const maxX = Math.max(x1, x2)
          const minY = Math.min(y1, y2)
          const maxY = Math.max(y1, y2)

          return (
            <React.Fragment key={ann.id}>
              <svg
                viewBox={`0 0 ${pageWidth} ${pageHeight}`}
                className="absolute inset-0 pointer-events-auto"
                style={{ width: '100%', height: '100%' }}
                onPointerDown={(e) => {
                  if (activeTool === 'select') {
                    e.stopPropagation()
                    onSelectAnnotation(ann.id)
                    setIsDragging(true)
                    setDragStart(getNormalizedPoint(e))
                    setDragTargetId(ann.id)
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
                  className={isSelected ? 'filter drop-shadow-[0_0_4px_rgba(37,99,235,0.8)] cursor-move' : 'cursor-pointer'}
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

              {/* Selection Controls for Line / Arrow */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${(minX / pageWidth) * 100}%`,
                    top: `${(minY / pageHeight) * 100}%`,
                    width: `${Math.max(20, maxX - minX)}px`,
                    height: `${Math.max(16, maxY - minY)}px`,
                    pointerEvents: 'none',
                  }}
                  className="border border-dashed border-blue-400/80 rounded-xs"
                >
                  {/* Floating Toolbar */}
                  <div
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs select-none animate-in fade-in zoom-in-95 pointer-events-auto whitespace-nowrap"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Color Picker */}
                    <label title="Change Color" className="flex items-center gap-1 cursor-pointer">
                      <span className="text-[10px] text-slate-500 font-semibold">Color:</span>
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                        style={{ backgroundColor: ann.strokeColor || ann.color || '#2563eb' }}
                      >
                        <input
                          type="color"
                          value={ann.strokeColor && ann.strokeColor.startsWith('#') ? ann.strokeColor : '#2563eb'}
                          onChange={(e) => {
                            const newCol = e.target.value
                            onUpdateAnnotation({ ...ann, strokeColor: newCol, color: newCol })
                          }}
                          className="opacity-0 absolute inset-0 cursor-pointer"
                        />
                      </div>
                    </label>

                    {/* Width Selector */}
                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-500 font-semibold">Width:</span>
                      <select
                        value={ann.strokeWidth || 3}
                        onChange={(e) => {
                          onUpdateAnnotation({ ...ann, strokeWidth: Number(e.target.value) })
                        }}
                        className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                      >
                        {[1, 2, 3, 5, 8, 12].map((w) => (
                          <option key={w} value={w}>
                            {w}px
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete Button */}
                    <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAnnotation(ann.id)
                        onSelectAnnotation(null)
                      }}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Endpoint Resize Handle (at x2, y2) */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${((x2 - minX) / Math.max(20, maxX - minX)) * 100}%`,
                      top: `${((y2 - minY) / Math.max(16, maxY - minY)) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      setIsResizing(true)
                      setResizeStart(getNormalizedPoint(e))
                      setResizeTargetId(ann.id)
                    }}
                    title="Drag to resize / change direction"
                    className="z-20 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm cursor-crosshair pointer-events-auto"
                  />
                </div>
              )}
            </React.Fragment>
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
              if (ann.type === 'image') {
                e.stopPropagation()
                handleOpenCrop(ann)
                onSelectAnnotation(ann.id)
              } else if (ann.isPdfTextReplacement) {
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
                  isUnderline: ann.isUnderline,
                  textAlign: ann.textAlign,
                  lineSpacing: ann.lineSpacing,
                  pdfX: ann.pdfX,
                  pdfY: ann.pdfY,
                  pdfWidth: ann.pdfWidth,
                  pdfHeight: ann.pdfHeight,
                  rotation: ann.rotation,
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
              height: ann.type === 'image' || ann.type === 'signature' ? `${currentH * 100}%` : undefined,
              minHeight: ann.type !== 'image' && ann.type !== 'signature' ? `${currentH * 100}%` : undefined,
              transform: ann.rotation ? `rotate(${ann.rotation}deg)` : undefined,
              transformOrigin: 'center center',
            }}
            className={`pointer-events-auto group ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900 cursor-move' : ''
            }`}
          >
            {/* Visual Element Rendering */}
            {(ann.type === 'image' || ann.type === 'signature') && ann.imageUrl && (
              <div className="w-full h-full relative overflow-hidden rounded-xs select-none">
                <img
                  src={ann.imageUrl}
                  alt={ann.type === 'signature' ? 'PDF Signature' : 'PDF Embedded Element'}
                  draggable={false}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
            )}

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

            {ann.type === 'underline' && (
              <div className="w-full h-full flex items-end" style={{ minHeight: '14px' }}>
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(2, (ann.strokeWidth || 3) * scale)}px`,
                    backgroundColor: ann.strokeColor || ann.color || '#2563eb',
                    borderRadius: '2px',
                  }}
                />
              </div>
            )}

            {ann.type === 'strikethrough' && (
              <div className="w-full h-full flex items-center" style={{ minHeight: '14px' }}>
                <div
                  className="w-full"
                  style={{
                    height: `${Math.max(2, (ann.strokeWidth || 3) * scale)}px`,
                    backgroundColor: ann.strokeColor || ann.color || '#dc2626',
                    borderRadius: '2px',
                  }}
                />
              </div>
            )}

            {ann.type === 'stickyNote' && (
              <div
                className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-lg border text-xs"
                style={{
                  backgroundColor: ann.backgroundColor || '#fef08a',
                  borderColor: ann.strokeColor || '#ca8a04',
                }}
              >
                {/* Note Header / Drag Handle */}
                <div
                  className="flex items-center justify-between px-2.5 py-1.5 cursor-move select-none"
                  style={{ backgroundColor: ann.strokeColor || '#ca8a04', color: '#ffffff' }}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <StickyNote className="h-3.5 w-3.5" />
                    <span>{ann.author || 'Sticky Note'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteAnnotation(ann.id)
                        onSelectAnnotation(null)
                      }}
                      className="p-0.5 rounded hover:bg-black/20 text-white/90"
                      title="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Note Body Textarea */}
                <textarea
                  value={ann.text || ''}
                  placeholder="Type note or feedback here..."
                  onChange={(e) => {
                    onUpdateAnnotation({ ...ann, text: e.target.value })
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex-1 w-full p-2 bg-transparent resize-none focus:outline-none text-slate-900 font-sans text-xs leading-relaxed placeholder:text-slate-500"
                  style={{ color: ann.color || '#713f12' }}
                />

                {/* Note Palette & Footer */}
                <div className="flex items-center justify-between px-2 py-1 border-t border-black/10 bg-black/5 text-[10px]">
                  <div className="flex items-center gap-1">
                    {[
                      { bg: '#fef08a', border: '#ca8a04' }, // Yellow
                      { bg: '#fed7aa', border: '#ea580c' }, // Orange
                      { bg: '#bbf7d0', border: '#16a34a' }, // Green
                      { bg: '#bfdbfe', border: '#2563eb' }, // Blue
                      { bg: '#fbcfe8', border: '#db2777' }, // Pink
                      { bg: '#e9d5ff', border: '#9333ea' }, // Purple
                    ].map((theme, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateAnnotation({
                            ...ann,
                            backgroundColor: theme.bg,
                            strokeColor: theme.border,
                          })
                        }}
                        className="w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: theme.bg }}
                      />
                    ))}
                  </div>
                  <span className="text-black/50 font-medium">Drag to move</span>
                </div>
              </div>
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
                  textDecoration: ann.isUnderline ? 'underline' : 'none',
                  textAlign: ann.textAlign || 'left',
                  lineHeight: `${ann.lineSpacing || 1.2}`,
                  fontFamily: ann.isMonospace
                    ? '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
                    : ann.isSerif
                    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
                    : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  border:
                    ann.type === 'textbox' && !ann.isPdfTextReplacement && ann.strokeWidth && ann.strokeWidth > 0
                      ? `${ann.strokeWidth || 1}px solid ${ann.strokeColor || '#cbd5e1'}`
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

                {/* Floating Property Toolbar for Shapes & Text & Markups */}
                {ann.type !== 'image' && ann.type !== 'signature' && ann.type !== 'stickyNote' && !ann.isPdfTextReplacement && (
                  <div
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs select-none animate-in fade-in zoom-in-95 pointer-events-auto whitespace-nowrap"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Primary Color Picker */}
                    <label
                      title={ann.type === 'text' || ann.type === 'textbox' ? 'Change Text Color' : 'Change Color'}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {ann.type === 'text' || ann.type === 'textbox' ? 'Text:' : 'Color:'}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                        style={{
                          backgroundColor:
                            ann.type === 'text' || ann.type === 'textbox'
                              ? ann.color || '#0f172a'
                              : ann.strokeColor || ann.color || '#2563eb',
                        }}
                      >
                        <input
                          type="color"
                          value={
                            ann.type === 'text' || ann.type === 'textbox'
                              ? ann.color && ann.color.startsWith('#')
                                ? ann.color
                                : '#0f172a'
                              : ann.strokeColor && ann.strokeColor.startsWith('#')
                              ? ann.strokeColor
                              : '#2563eb'
                          }
                          onChange={(e) => {
                            const newCol = e.target.value
                            onUpdateAnnotation({
                              ...ann,
                              color: newCol,
                              strokeColor: newCol,
                            })
                          }}
                          className="opacity-0 absolute inset-0 cursor-pointer"
                        />
                      </div>
                    </label>

                    {/* Fill Color for Rectangle / Circle / Text Box */}
                    {(ann.type === 'rectangle' || ann.type === 'circle' || ann.type === 'textbox') && (
                      <>
                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                        <label title="Change Fill Background" className="flex items-center gap-1 cursor-pointer">
                          <span className="text-[10px] text-slate-500 font-semibold">Fill:</span>
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shadow-xs relative overflow-hidden"
                            style={{
                              backgroundColor:
                                (ann.type === 'textbox' ? ann.backgroundColor : ann.fillColor) ||
                                'transparent',
                            }}
                          >
                            <input
                              type="color"
                              value={
                                ann.type === 'textbox'
                                  ? ann.backgroundColor && ann.backgroundColor.startsWith('#')
                                    ? ann.backgroundColor
                                    : '#ffffff'
                                  : ann.fillColor && ann.fillColor.startsWith('#')
                                  ? ann.fillColor
                                  : '#ffffff'
                              }
                              onChange={(e) => {
                                const newCol = e.target.value
                                if (ann.type === 'textbox') {
                                  onUpdateAnnotation({ ...ann, backgroundColor: newCol })
                                } else {
                                  onUpdateAnnotation({ ...ann, fillColor: newCol })
                                }
                              }}
                              className="opacity-0 absolute inset-0 cursor-pointer"
                            />
                          </div>
                        </label>

                        {/* Fill Transparent Toggle */}
                        {ann.type !== 'textbox' && (
                          <button
                            type="button"
                            onClick={() => {
                              const isFilled = ann.fillColor && ann.fillColor !== 'transparent'
                              onUpdateAnnotation({
                                ...ann,
                                fillColor: isFilled ? 'transparent' : (ann.strokeColor || '#2563eb'),
                              })
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                              ann.fillColor && ann.fillColor !== 'transparent'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {ann.fillColor && ann.fillColor !== 'transparent' ? 'Solid' : 'Outline'}
                          </button>
                        )}
                      </>
                    )}

                    {/* Thickness Selector */}
                    {(ann.type === 'rectangle' ||
                      ann.type === 'circle' ||
                      ann.type === 'underline' ||
                      ann.type === 'strikethrough') && (
                      <>
                        <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-slate-500 font-semibold">Width:</span>
                          <select
                            value={ann.strokeWidth || 3}
                            onChange={(e) => {
                              onUpdateAnnotation({ ...ann, strokeWidth: Number(e.target.value) })
                            }}
                            className="px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                          >
                            {[1, 2, 3, 5, 8].map((w) => (
                              <option key={w} value={w}>
                                {w}px
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Floating Image & Signature Control Bar */}
                {(ann.type === 'image' || ann.type === 'signature') && (
                  <div
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs select-none animate-in fade-in zoom-in-95 pointer-events-auto whitespace-nowrap"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Rotate CCW */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const newRot = ((ann.rotation || 0) + 270) % 360
                        onUpdateAnnotation({ ...ann, rotation: newRot })
                      }}
                      className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Rotate 90° Counter-Clockwise"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    {/* Rotate CW */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const newRot = ((ann.rotation || 0) + 90) % 360
                        onUpdateAnnotation({ ...ann, rotation: newRot })
                      }}
                      className="p-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>

                    {ann.rotation ? (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">
                        {ann.rotation}°
                      </span>
                    ) : null}

                    {ann.type === 'image' && (
                      <>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                        {/* Crop */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCrop(ann)
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
                          title="Crop Image"
                        >
                          <Crop className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Crop</span>
                        </button>

                        {/* Reset Crop (if cropped) */}
                        {ann.originalImageUrl && ann.originalImageUrl !== ann.imageUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResetCrop(ann)
                            }}
                            className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-medium transition-colors cursor-pointer text-[11px]"
                            title="Reset to original uncropped image"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Reset</span>
                          </button>
                        )}

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

                        {/* Replace Image */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTriggerReplaceImage(ann.id)
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
                          title="Replace with another image file"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Replace</span>
                        </button>
                      </>
                    )}
                  </div>
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

      {/* Hidden file input for replacing images */}
      <input
        type="file"
        ref={replaceImageInputRef}
        accept="image/*"
        onChange={handleReplaceImageFile}
        className="hidden"
      />

      {/* Image Crop Modal */}
      {cropTargetAnnotation && (
        <ImageCropModal
          key={cropTargetAnnotation.id}
          isOpen={Boolean(cropTargetAnnotation)}
          onClose={() => setCropTargetAnnotation(null)}
          imageUrl={cropTargetAnnotation.originalImageUrl || cropTargetAnnotation.imageUrl || ''}
          onApplyCrop={handleApplyCrop}
        />
      )}
    </div>
  )
}
