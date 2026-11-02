import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload,
  Image as ImageIcon,
  Download,
  RotateCcw,
  Sliders,
  Sparkles,
  Maximize2,
  Split,
  Eye,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Sun,
  Contrast as ContrastIcon,
  Palette,
  Crosshair
} from 'lucide-react'

export type ScaleFactor = 1 | 2 | 4
export type OutputFormat = 'image/jpeg' | 'image/png'

export interface Adjustments {
  sharpness: number // 0 to 100
  brightness: number // -100 to 100
  contrast: number // -100 to 100
  saturation: number // -100 to 100
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  sharpness: 35,
  brightness: 5,
  contrast: 15,
  saturation: 10,
}

export const ImageQualityIncreaser: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [originalWidth, setOriginalWidth] = useState<number>(0)
  const [originalHeight, setOriginalHeight] = useState<number>(0)
  const [originalSize, setOriginalSize] = useState<number>(0)

  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(2)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/jpeg')
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS)

  // Preview & Processing state
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [sliderPosition, setSliderPosition] = useState<number>(50) // 0 to 100% for split view
  const [comparisonMode, setComparisonMode] = useState<'split' | 'side-by-side' | 'toggle'>('split')
  const [showOriginalOnly, setShowOriginalOnly] = useState<boolean>(false)
  const [estimatedSize, setEstimatedSize] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgElementRef = useRef<HTMLImageElement | null>(null)
  const splitContainerRef = useRef<HTMLDivElement | null>(null)
  const processedUrlRef = useRef<string | null>(null)
  const isDraggingSplit = useRef<boolean>(false)

  // Clean up Object URLs on change/unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (processedUrlRef.current) URL.revokeObjectURL(processedUrlRef.current)
    }
  }, [originalUrl])

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 B'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Handle uploaded image
  const handleImageUpload = (file: File) => {
    setErrorMessage(null)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type.toLowerCase()) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WebP).')
      return
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (processedUrl) {
      URL.revokeObjectURL(processedUrl)
      setProcessedUrl(null)
    }

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setImageFile(file)
      setOriginalUrl(url)
      setOriginalWidth(img.naturalWidth)
      setOriginalHeight(img.naturalHeight)
      setOriginalSize(file.size)
      imgElementRef.current = img
    }
    img.onerror = () => {
      setErrorMessage('Failed to decode the selected image. Please try another file.')
    }
    img.src = url
  }

  // Real Convolution & Pixel Processing Engine
  const processImageCanvas = useCallback(
    async (targetScale: ScaleFactor, currentAdj: Adjustments, format: OutputFormat): Promise<{ url: string; size: number }> => {
      if (!imgElementRef.current || originalWidth === 0 || originalHeight === 0) {
        throw new Error('No source image available')
      }

      const source = imgElementRef.current
      const targetW = originalWidth * targetScale
      const targetH = originalHeight * targetScale

      // Create main canvas
      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Could not initialize Canvas 2D context')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Multi-pass stepped super-sampling if 4x upscale
      if (targetScale === 4) {
        // Step 1: 1x -> 2x
        const stepCanvas = document.createElement('canvas')
        stepCanvas.width = originalWidth * 2
        stepCanvas.height = originalHeight * 2
        const stepCtx = stepCanvas.getContext('2d')
        if (stepCtx) {
          stepCtx.imageSmoothingEnabled = true
          stepCtx.imageSmoothingQuality = 'high'
          stepCtx.drawImage(source, 0, 0, stepCanvas.width, stepCanvas.height)
          // Step 2: 2x -> 4x
          ctx.drawImage(stepCanvas, 0, 0, targetW, targetH)
        } else {
          ctx.drawImage(source, 0, 0, targetW, targetH)
        }
      } else {
        ctx.drawImage(source, 0, 0, targetW, targetH)
      }

      // Pixel-level enhancement: Unsharp Masking + Contrast + Brightness + Saturation
      const imgData = ctx.getImageData(0, 0, targetW, targetH)
      const data = imgData.data
      const width = targetW
      const height = targetH

      // Clone original data for unsharp mask 3x3 convolution
      const originalBuffer = new Uint8ClampedArray(data)

      // Contrast factor calculation
      const c = currentAdj.contrast
      const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))

      // Brightness addition
      const brightnessAdd = (currentAdj.brightness / 100) * 128

      // Saturation multiplier
      const satMultiplier = 1 + currentAdj.saturation / 100

      // Sharpening weight
      const sharpAmount = (currentAdj.sharpness / 100) * 0.75

      // Single-pass convolution & color adjustment
      for (let y = 0; y < height; y++) {
        const yOffset = y * width
        const yTop = (y > 0 ? y - 1 : y) * width
        const yBottom = (y < height - 1 ? y + 1 : y) * width

        for (let x = 0; x < width; x++) {
          const idx = (yOffset + x) * 4
          const xLeft = x > 0 ? x - 1 : x
          const xRight = x < width - 1 ? x + 1 : x

          // 3x3 Unsharp Mask kernel on RGB channels
          for (let ch = 0; ch < 3; ch++) {
            const currentVal = originalBuffer[idx + ch]
            let val = currentVal

            if (sharpAmount > 0) {
              const top = originalBuffer[(yTop + x) * 4 + ch]
              const bottom = originalBuffer[(yBottom + x) * 4 + ch]
              const left = originalBuffer[(yOffset + xLeft) * 4 + ch]
              const right = originalBuffer[(yOffset + xRight) * 4 + ch]

              // Laplacian high-pass delta = 4 * center - (top + bottom + left + right)
              const laplacian = 4 * currentVal - (top + bottom + left + right)
              val = currentVal + sharpAmount * laplacian
            }

            // Brightness
            val = val + brightnessAdd

            // Contrast
            val = contrastFactor * (val - 128) + 128

            data[idx + ch] = val < 0 ? 0 : val > 255 ? 255 : val
          }

          // Saturation Adjustment via Rec.709 Luminance
          if (satMultiplier !== 1) {
            const r = data[idx]
            const g = data[idx + 1]
            const b = data[idx + 2]
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

            let newR = luminance + satMultiplier * (r - luminance)
            let newG = luminance + satMultiplier * (g - luminance)
            let newB = luminance + satMultiplier * (b - luminance)

            data[idx] = newR < 0 ? 0 : newR > 255 ? 255 : newR
            data[idx + 1] = newG < 0 ? 0 : newG > 255 ? 255 : newG
            data[idx + 2] = newB < 0 ? 0 : newB > 255 ? 255 : newB
          }
        }
      }

      ctx.putImageData(imgData, 0, 0)

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate output image'))
              return
            }
            const url = URL.createObjectURL(blob)
            resolve({ url, size: blob.size })
          },
          format,
          format === 'image/jpeg' ? 0.92 : undefined
        )
      })
    },
    [originalWidth, originalHeight]
  )

  // Trigger processing with debouncing
  useEffect(() => {
    if (!imageFile || originalWidth === 0) return

    let isMounted = true

    const timer = setTimeout(async () => {
      if (isMounted) setIsProcessing(true)
      try {
        const result = await processImageCanvas(scaleFactor, adjustments, outputFormat)
        if (isMounted) {
          if (processedUrlRef.current) URL.revokeObjectURL(processedUrlRef.current)
          processedUrlRef.current = result.url
          setProcessedUrl(result.url)
          setEstimatedSize(result.size)
          setIsProcessing(false)
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Enhancement error:', err)
          setErrorMessage(err instanceof Error ? err.message : 'Processing failed')
          setIsProcessing(false)
        }
      }
    }, 150)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [imageFile, originalWidth, scaleFactor, adjustments, outputFormat, processImageCanvas])

  // Reset adjustments
  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setScaleFactor(2)
    setOutputFormat('image/jpeg')
    setErrorMessage(null)
  }

  // Split-slider dragging
  const handleSplitMouseDown = () => {
    isDraggingSplit.current = true
  }

  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !splitContainerRef.current) return
    const rect = splitContainerRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const percent = Math.max(5, Math.min(95, (offsetX / rect.width) * 100))
    setSliderPosition(percent)
  }

  const handleSplitMouseUp = () => {
    isDraggingSplit.current = false
  }

  // Touch support for split slider
  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current || !e.touches[0]) return
    const rect = splitContainerRef.current.getBoundingClientRect()
    const offsetX = e.touches[0].clientX - rect.left
    const percent = Math.max(5, Math.min(95, (offsetX / rect.width) * 100))
    setSliderPosition(percent)
  }

  const outputWidth = originalWidth * scaleFactor
  const outputHeight = originalHeight * scaleFactor

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Upload Dropzone (When no image is loaded) */}
      {!imageFile && (
        <div
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleImageUpload(e.dataTransfer.files[0])
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragOver(false)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 ring-4 ring-indigo-500/20 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageUpload(e.target.files[0])
                e.target.value = ''
              }
            }}
            className="hidden"
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs">
            <ImageIcon className="h-8 w-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Upload Image to Enhance Quality &amp; Resolution
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Drag &amp; drop your JPG, PNG, or WebP image. Multi-pass super-resolution resampling, unsharp mask sharpening, and tone correction run 100% in your browser.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all">
            <Upload className="h-4 w-4" />
            <span>Select Image File</span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            Hardware-accelerated client-side canvas processing • Zero cloud uploads • 100% private
          </div>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Main Workspace (When image is loaded) */}
      {imageFile && originalUrl && (
        <div className="space-y-6">
          {/* Top Bar with Image Meta and Change Image button */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-xs">
            <div className="flex items-center gap-3 truncate">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={imageFile.name}>
                  {imageFile.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Original: {originalWidth} × {originalHeight} px • {formatBytes(originalSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Change Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageUpload(e.target.files[0])
                    e.target.value = ''
                  }
                }}
                className="hidden"
              />
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 shadow-lg overflow-hidden">
            {/* View Mode Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setComparisonMode('split')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    comparisonMode === 'split'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Split className="h-3.5 w-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComparisonMode('side-by-side')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    comparisonMode === 'side-by-side'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Side-by-Side</span>
                </button>
              </div>

              {/* Hold to view original toggle */}
              <button
                type="button"
                onMouseDown={() => setShowOriginalOnly(true)}
                onMouseUp={() => setShowOriginalOnly(false)}
                onTouchStart={() => setShowOriginalOnly(true)}
                onTouchEnd={() => setShowOriginalOnly(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  showOriginalOnly ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{showOriginalOnly ? 'Showing Original' : 'Hold for Original'}</span>
              </button>
            </div>

            {/* Display Area */}
            <div className="relative min-h-[300px] max-h-[580px] flex items-center justify-center bg-slate-900/80 rounded-2xl overflow-hidden">
              {isProcessing && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2 text-xs font-bold text-white shadow-xl">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Enhancing image pixels...</span>
                  </div>
                </div>
              )}

              {/* 1. Split View Mode */}
              {comparisonMode === 'split' && (
                <div
                  ref={splitContainerRef}
                  onMouseMove={handleSplitMouseMove}
                  onMouseUp={handleSplitMouseUp}
                  onTouchMove={handleSplitTouchMove}
                  className="relative w-full h-full flex items-center justify-center cursor-ew-resize select-none overflow-hidden"
                  style={{ maxHeight: '560px' }}
                >
                  {/* Enhanced image (base) */}
                  <img
                    src={showOriginalOnly ? originalUrl : processedUrl || originalUrl}
                    alt="Enhanced"
                    className="max-h-[540px] max-w-full object-contain pointer-events-none"
                  />

                  {/* Original image (clipped on left side) */}
                  {!showOriginalOnly && (
                    <div
                      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={originalUrl}
                        alt="Original"
                        className="max-h-[540px] max-w-full object-contain"
                      />
                    </div>
                  )}

                  {/* Vertical Divider line */}
                  {!showOriginalOnly && (
                    <div
                      onMouseDown={handleSplitMouseDown}
                      className="absolute top-0 bottom-0 z-20 w-1 bg-white cursor-ew-resize shadow-md"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl border border-slate-300">
                        <Split className="h-4 w-4" />
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <span className="absolute top-3 left-3 z-10 rounded-md bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-slate-300 backdrop-blur-xs">
                    Original
                  </span>
                  <span className="absolute top-3 right-3 z-10 rounded-md bg-indigo-600/90 px-2 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    Enhanced ({scaleFactor}x)
                  </span>
                </div>
              )}

              {/* 2. Side-by-Side Mode */}
              {comparisonMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full p-2">
                  <div className="relative flex flex-col items-center justify-center bg-slate-900 rounded-xl p-2 border border-slate-800">
                    <span className="absolute top-3 left-3 z-10 rounded-md bg-slate-950/80 px-2 py-1 text-[11px] font-bold text-slate-300">
                      Original ({originalWidth}×{originalHeight})
                    </span>
                    <img
                      src={originalUrl}
                      alt="Original"
                      className="max-h-[420px] max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="relative flex flex-col items-center justify-center bg-slate-900 rounded-xl p-2 border border-slate-800">
                    <span className="absolute top-3 left-3 z-10 rounded-md bg-indigo-600/90 px-2 py-1 text-[11px] font-bold text-white">
                      Enhanced ({outputWidth}×{outputHeight})
                    </span>
                    <img
                      src={processedUrl || originalUrl}
                      alt="Enhanced"
                      className="max-h-[420px] max-w-full object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hint footer */}
            <div className="mt-2 text-center text-[11px] text-slate-400">
              Drag the white handle left/right to compare original detail vs enhanced clarity
            </div>
          </div>

          {/* Controls & Adjustment Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Sliders & Adjustments */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Clarity &amp; Quality Adjustments
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleResetAdjustments}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All</span>
                </button>
              </div>

              {/* Slider 1: Sharpness (Unsharp Mask) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Crosshair className="h-4 w-4 text-indigo-500" />
                    Edge Sharpness (Unsharp Mask)
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{adjustments.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.sharpness}
                  onChange={(e) =>
                    setAdjustments((prev) => ({ ...prev, sharpness: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Applies 3x3 Laplacian convolution to sharpen micro-edges without causing noisy halos.
                </p>
              </div>

              {/* Slider 2: Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <ContrastIcon className="h-4 w-4 text-emerald-500" />
                    Contrast Enhancement
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={adjustments.contrast}
                  onChange={(e) =>
                    setAdjustments((prev) => ({ ...prev, contrast: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Expands dynamic range between shadows and highlights for a cleaner punch.
                </p>
              </div>

              {/* Slider 3: Brightness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Sun className="h-4 w-4 text-amber-500" />
                    Brightness Boost
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">{adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={adjustments.brightness}
                  onChange={(e) =>
                    setAdjustments((prev) => ({ ...prev, brightness: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-amber-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Illuminates underexposed phone photos or dark scans cleanly.
                </p>
              </div>

              {/* Slider 4: Saturation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Palette className="h-4 w-4 text-rose-500" />
                    Color Saturation &amp; Vibrancy
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">{adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={adjustments.saturation}
                  onChange={(e) =>
                    setAdjustments((prev) => ({ ...prev, saturation: parseInt(e.target.value) || 0 }))
                  }
                  className="w-full accent-rose-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Rec.709 relative luminance color matrix boosting dull tones.
                </p>
              </div>
            </div>

            {/* Column 3: Resolution & Download Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Export Settings
                  </h4>
                </div>

                {/* Resolution scale buttons */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Output Resolution
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { scale: 1, label: '1x Original', desc: '100%' },
                        { scale: 2, label: '2x Upscale', desc: 'HD 200%' },
                        { scale: 4, label: '4x Upscale', desc: 'UHD 400%' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.scale}
                        type="button"
                        onClick={() => setScaleFactor(item.scale)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          scaleFactor === item.scale
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] opacity-75">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Format */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Output File Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutputFormat('image/jpeg')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        outputFormat === 'image/jpeg'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      JPG (Compressed)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputFormat('image/png')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        outputFormat === 'image/png'
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      PNG (Lossless)
                    </button>
                  </div>
                </div>

                {/* Dimensions breakdown */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Target Resolution:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {outputWidth} × {outputHeight} px
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Megapixels:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {((outputWidth * outputHeight) / 1000000).toFixed(2)} MP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Estimated Size:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatBytes(estimatedSize)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Action Button */}
              <div className="pt-2">
                <a
                  href={processedUrl || '#'}
                  download={`${imageFile.name.replace(/\.[^/.]+$/, '')}-enhanced-${scaleFactor}x.${outputFormat === 'image/jpeg' ? 'jpg' : 'png'}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Enhanced Image</span>
                </a>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Multi-pass canvas pipeline • 100% private in browser
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
