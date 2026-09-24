import React, { useRef, useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
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

  // Dragging / Resizing state
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [originalAnn, setOriginalAnn] = useState<Annotation | null>(null)

  // Text inline editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [editingTextVal, setEditingTextVal] = useState('')

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex)

  // Converts client event coordinates to normalized [0, 1] relative to page
  const getNormalizedPoint = (e: React.PointerEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    return { x, y }
  }

  // Handle Pointer Down
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on an input/textarea or action button, let it handle
    const target = e.target as HTMLElement
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.closest('button')) {
      return
    }

    const pt = getNormalizedPoint(e)

    if (activeTool === 'select') {
      // If clicking background, deselect
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
      // Create text element immediately
      const id = generateAnnotationId()
      const isBox = activeTool === 'textbox'
      const newAnn: Annotation = {
        id,
        pageIndex,
        type: activeTool,
        x: pt.x,
        y: pt.y,
        width: isBox ? 0.35 : 0.25,
        height: isBox ? 0.12 : 0.06,
        text: 'Click or type text...',
        fontSize,
        color: selectedColor,
        backgroundColor: isBox ? '#ffffff' : 'transparent',
      }
      onAddAnnotation(newAnn)
      onSelectAnnotation(id)
      setEditingTextId(id)
      setEditingTextVal('Click or type text...')
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

    if (isDragging && dragStart && originalAnn) {
      const dx = pt.x - dragStart.x
      const dy = pt.y - dragStart.y
      const updated: Annotation = {
        ...originalAnn,
        x: Math.max(0, Math.min(1 - originalAnn.width, originalAnn.x + dx)),
        y: Math.max(0, Math.min(1 - originalAnn.height, originalAnn.y + dy)),
      }
      onUpdateAnnotation(updated)
      return
    }

    if (isResizing && dragStart && originalAnn) {
      const dx = pt.x - dragStart.x
      const dy = pt.y - dragStart.y
      const updated: Annotation = {
        ...originalAnn,
        width: Math.max(0.04, originalAnn.width + dx),
        height: Math.max(0.03, originalAnn.height + dy),
      }
      onUpdateAnnotation(updated)
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

    if (isDragging || isResizing) {
      setIsDragging(false)
      setIsResizing(false)
      setDragStart(null)
      setOriginalAnn(null)
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
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        touchAction: 'none',
      }}
    >
      {/* Existing Annotations for this Page */}
      {pageAnnotations.map((ann) => {
        const isSelected = selectedAnnotationId === ann.id
        const isEditing = editingTextId === ann.id

        if (ann.type === 'draw' || ann.type === 'highlight') {
          // Render SVG polyline
          const ptsStr = (ann.points || [])
            .map((p) => `${p.x * pageWidth},${p.y * pageHeight}`)
            .join(' ')
          return (
            <svg
              key={ann.id}
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

        const leftPx = ann.x * pageWidth
        const topPx = ann.y * pageHeight
        const widthPx = Math.abs(ann.width * pageWidth)
        const heightPx = Math.abs(ann.height * pageHeight)

        if (ann.type === 'line' || ann.type === 'arrow') {
          const x1 = ann.x * pageWidth
          const y1 = ann.y * pageHeight
          const x2 = (ann.x + ann.width) * pageWidth
          const y2 = (ann.y + ann.height) * pageHeight
          const angle = Math.atan2(y2 - y1, x2 - x1)
          const headLen = Math.max(12, (ann.strokeWidth || 3) * 3)

          return (
            <svg
              key={ann.id}
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
              if (activeTool === 'select') {
                e.stopPropagation()
                onSelectAnnotation(ann.id)
                setIsDragging(true)
                setDragStart(getNormalizedPoint(e))
                setOriginalAnn(ann)
              }
            }}
            onDoubleClick={(e) => {
              if (ann.type === 'text' || ann.type === 'textbox') {
                e.stopPropagation()
                setEditingTextId(ann.id)
                setEditingTextVal(ann.text || '')
              }
            }}
            style={{
              position: 'absolute',
              left: `${leftPx}px`,
              top: `${topPx}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
            }}
            className={`pointer-events-auto group ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : ''
            }`}
          >
            {/* Visual Element Rendering */}
            {ann.type === 'rectangle' && (
              <div
                className="w-full h-full"
                style={{
                  border: `${ann.strokeWidth || 3}px solid ${ann.strokeColor || '#2563eb'}`,
                  backgroundColor: ann.fillColor || 'transparent',
                }}
              />
            )}

            {ann.type === 'circle' && (
              <div
                className="w-full h-full rounded-full"
                style={{
                  border: `${ann.strokeWidth || 3}px solid ${ann.strokeColor || '#2563eb'}`,
                  backgroundColor: ann.fillColor || 'transparent',
                }}
              />
            )}

            {(ann.type === 'text' || ann.type === 'textbox') && (
              <div
                className="w-full h-full p-1 overflow-hidden"
                style={{
                  backgroundColor: ann.backgroundColor || 'transparent',
                  color: ann.color || '#0f172a',
                  fontSize: `${ann.fontSize || 16}px`,
                  fontWeight: 'bold',
                  lineHeight: '1.25',
                }}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={editingTextVal}
                    onChange={(e) => {
                      setEditingTextVal(e.target.value)
                      onUpdateAnnotation({ ...ann, text: e.target.value })
                    }}
                    onBlur={() => setEditingTextId(null)}
                    className="w-full h-full resize-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-1 rounded border border-blue-400 focus:outline-none"
                  />
                ) : (
                  <span className="whitespace-pre-wrap break-words">{ann.text || 'Text'}</span>
                )}
              </div>
            )}

            {/* Selection Controls (Resize Handle & Delete Button) */}
            {isSelected && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteAnnotation(ann.id)
                    onSelectAnnotation(null)
                  }}
                  className="absolute -top-3.5 -right-3.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                  title="Delete element"
                  aria-label="Delete element"
                >
                  <Trash2 className="h-3 w-3" />
                </button>

                {/* Resize Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setIsResizing(true)
                    setDragStart(getNormalizedPoint(e))
                    setOriginalAnn(ann)
                  }}
                  className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-sm cursor-se-resize"
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
