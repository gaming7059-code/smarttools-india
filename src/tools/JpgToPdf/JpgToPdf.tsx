import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Upload,
  FileImage,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  Settings2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react'
import { PDFDocument, PageSizes } from 'pdf-lib'

export interface UploadedImage {
  id: string
  file: File
  name: string
  size: number
  previewUrl: string
  width: number
  height: number
}

export type PageSizeOption = 'a4' | 'a3' | 'letter' | 'original'
export type OrientationOption = 'portrait' | 'landscape' | 'auto'
export type MarginOption = 'none' | 'small' | 'medium' | 'large'

export const JpgToPdf: React.FC = () => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4')
  const [orientation, setOrientation] = useState<OrientationOption>('auto')
  const [margin, setMargin] = useState<MarginOption>('small')
  const [isConverting, setIsConverting] = useState<boolean>(false)
  const [conversionProgress, setConversionProgress] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadFileName, setDownloadFileName] = useState<string>('converted-images.pdf')
  const [pdfSizeBytes, setPdfSizeBytes] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
      if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    }
  }, [images, downloadUrl])

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Load image dimensions
  const loadImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 })
      }
      img.onerror = () => {
        resolve({ width: 800, height: 600 })
      }
      img.src = url
    })
  }

  // Handle files
  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null)
    const validFiles: File[] = []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (allowedTypes.includes(file.type.toLowerCase()) || /\.(jpe?g|png|webp)$/i.test(file.name)) {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Please upload valid JPG, JPEG, or PNG images.')
      return
    }

    const newItems: UploadedImage[] = []
    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file)
      const dims = await loadImageDimensions(previewUrl)
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl,
        width: dims.width,
        height: dims.height,
      })
    }

    setImages((prev) => [...prev, ...newItems])
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  // Reorder controls
  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImages((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[targetIndex]
      updated[targetIndex] = temp
      return updated
    })
  }

  // Drag and drop reordering
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedItemIndex === null || draggedItemIndex === index) return
    setImages((prev) => {
      const updated = [...prev]
      const item = updated.splice(draggedItemIndex, 1)[0]
      updated.splice(index, 0, item)
      return updated
    })
    setDraggedItemIndex(index)
  }

  const handleCardDragEnd = () => {
    setDraggedItemIndex(null)
  }

  // Remove single image
  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.id !== id)
    })
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
  }

  // Clear all images
  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setImages([])
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }
    setErrorMessage(null)
    setStatusMessage('')
  }

  // Fallback to render image through canvas if pdf-lib cannot directly embed (e.g. WebP or corrupted JPEG header)
  const convertImageToPngBytes = (imgItem: UploadedImage): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.naturalWidth || imgItem.width
        canvas.height = image.naturalHeight || imgItem.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context unavailable'))
          return
        }
        ctx.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'))
            return
          }
          blob.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))).catch(reject)
        }, 'image/png')
      }
      image.onerror = () => reject(new Error(`Failed to load ${imgItem.name}`))
      image.src = imgItem.previewUrl
    })
  }

  // Convert to PDF
  const handleConvertToPdf = useCallback(async () => {
    if (images.length === 0) return

    setIsConverting(true)
    setConversionProgress(0)
    setStatusMessage('Initializing PDF document...')
    setErrorMessage(null)

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl)
      setDownloadUrl(null)
    }

    try {
      const pdfDoc = await PDFDocument.create()

      // Margin point mapping
      let marginPt = 36 // default medium (0.5 inch)
      if (margin === 'none') marginPt = 0
      else if (margin === 'small') marginPt = 20
      else if (margin === 'medium') marginPt = 36
      else if (margin === 'large') marginPt = 54

      const totalImages = images.length

      for (let i = 0; i < totalImages; i++) {
        const item = images[i]
        const percent = Math.round(((i + 0.2) / totalImages) * 100)
        setConversionProgress(percent)
        setStatusMessage(`Processing image ${i + 1} of ${totalImages}: ${item.name}...`)

        // Read bytes
        const fileBuffer = await item.file.arrayBuffer()
        const fileBytes = new Uint8Array(fileBuffer)

        // Embed image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let embeddedImage: any = null
        const isPng = item.file.type === 'image/png' || /\.png$/i.test(item.name)
        const isJpg = item.file.type === 'image/jpeg' || item.file.type === 'image/jpg' || /\.(jpe?g)$/i.test(item.name)

        if (isJpg) {
          try {
            embeddedImage = await pdfDoc.embedJpg(fileBytes)
          } catch {
            // Fallback via canvas to PNG
            const pngBytes = await convertImageToPngBytes(item)
            embeddedImage = await pdfDoc.embedPng(pngBytes)
          }
        } else if (isPng) {
          try {
            embeddedImage = await pdfDoc.embedPng(fileBytes)
          } catch {
            const pngBytes = await convertImageToPngBytes(item)
            embeddedImage = await pdfDoc.embedPng(pngBytes)
          }
        } else {
          // WebP or other
          const pngBytes = await convertImageToPngBytes(item)
          embeddedImage = await pdfDoc.embedPng(pngBytes)
        }

        const imgWidth = embeddedImage.width || item.width || 800
        const imgHeight = embeddedImage.height || item.height || 600

        // Determine Page Size
        let pageWidth: number
        let pageHeight: number

        if (pageSize === 'original') {
          pageWidth = imgWidth + marginPt * 2
          pageHeight = imgHeight + marginPt * 2
        } else {
          let standardSize: [number, number]
          if (pageSize === 'a3') standardSize = PageSizes.A3
          else if (pageSize === 'letter') standardSize = PageSizes.Letter
          else standardSize = PageSizes.A4

          const [stdW, stdH] = standardSize

          // Orientation calculation
          let isLandscape = false
          if (orientation === 'landscape') {
            isLandscape = true
          } else if (orientation === 'portrait') {
            isLandscape = false
          } else {
            // Auto
            isLandscape = imgWidth > imgHeight
          }

          if (isLandscape) {
            pageWidth = Math.max(stdW, stdH)
            pageHeight = Math.min(stdW, stdH)
          } else {
            pageWidth = Math.min(stdW, stdH)
            pageHeight = Math.max(stdW, stdH)
          }
        }

        // Add page
        const page = pdfDoc.addPage([pageWidth, pageHeight])

        // Fit proportionally inside printable area
        const printableWidth = Math.max(10, pageWidth - marginPt * 2)
        const printableHeight = Math.max(10, pageHeight - marginPt * 2)

        const scale = Math.min(printableWidth / imgWidth, printableHeight / imgHeight)
        const drawWidth = imgWidth * scale
        const drawHeight = imgHeight * scale

        // Center on page
        const x = marginPt + (printableWidth - drawWidth) / 2
        const y = marginPt + (printableHeight - drawHeight) / 2

        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
        })
      }

      setStatusMessage('Compiling final PDF...')
      setConversionProgress(95)

      const pdfBytes = await pdfDoc.save()
      // Fix Uint8Array to ArrayBuffer for Blob compatibility
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const outputName = images.length === 1
        ? `${images[0].name.replace(/\.[^/.]+$/, '')}.pdf`
        : `SmartTools-India-${images.length}-images.pdf`

      setDownloadUrl(url)
      setDownloadFileName(outputName)
      setPdfSizeBytes(blob.size)
      setConversionProgress(100)
      setStatusMessage('PDF generated successfully!')
    } catch (err: unknown) {
      console.error('PDF conversion error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }, [images, pageSize, orientation, margin, downloadUrl])

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-4 ring-blue-500/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files)
              e.target.value = ''
            }
          }}
          className="hidden"
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
          <Upload className="h-8 w-8 animate-bounce-subtle" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          Drop your JPG, JPEG, or PNG images here
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Select multiple images from your computer or mobile device. All images are processed 100% locally with zero server uploads.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all">
          <Plus className="h-4 w-4" />
          <span>Select Images</span>
        </div>

        <div className="mt-3 text-[11px] text-slate-400">
          Supported: JPG, JPEG, PNG, WebP • Multi-file reordering supported
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-xs sm:text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* PDF Settings & Controls (When images are uploaded) */}
      {images.length > 0 && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Settings2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  PDF Page &amp; Layout Options
                </h4>
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove All ({images.length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Page Size */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Page Size
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'a4', label: 'A4' },
                      { id: 'letter', label: 'Letter' },
                      { id: 'a3', label: 'A3' },
                      { id: 'original', label: 'Fit Image' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPageSize(opt.id)}
                      className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        pageSize === opt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orientation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Orientation
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'auto', label: 'Auto' },
                      { id: 'portrait', label: 'Portrait' },
                      { id: 'landscape', label: 'Landscape' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrientation(opt.id)}
                      className={`px-2.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        orientation === opt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margins */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Margins
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(
                    [
                      { id: 'none', label: 'None' },
                      { id: 'small', label: 'Small' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'large', label: 'Large' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMargin(opt.id)}
                      className={`px-2 py-2 text-xs font-semibold rounded-xl border transition-all ${
                        margin === opt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Image Thumbnails & Reordering List */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Uploaded Images ({images.length} {images.length === 1 ? 'Page' : 'Pages'})
              </span>
              <span className="text-xs text-slate-400">
                Drag cards or use arrow buttons to reorder pages
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((item, idx) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, idx)}
                  onDragOver={(e) => handleCardDragOver(e, idx)}
                  onDragEnd={handleCardDragEnd}
                  className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-2.5 shadow-xs transition-all duration-200 select-none ${
                    draggedItemIndex === idx
                      ? 'border-blue-500 opacity-50 scale-95 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                  }`}
                >
                  {/* Page number badge */}
                  <span className="absolute top-4 left-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/80 text-[11px] font-bold text-white shadow-xs backdrop-blur-xs">
                    {idx + 1}
                  </span>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute top-4 right-4 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90 text-white hover:bg-red-700 shadow-xs transition-transform active:scale-90"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Thumbnail */}
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-full w-full object-contain p-1"
                    />
                  </div>

                  {/* Image info */}
                  <div className="mt-2 px-1">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{item.width}×{item.height}</span>
                      <span>{formatBytes(item.size)}</span>
                    </p>
                  </div>

                  {/* Move controls */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, 'up')}
                      aria-label="Move left"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp className="h-3.5 w-3.5 rotate-[-90deg]" />
                    </button>
                    <span className="text-[10px] font-medium text-slate-400">Page {idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={() => moveImage(idx, 'down')}
                      aria-label="Move right"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown className="h-3.5 w-3.5 rotate-[-90deg]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Convert Button */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Ready to Create PDF
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {images.length} {images.length === 1 ? 'image' : 'images'} will be compiled into a single document.
                </p>
              </div>

              <button
                type="button"
                disabled={isConverting}
                onClick={handleConvertToPdf}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 text-sm font-bold shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Converting ({conversionProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Convert to PDF</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress bar */}
            {isConverting && (
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  {statusMessage}
                </p>
              </div>
            )}

            {/* Success & Download Card */}
            {downloadUrl && (
              <div className="mt-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-5 animate-fade-in">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                        PDF Ready for Download!
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {downloadFileName} • {formatBytes(pdfSizeBytes)} • {images.length} {images.length === 1 ? 'Page' : 'Pages'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    download={downloadFileName}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
