import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  PenTool,
  Type,
  Upload,
  Bookmark,
  X,
  RotateCcw,
  Check,
  Trash2,
  Sparkles,
} from 'lucide-react'
import type { SavedSignature } from './types'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertSignature: (dataUrl: string, aspectRatio: number) => void
}

type SignatureTab = 'draw' | 'type' | 'upload' | 'saved'

const SIGNATURE_COLORS = [
  { name: 'Classic Black', value: '#0f172a' },
  { name: 'Fountain Blue', value: '#1e3a8a' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Burgundy', value: '#831843' },
]

const SIGNATURE_FONTS = [
  {
    id: 'dancing',
    name: 'Elegant Script',
    family: '"Dancing Script", "Brush Script MT", cursive',
    sizeFactor: 1.0,
  },
  {
    id: 'great-vibes',
    name: 'Formal Calligraphy',
    family: '"Great Vibes", "Snell Roundhand", cursive',
    sizeFactor: 1.15,
  },
  {
    id: 'caveat',
    name: 'Modern Handwriting',
    family: '"Caveat", "Segoe Script", cursive',
    sizeFactor: 1.25,
  },
  {
    id: 'sacramento',
    name: 'Classic Cursive',
    family: '"Sacramento", "Lucida Handwriting", cursive',
    sizeFactor: 1.1,
  },
  {
    id: 'pacifico',
    name: 'Smooth Script',
    family: '"Pacifico", cursive',
    sizeFactor: 0.95,
  },
]

const LOCAL_STORAGE_KEY = 'smarttools_saved_signatures'

// Trims transparent pixels from canvas edges to give a tight, natural bounding box
function trimCanvas(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext('2d')
  if (!ctx) return sourceCanvas

  const width = sourceCanvas.width
  const height = sourceCanvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const pixels = imgData.data

  let top = height
  let bottom = 0
  let left = width
  let right = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const alpha = pixels[idx + 3]
      if (alpha > 10) {
        if (x < left) left = x
        if (x > right) right = x
        if (y < top) top = y
        if (y > bottom) bottom = y
      }
    }
  }

  // If blank canvas, return original
  if (right < left || bottom < top) return sourceCanvas

  const pad = 12
  const cropX = Math.max(0, left - pad)
  const cropY = Math.max(0, top - pad)
  const cropW = Math.min(width - cropX, right - left + pad * 2)
  const cropH = Math.min(height - cropY, bottom - top + pad * 2)

  const trimmed = document.createElement('canvas')
  trimmed.width = cropW
  trimmed.height = cropH
  const tCtx = trimmed.getContext('2d')
  if (tCtx) {
    tCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)
  }

  return trimmed
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onInsertSignature,
}) => {
  const [activeTab, setActiveTab] = useState<SignatureTab>('draw')
  const [selectedColor, setSelectedColor] = useState('#0f172a')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [saveForReuse, setSaveForReuse] = useState(true)

  // Draw Tab state
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Type Tab state
  const [typedName, setTypedName] = useState('')
  const [selectedFontId, setSelectedFontId] = useState('dancing')

  // Upload Tab state
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null)
  const [removeBackground, setRemoveBackground] = useState(true)
  const [uploadNaturalAspect, setUploadNaturalAspect] = useState(2.5)

  // Saved Signatures state
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>(() => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        if (Array.isArray(parsed)) return parsed
      }
    } catch (err) {
      console.error('Failed to load saved signatures:', err)
    }
    return []
  })

  // Load Google Fonts dynamically for typed signatures
  useEffect(() => {
    const fontLinkId = 'smarttools-signature-fonts'
    if (!document.getElementById(fontLinkId)) {
      const link = document.createElement('link')
      link.id = fontLinkId
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap'
      document.head.appendChild(link)
    }
  }, [])

  // Escape key listener to close modal
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

  // Save a new signature to localStorage
  const persistSignature = (dataUrl: string, aspect: number, label?: string) => {
    try {
      const newEntry: SavedSignature = {
        id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl,
        title: label || `Signature ${savedSignatures.length + 1}`,
        createdAt: Date.now(),
        aspectRatio: aspect,
      }
      const updated = [newEntry, ...savedSignatures].slice(0, 12)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      setSavedSignatures(updated)
    } catch (err) {
      console.error('Failed to save signature for reuse:', err)
    }
  }

  const handleDeleteSavedSignature = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = savedSignatures.filter((s) => s.id !== id)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
      setSavedSignatures(updated)
    } catch (err) {
      console.error('Failed to delete saved signature:', err)
    }
  }

  // --- DRAW CANVAS HANDLERS ---
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
  }, [])

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      setTimeout(initCanvas, 50)
    }
  }, [isOpen, activeTab, initCanvas])

  const handlePointerDownDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = selectedColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    setIsDrawing(true)
    setHasDrawn(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMoveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const handlePointerUpDraw = () => {
    setIsDrawing(false)
  }

  const handleClearDraw = () => {
    initCanvas()
  }

  // --- INSERT ACTIONS ---
  const handleApplyDrawnSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return

    const trimmed = trimCanvas(canvas)
    const dataUrl = trimmed.toDataURL('image/png')
    const aspect = trimmed.width / trimmed.height

    if (saveForReuse) {
      persistSignature(dataUrl, aspect, 'Hand-drawn Signature')
    }

    onInsertSignature(dataUrl, aspect)
    onClose()
  }

  const handleApplyTypedSignature = () => {
    const name = typedName.trim()
    if (!name) return

    const font = SIGNATURE_FONTS.find((f) => f.id === selectedFontId) || SIGNATURE_FONTS[0]

    // Render typed name to high-resolution offscreen canvas
    const offscreen = document.createElement('canvas')
    offscreen.width = 1200
    offscreen.height = 400
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    const fontSize = Math.round(90 * font.sizeFactor)
    ctx.font = `${fontSize}px ${font.family}`
    ctx.fillStyle = selectedColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(name, offscreen.width / 2, offscreen.height / 2)

    const trimmed = trimCanvas(offscreen)
    const dataUrl = trimmed.toDataURL('image/png')
    const aspect = trimmed.width / trimmed.height

    if (saveForReuse) {
      persistSignature(dataUrl, aspect, name)
    }

    onInsertSignature(dataUrl, aspect)
    onClose()
  }

  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const originalDataUrl = ev.target?.result as string
      if (!originalDataUrl) return

      const img = new Image()
      img.onload = () => {
        const aspect = img.naturalWidth / img.naturalHeight
        setUploadNaturalAspect(aspect)

        if (removeBackground) {
          // Process image on canvas to convert near-white paper background to transparent
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const d = imgData.data

            for (let i = 0; i < d.length; i += 4) {
              const r = d[i]
              const g = d[i + 1]
              const b = d[i + 2]
              // Check if pixel is white or light gray background
              const brightness = (r * 299 + g * 587 + b * 114) / 1000
              if (brightness > 210) {
                d[i + 3] = 0 // transparent
              } else if (brightness > 170) {
                // Smooth antialiased falloff
                const alpha = Math.round(((210 - brightness) / 40) * 255)
                d[i + 3] = Math.min(d[i + 3], alpha)
              }
            }
            ctx.putImageData(imgData, 0, 0)
            const trimmed = trimCanvas(canvas)
            setUploadedDataUrl(trimmed.toDataURL('image/png'))
            setUploadNaturalAspect(trimmed.width / trimmed.height)
            return
          }
        }

        setUploadedDataUrl(originalDataUrl)
      }
      img.src = originalDataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleApplyUploadedSignature = () => {
    if (!uploadedDataUrl) return

    if (saveForReuse) {
      persistSignature(uploadedDataUrl, uploadNaturalAspect, 'Uploaded Signature')
    }

    onInsertSignature(uploadedDataUrl, uploadNaturalAspect)
    onClose()
  }

  const handleApplySavedSignature = (sig: SavedSignature) => {
    onInsertSignature(sig.dataUrl, sig.aspectRatio)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signature-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="flex flex-col w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <PenTool className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="signature-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Signature
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create, upload, or reuse your verified signature
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <PenTool className="h-3.5 w-3.5" />
            <span>Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'type'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Type</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved ({savedSignatures.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* 1. DRAW TAB */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              {/* Controls bar: Colors & Clear */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Ink Color:</span>
                  <div className="flex items-center gap-1.5">
                    {SIGNATURE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedColor(c.value)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          selectedColor === c.value
                            ? 'ring-2 ring-blue-500 scale-110 shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-200 dark:border-slate-700 mx-1" />

                  {/* Stroke Width */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => setStrokeWidth(2)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${strokeWidth === 2 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold' : ''}`}
                    >
                      Fine
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrokeWidth(3)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${strokeWidth === 3 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold' : ''}`}
                    >
                      Med
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrokeWidth(4.5)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${strokeWidth === 4.5 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold' : ''}`}
                    >
                      Bold
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearDraw}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Clear signature pad"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Drawing Pad Canvas */}
              <div className="relative w-full h-52 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden cursor-crosshair shadow-inner">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDownDraw}
                  onPointerMove={handlePointerMoveDraw}
                  onPointerUp={handlePointerUpDraw}
                  className="w-full h-full touch-none"
                />

                {/* Baseline Guide */}
                <div className="absolute bottom-10 left-6 right-6 border-b border-dashed border-slate-300 dark:border-slate-700 pointer-events-none flex items-center justify-between text-[10px] text-slate-400 select-none pb-0.5">
                  <span>Sign on the line</span>
                  <span className="text-slate-300 dark:text-slate-700">✕</span>
                </div>

                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                    Draw your signature here with mouse or touch
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. TYPE TAB */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <label htmlFor="typed-name-input">Your Full Name:</label>
                  <div className="flex items-center gap-1.5">
                    {SIGNATURE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedColor(c.value)}
                        className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                          selectedColor === c.value
                            ? 'ring-2 ring-blue-500 scale-110 shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <input
                  id="typed-name-input"
                  type="text"
                  autoFocus
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="e.g. Alexander Hamilton"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Font Style Selection List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <span className="text-xs font-semibold text-slate-500">Choose Calligraphy Style:</span>
                <div className="grid grid-cols-1 gap-2">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFontId(font.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                        selectedFontId === font.id
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {font.name}
                        </div>
                        <div
                          className="text-2xl py-1 truncate leading-relaxed"
                          style={{
                            fontFamily: font.family,
                            color: selectedColor,
                          }}
                        >
                          {typedName.trim() || 'Your Signature'}
                        </div>
                      </div>
                      {selectedFontId === font.id && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white flex-shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. UPLOAD TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/*"
                onChange={handleUploadFileChange}
                className="hidden"
              />

              {!uploadedDataUrl ? (
                <div
                  onClick={() => uploadInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-slate-50 dark:bg-slate-950/40 cursor-pointer transition-colors text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 mb-3 shadow-xs">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Click to upload signature image
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PNG, JPG, WebP photo of your handwritten signature
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[160px]">
                    <img
                      src={uploadedDataUrl}
                      alt="Uploaded Signature Preview"
                      className="max-h-36 max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadedDataUrl(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-red-600 transition-colors shadow-xs cursor-pointer"
                      title="Remove and upload different image"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={removeBackground}
                      onChange={(e) => setRemoveBackground(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Automatically remove white paper background (make transparent)</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* 4. SAVED TAB (REUSE ACROSS PAGES) */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Click any signature below to instantly place it on the current PDF page:
              </div>

              {savedSignatures.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <Bookmark className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No saved signatures yet
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Draw or type a signature, check &quot;Save for 1-click reuse&quot;, and it will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {savedSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      onClick={() => handleApplySavedSignature(sig)}
                      className="group relative flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer text-center"
                    >
                      <div className="h-16 w-full flex items-center justify-center p-1">
                        <img
                          src={sig.dataUrl}
                          alt={sig.title || 'Saved signature'}
                          className="max-h-full max-w-full object-contain pointer-events-none"
                        />
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 mt-1 truncate max-w-full">
                        {sig.title || 'Signature'}
                      </div>

                      {/* Delete saved signature button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedSignature(sig.id, e)}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-600 transition-all"
                        title="Delete from saved list"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
          {activeTab !== 'saved' ? (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveForReuse}
                onChange={(e) => setSaveForReuse(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>Save for 1-click reuse on other pages</span>
            </label>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'draw' && (
              <button
                type="button"
                onClick={handleApplyDrawnSignature}
                disabled={!hasDrawn}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Insert Signature</span>
              </button>
            )}

            {activeTab === 'type' && (
              <button
                type="button"
                onClick={handleApplyTypedSignature}
                disabled={!typedName.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Insert Signature</span>
              </button>
            )}

            {activeTab === 'upload' && (
              <button
                type="button"
                onClick={handleApplyUploadedSignature}
                disabled={!uploadedDataUrl}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Insert Signature</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
