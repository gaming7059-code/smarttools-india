import React, { useRef, useState, useEffect } from 'react'
import { Trash2, Edit3 } from 'lucide-react'
import type { Annotation, EditorToolMode, Point } from './types'

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

      if ((activeTool === 'draw' || activeTool === 'highlight') && currentPoints.length > 1) {
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
              if (ann.type === 'text' || ann.type === 'textbox') {
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
                  minHeight: '24px',
                  border: `${(ann.strokeWidth || 3) * scale}px solid ${ann.strokeColor || '#2563eb'}`,
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

            {(ann.type === 'text' || ann.type === 'textbox') && (
              <div
                className="w-full h-full p-1 rounded"
                style={{
                  backgroundColor: ann.backgroundColor || 'transparent',
                  color: ann.color || '#0f172a',
                  fontSize: `${(ann.fontSize || 16) * scale}px`,
                  fontWeight: 'bold',
                  lineHeight: '1.25',
                  border: ann.type === 'textbox' ? '1px solid #cbd5e1' : 'none',
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

      {/* Live Shape Preview */}
      {isDrawing && shapeStart && shapeCurrent && (
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
