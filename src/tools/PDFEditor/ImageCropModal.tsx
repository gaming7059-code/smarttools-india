import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Crop, X, Check, RotateCcw, Maximize2 } from 'lucide-react'
import type { ImageCropData } from './types'

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onApplyCrop: (croppedDataUrl: string, cropData: ImageCropData) => void
}

type AspectRatioOption = 'free' | '1:1' | '4:3' | '16:9' | '3:2'

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onApplyCrop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Crop rectangle in normalized [0, 1] relative to image
  const [crop, setCrop] = useState<ImageCropData>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // Dragging / Resizing interaction state
  const [isInteracting, setIsInteracting] = useState(false)
  const [interactionType, setInteractionType] = useState<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w' | null
  >(null)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [startCrop, setStartCrop] = useState<ImageCropData | null>(null)

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setImageLoaded(true)
  }

  // Adjust crop for fixed aspect ratio
  const applyAspectRatio = useCallback(
    (ratio: AspectRatioOption, currentCrop: ImageCropData) => {
      if (ratio === 'free' || naturalSize.width === 0 || naturalSize.height === 0) return currentCrop

      let targetRatio = 1
      if (ratio === '1:1') targetRatio = 1
      else if (ratio === '4:3') targetRatio = 4 / 3
      else if (ratio === '16:9') targetRatio = 16 / 9
      else if (ratio === '3:2') targetRatio = 3 / 2

      // targetRatio = (cropWidth * naturalWidth) / (cropHeight * naturalHeight)
      // cropHeight = (cropWidth * naturalWidth) / (targetRatio * naturalHeight)
      const imageRatio = naturalSize.width / naturalSize.height
      let newW = currentCrop.width
      let newH = (newW * imageRatio) / targetRatio

      if (newH > 1 - currentCrop.y) {
        newH = 1 - currentCrop.y
        newW = (newH * targetRatio) / imageRatio
      }

      if (newW > 1 - currentCrop.x) {
        newW = 1 - currentCrop.x
        newH = (newW * imageRatio) / targetRatio
      }

      return {
        ...currentCrop,
        width: Math.max(0.05, Math.min(1 - currentCrop.x, newW)),
        height: Math.max(0.05, Math.min(1 - currentCrop.y, newH)),
      }
    },
    [naturalSize]
  )

  const handleAspectRatioChange = (ratio: AspectRatioOption) => {
    setAspectRatio(ratio)
    setCrop((prev) => applyAspectRatio(ratio, prev))
  }

  const handleResetCrop = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 })
    setAspectRatio('free')
  }

  // Normalize client coordinates to [0, 1] relative to the rendered image element
  const getNormalizedEventPoint = (e: React.PointerEvent): { x: number; y: number } | null => {
    if (!imageRef.current) return null
    const rect = imageRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    return { x, y }
  }

  const handlePointerDown = (
    e: React.PointerEvent,
    type: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w'
  ) => {
    e.stopPropagation()
    const pt = getNormalizedEventPoint(e)
    if (!pt) return

    setIsInteracting(true)
    setInteractionType(type)
    setStartPoint(pt)
    setStartCrop({ ...crop })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting || !startPoint || !startCrop || !interactionType) return
    const pt = getNormalizedEventPoint(e)
    if (!pt) return

    const dx = pt.x - startPoint.x
    const dy = pt.y - startPoint.y

    let newX = startCrop.x
    let newY = startCrop.y
    let newW = startCrop.width
    let newH = startCrop.height

    if (interactionType === 'move') {
      newX = Math.max(0, Math.min(1 - startCrop.width, startCrop.x + dx))
      newY = Math.max(0, Math.min(1 - startCrop.height, startCrop.y + dy))
    } else {
      if (interactionType.includes('w')) {
        const potentialW = startCrop.width - dx
        if (potentialW >= 0.05 && startCrop.x + dx >= 0) {
          newX = startCrop.x + dx
          newW = potentialW
        }
      } else if (interactionType.includes('e')) {
        newW = Math.max(0.05, Math.min(1 - startCrop.x, startCrop.width + dx))
      }

      if (interactionType.includes('n')) {
        const potentialH = startCrop.height - dy
        if (potentialH >= 0.05 && startCrop.y + dy >= 0) {
          newY = startCrop.y + dy
          newH = potentialH
        }
      } else if (interactionType.includes('s')) {
        newH = Math.max(0.05, Math.min(1 - startCrop.y, startCrop.height + dy))
      }
    }

    const updated = {
      x: Math.max(0, Math.min(0.95, newX)),
      y: Math.max(0, Math.min(0.95, newY)),
      width: Math.max(0.05, Math.min(1 - newX, newW)),
      height: Math.max(0.05, Math.min(1 - newY, newH)),
    }

    if (aspectRatio !== 'free' && interactionType !== 'move') {
      setCrop(applyAspectRatio(aspectRatio, updated))
    } else {
      setCrop(updated)
    }
  }

  const handlePointerUp = () => {
    setIsInteracting(false)
    setInteractionType(null)
    setStartPoint(null)
    setStartCrop(null)
  }

  // Generate cropped image from canvas
  const handleApply = () => {
    if (!imageRef.current || naturalSize.width === 0 || naturalSize.height === 0) return

    const img = imageRef.current
    const sx = Math.round(crop.x * naturalSize.width)
    const sy = Math.round(crop.y * naturalSize.height)
    const sWidth = Math.max(1, Math.round(crop.width * naturalSize.width))
    const sHeight = Math.max(1, Math.round(crop.height * naturalSize.height))

    const canvas = document.createElement('canvas')
    canvas.width = sWidth
    canvas.height = sHeight
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight)
      const croppedDataUrl = canvas.toDataURL('image/png')
      onApplyCrop(croppedDataUrl, crop)
      onClose()
    }
  }

  if (!isOpen) return null

  const croppedPxW = Math.round(crop.width * naturalSize.width)
  const croppedPxH = Math.round(crop.height * naturalSize.height)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="flex flex-col w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <h2 id="image-crop-modal-title" className="text-sm font-bold text-slate-900 dark:text-white">Crop Image</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag handles to adjust crop frame or select aspect ratio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Aspect Ratio Toolbar */}
        <div className="flex items-center justify-between gap-2 px-6 py-2.5 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-400 mr-1">Aspect:</span>
            {(['free', '1:1', '4:3', '16:9', '3:2'] as AspectRatioOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAspectRatioChange(opt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  aspectRatio === opt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {opt === 'free' ? 'Free' : opt}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetCrop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset crop to full image"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Crop Viewport */}
        <div
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative flex items-center justify-center p-6 bg-slate-900/5 dark:bg-black/40 min-h-[320px] max-h-[55vh] overflow-hidden select-none"
        >
          {/* Main Image */}
          <div className="relative inline-block max-w-full max-h-[50vh]">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop target"
              onLoad={handleImageLoad}
              draggable={false}
              className="max-h-[50vh] max-w-full object-contain pointer-events-none rounded-lg shadow-sm"
            />

            {/* Crop Overlay Mask & Handles */}
            {imageLoaded && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                {/* Darkened overlay outside the crop box */}
                <div
                  className="absolute border-2 border-blue-500 pointer-events-auto shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] cursor-move"
                  style={{
                    left: `${crop.x * 100}%`,
                    top: `${crop.y * 100}%`,
                    width: `${crop.width * 100}%`,
                    height: `${crop.height * 100}%`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule of thirds grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nwse-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nesw-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nwse-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nesw-resize"
                  />

                  {/* Edge Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'n')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border border-blue-600 rounded-full shadow-xs cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 's')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border border-blue-600 rounded-full shadow-xs cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'w')}
                    className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2.5 h-6 bg-white border border-blue-600 rounded-full shadow-xs cursor-ew-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'e')}
                    className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2.5 h-6 bg-white border border-blue-600 rounded-full shadow-xs cursor-ew-resize"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>
              {imageLoaded ? `${croppedPxW} × ${croppedPxH} px` : 'Loading...'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!imageLoaded}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>Apply Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
