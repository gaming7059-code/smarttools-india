import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib'
import type { PDFPageItem, Annotation, DetectedTextItem } from './types'

// Initialize PDF.js worker and assets locally for robust Vite + Cloudflare Pages support
export function getLocalAssetUrl(relativePath: string): string {
  if (typeof window !== 'undefined' && window.location) {
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'
    const cleanBase = base.endsWith('/') ? base : `${base}/`
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
    return new URL(`${cleanBase}${cleanPath}`, window.location.origin).href
  }
  return relativePath
}

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      '/assets/pdf.worker.min.mjs',
      window.location.origin
    ).href
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString()
  }
}

export interface LoadedPdfResult {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  arrayBuffer: ArrayBuffer
  pages: PDFPageItem[]
  fileName: string
  fileSize: number
}

/**
 * Loads a PDF file and extracts page dimensions and metadata.
 * Uses a cloned buffer for PDF.js so the original ArrayBuffer remains intact.
 */
export async function loadPdfData(file: File): Promise<LoadedPdfResult> {
  const arrayBuffer = await file.arrayBuffer()
  // Clone buffer so PDF.js Web Worker does not transfer or detach the primary ArrayBuffer
  const bufferForWorker = arrayBuffer.slice(0)

  const cMapUrl = getLocalAssetUrl('pdfjs/cmaps/')
  const standardFontDataUrl = getLocalAssetUrl('pdfjs/standard_fonts/')

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bufferForWorker),
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
  })
  const pdfDoc = await loadingTask.promise

  const pages: PDFPageItem[] = []
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i)
    // Extract canonical unrotated MediaBox dimensions
    const unrotatedViewport = page.getViewport({ scale: 1.0, rotation: 0 })
    pages.push({
      id: `page-${i - 1}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      originalIndex: i - 1,
      rotation: page.rotate || 0,
      width: unrotatedViewport.width,
      height: unrotatedViewport.height,
    })
  }

  return {
    pdfDoc,
    arrayBuffer,
    pages,
    fileName: file.name,
    fileSize: file.size,
  }
}

/**
 * Renders a specific page of a PDF document onto an HTML5 Canvas
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  originalPageIndex: number,
  rotation: number,
  scale: number,
  canvas: HTMLCanvasElement
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(originalPageIndex + 1)
  const effectiveRotation = rotation % 360
  const viewport = page.getViewport({ scale, rotation: effectiveRotation })

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, viewport.width, viewport.height)

  const renderContext = {
    canvasContext: ctx,
    viewport,
  }

  // @ts-expect-error - PDF.js v6 types support
  await page.render(renderContext).promise

  return {
    width: viewport.width,
    height: viewport.height,
  }
}

/**
 * Converts a hex color string to normalized RGB components (0 - 1)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '').trim()
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16) / 255,
      g: parseInt(cleaned[1] + cleaned[1], 16) / 255,
      b: parseInt(cleaned[2] + cleaned[2], 16) / 255,
    }
  }
  if (cleaned.length === 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16) / 255,
      g: parseInt(cleaned.slice(2, 4), 16) / 255,
      b: parseInt(cleaned.slice(4, 6), 16) / 255,
    }
  }
  return { r: 0, g: 0, b: 0 }
}

/**
 * Maps detected font metadata (family, bold, italic, monospace, serif) to the closest Standard PDF font
 */
export function resolveStandardFont(meta: {
  fontName?: string
  fontFamily?: string
  isBold?: boolean
  isItalic?: boolean
  isMonospace?: boolean
  isSerif?: boolean
}): StandardFonts {
  const name = (meta.fontName || '').toLowerCase()
  const family = (meta.fontFamily || '').toLowerCase()

  const isMonospace = Boolean(
    meta.isMonospace ||
    /courier|mono|code|consolas|menlo|fixed/.test(name) ||
    /monospace/.test(family)
  )
  const isSerif = Boolean(
    !isMonospace && (
      meta.isSerif ||
      /times|roman|georgia|garamond|serif|baskerville|cambria|palatino|minion/.test(name) ||
      (family.includes('serif') && !family.includes('sans'))
    )
  )
  const isBold = Boolean(
    meta.isBold ||
    /bold|black|heavy|semibold|demi|w7|w8|w9/.test(name)
  )
  const isItalic = Boolean(
    meta.isItalic ||
    /italic|oblique|slanted|kursiv/.test(name)
  )

  if (isMonospace) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique
    if (isBold) return StandardFonts.CourierBold
    if (isItalic) return StandardFonts.CourierOblique
    return StandardFonts.Courier
  }

  if (isSerif) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic
    if (isBold) return StandardFonts.TimesRomanBold
    if (isItalic) return StandardFonts.TimesRomanItalic
    return StandardFonts.TimesRoman
  }

  // Sans-serif default
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique
  if (isBold) return StandardFonts.HelveticaBold
  if (isItalic) return StandardFonts.HelveticaOblique
  return StandardFonts.Helvetica
}

/**
 * Samples the background and text color from rendered canvas pixels at the specified bounding box
 */
export function sampleBackgroundAndTextColor(
  canvas: HTMLCanvasElement,
  normX: number,
  normY: number,
  normW: number,
  normH: number
): { backgroundColor: string; textColor: string } {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return { backgroundColor: '#ffffff', textColor: '#000000' }

    const pxX = Math.max(0, Math.floor(normX * canvas.width))
    const pxY = Math.max(0, Math.floor(normY * canvas.height))
    const pxW = Math.max(2, Math.min(canvas.width - pxX, Math.floor(normW * canvas.width)))
    const pxH = Math.max(2, Math.min(canvas.height - pxY, Math.floor(normH * canvas.height)))

    const imageData = ctx.getImageData(pxX, pxY, pxW, pxH)
    const data = imageData.data

    const perimeterColors: [number, number, number][] = []

    const getPixelRgb = (idx: number): [number, number, number] => {
      const a = data[idx + 3]
      if (a < 128) {
        // Transparent pixel -> PDF paper default white background
        return [255, 255, 255]
      }
      return [data[idx], data[idx + 1], data[idx + 2]]
    }

    // Sample top & bottom rows
    for (let x = 0; x < pxW; x++) {
      const idxTop = x * 4
      perimeterColors.push(getPixelRgb(idxTop))
      const idxBot = ((pxH - 1) * pxW + x) * 4
      perimeterColors.push(getPixelRgb(idxBot))
    }

    // Sample left & right columns
    for (let y = 1; y < pxH - 1; y++) {
      const idxLeft = y * pxW * 4
      perimeterColors.push(getPixelRgb(idxLeft))
      const idxRight = (y * pxW + (pxW - 1)) * 4
      perimeterColors.push(getPixelRgb(idxRight))
    }

    if (perimeterColors.length === 0) {
      return { backgroundColor: '#ffffff', textColor: '#000000' }
    }

    // Group into color buckets of step 10 to group anti-aliased pixels
    const bucketMap = new Map<string, [number, number, number][]>()
    for (const [r, g, b] of perimeterColors) {
      const key = `${Math.floor(r / 10)},${Math.floor(g / 10)},${Math.floor(b / 10)}`
      let list = bucketMap.get(key)
      if (!list) {
        list = []
        bucketMap.set(key, list)
      }
      list.push([r, g, b])
    }

    let largestBucket: [number, number, number][] = []
    for (const list of bucketMap.values()) {
      if (list.length > largestBucket.length) {
        largestBucket = list
      }
    }

    let sumR = 0, sumG = 0, sumB = 0
    for (const [r, g, b] of largestBucket) {
      sumR += r
      sumG += g
      sumB += b
    }
    const bgR = Math.round(sumR / largestBucket.length)
    const bgG = Math.round(sumG / largestBucket.length)
    const bgB = Math.round(sumB / largestBucket.length)

    // Find foreground text color (highest Euclidean contrast from background)
    let maxDist = 0
    let fgColor: [number, number, number] = [0, 0, 0]
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      if (a < 128) continue
      const dist = Math.hypot(r - bgR, g - bgG, b - bgB)
      if (dist > maxDist) {
        maxDist = dist
        fgColor = [r, g, b]
      }
    }

    const toHex = (c: [number, number, number]) =>
      '#' + c.map((x) => x.toString(16).padStart(2, '0')).join('')

    return {
      backgroundColor: toHex([bgR, bgG, bgB]),
      textColor: maxDist > 40 ? toHex(fgColor) : '#000000',
    }
  } catch {
    return { backgroundColor: '#ffffff', textColor: '#000000' }
  }
}

/**
 * Extracts text items from a PDF page and computes normalized bounding boxes matching the visible viewport,
 * extracting font family, style (bold/italic), size, text color, and sampled background color.
 */
export async function extractPageTextItems(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  originalPageIndex: number,
  rotation: number,
  canvas?: HTMLCanvasElement | null
): Promise<DetectedTextItem[]> {
  try {
    const page = await pdfDoc.getPage(originalPageIndex + 1)
    const effectiveRotation = ((rotation % 360) + 360) % 360
    const viewport = page.getViewport({ scale: 1.0, rotation: effectiveRotation })
    const textContent = await page.getTextContent()

    // 1. Extract vector colors from PDF Operator List
    const opColorMap = new Map<string, string>()
    try {
      const opList = await page.getOperatorList()
      let currentColor = '#000000'
      const OPS = (pdfjsLib as unknown as { OPS: Record<string, number> }).OPS || {}

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i]
        const args = opList.argsArray[i]

        if (fn === OPS.setFillRGBColor) {
          if (typeof args[0] === 'string') {
            currentColor = args[0]
          } else if (args.length >= 3) {
            const r = Math.min(255, Math.max(0, Math.round(args[0]))).toString(16).padStart(2, '0')
            const g = Math.min(255, Math.max(0, Math.round(args[1]))).toString(16).padStart(2, '0')
            const b = Math.min(255, Math.max(0, Math.round(args[2]))).toString(16).padStart(2, '0')
            currentColor = `#${r}${g}${b}`
          }
        } else if (fn === OPS.setFillGray) {
          const val = Math.min(255, Math.max(0, Math.round((args[0] ?? 0) * 255)))
          const g = val.toString(16).padStart(2, '0')
          currentColor = `#${g}${g}${g}`
        } else if (fn === OPS.setFillCMYKColor) {
          const c = args[0] || 0, m = args[1] || 0, y = args[2] || 0, k = args[3] || 0
          const r = Math.min(255, Math.max(0, Math.round(255 * (1 - c) * (1 - k)))).toString(16).padStart(2, '0')
          const g = Math.min(255, Math.max(0, Math.round(255 * (1 - m) * (1 - k)))).toString(16).padStart(2, '0')
          const b = Math.min(255, Math.max(0, Math.round(255 * (1 - y) * (1 - k)))).toString(16).padStart(2, '0')
          currentColor = `#${r}${g}${b}`
        } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
          const glyphs = args[0]
          const text = Array.isArray(glyphs)
            ? glyphs
                .map((g) => (typeof g === 'object' && g ? g.unicode || g.fontChar || '' : typeof g === 'string' ? g : ''))
                .join('')
            : ''
          if (text.trim()) {
            opColorMap.set(text.trim(), currentColor)
          }
        }
      }
    } catch {
      // Operator list parsing is optional enhancement
    }

    const detected: DetectedTextItem[] = []
    let itemIdx = 0

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue

      const tx = item.transform[4]
      const ty = item.transform[5]
      const fontH = Math.max(8, Math.hypot(item.transform[2], item.transform[3]) || item.height || 12)
      const w = Math.max(10, item.width)
      const h = fontH

      // Calculate 4 corners in PDF coordinate space and convert to viewport coordinates
      const corners = [
        viewport.convertToViewportPoint(tx, ty),
        viewport.convertToViewportPoint(tx + w, ty),
        viewport.convertToViewportPoint(tx + w, ty + h),
        viewport.convertToViewportPoint(tx, ty + h),
      ]

      const xs = corners.map((c) => c[0])
      const ys = corners.map((c) => c[1])
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)

      const boxW = Math.max(10, maxX - minX)
      const boxH = Math.max(8, maxY - minY)

      // Normalize to [0, 1] relative to viewport dimensions
      const normX = Math.max(0, Math.min(1, minX / viewport.width))
      const normY = Math.max(0, Math.min(1, minY / viewport.height))
      const normW = Math.min(1 - normX, boxW / viewport.width)
      const normH = Math.min(1 - normY, boxH / viewport.height)

      // Font detection from PDF.js font objects and styles
      const fontObj = page.commonObjs?.has?.(item.fontName) ? page.commonObjs.get(item.fontName) : null
      const styleObj = textContent.styles?.[item.fontName] || {}

      const rawFontName = (fontObj?.name || fontObj?.loadedName || item.fontName || '').toString()
      const fallbackFamily = (fontObj?.fallbackName || styleObj.fontFamily || 'sans-serif').toString()
      const lowerFontName = rawFontName.toLowerCase()
      const lowerFamily = fallbackFamily.toLowerCase()

      const isMonospace = Boolean(
        fontObj?.isMonospace ||
        /courier|mono|code|consolas|menlo|fixed/.test(lowerFontName) ||
        /monospace/.test(lowerFamily)
      )
      const isSerif = Boolean(
        !isMonospace && (
          fontObj?.isSerifFont ||
          /times|roman|georgia|garamond|serif|baskerville|cambria|palatino|minion/.test(lowerFontName) ||
          (lowerFamily.includes('serif') && !lowerFamily.includes('sans'))
        )
      )
      const isBold = Boolean(
        fontObj?.bold ||
        fontObj?.black ||
        /bold|black|heavy|semibold|demi|w7|w8|w9/.test(lowerFontName)
      )
      const isItalic = Boolean(
        fontObj?.italic ||
        /italic|oblique|slanted|kursiv/.test(lowerFontName)
      )

      // Clean readable font family label
      let fontFamily = 'Sans-Serif'
      if (isMonospace) fontFamily = 'Monospace (Courier)'
      else if (isSerif) fontFamily = 'Serif (Times)'
      else if (/helvetica/i.test(rawFontName)) fontFamily = 'Helvetica'
      else if (/arial/i.test(rawFontName)) fontFamily = 'Arial'
      else if (/calibri/i.test(rawFontName)) fontFamily = 'Calibri'
      else if (/roboto/i.test(rawFontName)) fontFamily = 'Roboto'
      else if (rawFontName && !rawFontName.startsWith('g_d')) fontFamily = rawFontName

      // Sample background color & text color from canvas if available
      let sampledBg = '#ffffff'
      let sampledColor = '#000000'
      if (canvas) {
        const sampled = sampleBackgroundAndTextColor(canvas, normX, normY, normW, normH)
        sampledBg = sampled.backgroundColor
        sampledColor = sampled.textColor
      }

      // Priority for text color: opList vector color > canvas sampled color > black
      const finalColor = opColorMap.get(item.str.trim()) || (sampledColor !== '#000000' ? sampledColor : '#000000')
      const textAngle = Math.round((Math.atan2(item.transform[1], item.transform[0]) * 180) / Math.PI)
      const textRotation = (textAngle % 360 + 360) % 360

      detected.push({
        id: `detected-text-${originalPageIndex}-${itemIdx++}`,
        str: item.str,
        x: normX,
        y: normY,
        width: normW,
        height: normH,
        fontSize: Math.round(fontH),
        fontName: rawFontName,
        fontFamily,
        color: finalColor,
        backgroundColor: sampledBg,
        isBold,
        isItalic,
        isMonospace,
        isSerif,
        rotation: textRotation,
        transform: Array.from(item.transform),
        pdfX: tx,
        pdfY: ty,
        pdfWidth: w,
        pdfHeight: fontH,
      })
    }

    return detected
  } catch (err) {
    console.error('Failed to extract text from page:', err)
    return []
  }
}

/**
 * Generates a fast, lightweight sample multi-page PDF document for immediate testing
 */
export async function createSamplePdf(): Promise<{ file: File }> {
  const doc = await PDFDocument.create()

  // Page 1: A4
  const page1 = doc.addPage([595.28, 841.89])
  const { width, height } = page1.getSize()

  page1.drawText('SmartTools India — PDF Editor', {
    x: 50,
    y: height - 80,
    size: 24,
  })

  page1.drawText('Sample Document for Annotation and Editing', {
    x: 50,
    y: height - 110,
    size: 14,
  })

  page1.drawText(
    'This sample document allows you to test adding text, drawing freehand, highlighting, adding shapes (rectangles, circles, arrows), reordering pages, rotating pages, and downloading the edited PDF directly in your browser.',
    {
      x: 50,
      y: height - 160,
      size: 11,
      lineHeight: 16,
      maxWidth: width - 100,
    }
  )

  page1.drawRectangle({
    x: 50,
    y: height - 320,
    width: width - 100,
    height: 120,
    borderWidth: 1,
  })

  page1.drawText('Document Review & Approval Box', {
    x: 70,
    y: height - 230,
    size: 14,
  })

  page1.drawText('1. Use the Highlight tool to mark important notes.', {
    x: 70,
    y: height - 260,
    size: 10,
  })

  page1.drawText('2. Use the Text or Arrow tool to point out feedback.', {
    x: 70,
    y: height - 280,
    size: 10,
  })

  page1.drawText('3. Use the Download button to export your final edited PDF.', {
    x: 70,
    y: height - 300,
    size: 10,
  })

  // Page 2: A4
  const page2 = doc.addPage([595.28, 841.89])
  page2.drawText('Page 2 — Additional Workspace', {
    x: 50,
    y: height - 80,
    size: 20,
  })

  page2.drawText(
    'You can test page management on this second page: rotate it 90 degrees, duplicate it, reorder it before page 1, or delete it using the sidebar controls.',
    {
      x: 50,
      y: height - 120,
      size: 11,
      lineHeight: 16,
      maxWidth: width - 100,
    }
  )

  const pdfBytes = await doc.save()
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  const file = new File([blob], 'sample_document.pdf', { type: 'application/pdf' })

  return { file }
}

/**
 * Renders annotations to a 2D canvas context with full word wrapping and vector styling
 */
export function drawAnnotationsToCanvas(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  pageWidth: number,
  pageHeight: number
): void {
  for (const ann of annotations) {
    ctx.save()

    if (ann.type === 'draw' || ann.type === 'highlight') {
      if (ann.points && ann.points.length > 0) {
        ctx.beginPath()
        ctx.strokeStyle = ann.strokeColor || '#2563eb'
        ctx.lineWidth = (ann.strokeWidth || 3) * (ann.type === 'highlight' ? 4 : 1)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = ann.opacity !== undefined ? ann.opacity : ann.type === 'highlight' ? 0.35 : 1.0

        const firstPt = ann.points[0]
        ctx.moveTo(firstPt.x * pageWidth, firstPt.y * pageHeight)

        for (let i = 1; i < ann.points.length; i++) {
          const pt = ann.points[i]
          ctx.lineTo(pt.x * pageWidth, pt.y * pageHeight)
        }
        ctx.stroke()
      }
    } else if (ann.isPdfTextReplacement || ann.type === 'text' || ann.type === 'textbox') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = Math.max(20, ann.width * pageWidth)
      const h = Math.max(16, ann.height * pageHeight)
      const fontSize = ann.fontSize || 16

      if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
        ctx.fillStyle = ann.backgroundColor
        ctx.fillRect(x, y, w, h)
        // Never show a border for PDF text replacements
        if (ann.type === 'textbox' && !ann.isPdfTextReplacement) {
          ctx.strokeStyle = ann.strokeColor || '#94a3b8'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, w, h)
        }
      }

      ctx.fillStyle = ann.color || '#0f172a'

      let fontStyle = ''
      if (ann.isItalic) fontStyle += 'italic '
      if (ann.isBold) fontStyle += 'bold '

      let family = 'sans-serif'
      if (ann.isMonospace) family = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace'
      else if (ann.isSerif) family = 'Georgia, Cambria, "Times New Roman", Times, serif'
      else if (ann.fontFamily && !ann.fontFamily.includes('(')) family = `${ann.fontFamily}, sans-serif`
      else family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

      ctx.font = `${fontStyle}${fontSize}px ${family}`

      const text = ann.text || ''
      if (text) {
        if (ann.isPdfTextReplacement) {
          // Live fitted single-line text rendering
          ctx.textBaseline = 'middle'
          let effectiveSize = fontSize
          if (ann.autoFit !== false) {
            const metrics = ctx.measureText(text)
            if (metrics.width > w - 4 && w > 4) {
              effectiveSize = Math.max(6, Math.floor(fontSize * ((w - 4) / metrics.width) * 10) / 10)
              ctx.font = `${fontStyle}${effectiveSize}px ${family}`
            }
          }
          ctx.fillText(text, x + 2, y + h / 2)
        } else {
          // Standard multiline user textbox
          ctx.textBaseline = 'top'
          const paragraphs = text.split('\n')
          let currentY = y + 4
          const padding = 6
          const maxWidth = Math.max(20, w - padding * 2)
          const lineHeight = fontSize * 1.25

          for (const para of paragraphs) {
            if (!para) {
              currentY += lineHeight
              continue
            }
            const words = para.split(' ')
            let currentLine = ''

            for (let n = 0; n < words.length; n++) {
              const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n]
              const metrics = ctx.measureText(testLine)
              if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(currentLine, x + padding, currentY)
                currentLine = words[n]
                currentY += lineHeight
              } else {
                currentLine = testLine
              }
            }
            if (currentLine) {
              ctx.fillText(currentLine, x + padding, currentY)
              currentY += lineHeight
            }
          }
        }
      }
    } else if (ann.type === 'rectangle') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = ann.width * pageWidth
      const h = ann.height * pageHeight

      if (ann.fillColor && ann.fillColor !== 'transparent') {
        ctx.fillStyle = ann.fillColor
        ctx.fillRect(x, y, w, h)
      }

      ctx.strokeStyle = ann.strokeColor || '#2563eb'
      ctx.lineWidth = ann.strokeWidth || 3
      ctx.strokeRect(x, y, w, h)
    } else if (ann.type === 'circle') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = ann.width * pageWidth
      const h = ann.height * pageHeight

      ctx.beginPath()
      ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2)

      if (ann.fillColor && ann.fillColor !== 'transparent') {
        ctx.fillStyle = ann.fillColor
        ctx.fill()
      }

      ctx.strokeStyle = ann.strokeColor || '#2563eb'
      ctx.lineWidth = ann.strokeWidth || 3
      ctx.stroke()
    } else if (ann.type === 'line' || ann.type === 'arrow') {
      const x1 = ann.x * pageWidth
      const y1 = ann.y * pageHeight
      const x2 = (ann.x + ann.width) * pageWidth
      const y2 = (ann.y + ann.height) * pageHeight

      ctx.beginPath()
      ctx.strokeStyle = ann.strokeColor || '#2563eb'
      ctx.lineWidth = ann.strokeWidth || 3
      ctx.lineCap = 'round'
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()

      if (ann.type === 'arrow') {
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const headLen = Math.max(12, (ann.strokeWidth || 3) * 3)

        ctx.beginPath()
        ctx.fillStyle = ann.strokeColor || '#2563eb'
        ctx.moveTo(x2, y2)
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      }
    }

    ctx.restore()
  }
}

/**
 * Exports the modified PDF with pages rearranged, rotated, and annotations embedded.
 * Returns the output bytes as a Uint8Array and triggers browser download when applicable.
 */
export async function exportEditedPdf(
  originalBytes: ArrayBuffer,
  pages: PDFPageItem[],
  annotations: Annotation[],
  originalFileName: string
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true })
  const newDoc = await PDFDocument.create()

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i]
    const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex])
    const pageRotation = (pageItem.rotation % 360 + 360) % 360
    copiedPage.setRotation(degrees(pageRotation))
    newDoc.addPage(copiedPage)

    // Filter annotations for this page
    const pageAnns = annotations.filter((a) => a.pageIndex === i)
    if (pageAnns.length > 0) {
      // 1. Separate vector PDF text replacements from other annotations (draw, highlight, shapes)
      const textReplacementAnns = pageAnns.filter((a) => a.isPdfTextReplacement)
      const otherAnns = pageAnns.filter((a) => !a.isPdfTextReplacement)

      // 2. Render vector PDF text replacements directly onto copiedPage (searchable, sharp, zero borders)
      for (const ann of textReplacementAnns) {
        if (
          ann.pdfX !== undefined &&
          ann.pdfY !== undefined &&
          ann.pdfWidth !== undefined &&
          ann.pdfHeight !== undefined
        ) {
          // Conceal original text using sampled background color (borderWidth: 0)
          const bg = hexToRgb(ann.backgroundColor || '#ffffff')
          const fontH = ann.pdfHeight || ann.fontSize || 14
          const rot = degrees(ann.rotation || 0)

          // Tight, precise concealment bounds covering both ascenders and descenders
          const descent = fontH * 0.28
          const totalH = fontH * 1.16
          const padX = 0.75
          const concealX = ann.pdfX - padX
          const concealY = ann.pdfY - descent
          const concealW = ann.pdfWidth + padX * 2
          const concealH = totalH

          copiedPage.drawRectangle({
            x: concealX,
            y: concealY,
            width: concealW,
            height: concealH,
            color: rgb(bg.r, bg.g, bg.b),
            borderWidth: 0,
            rotate: rot,
          })

          // Draw vector replacement text if not empty
          if (ann.text && ann.text.trim()) {
            const stdFont = resolveStandardFont({
              fontName: ann.fontName,
              fontFamily: ann.fontFamily,
              isBold: ann.isBold,
              isItalic: ann.isItalic,
              isMonospace: ann.isMonospace,
              isSerif: ann.isSerif,
            })
            const embeddedFont = await newDoc.embedFont(stdFont)

            const origSize = ann.fontSize || 14
            let finalFontSize = origSize
            const textToDraw = ann.text

            // Auto-fit to original width if autoFit is enabled
            if (ann.autoFit !== false && ann.pdfWidth > 0) {
              const textWidthAtOrigSize = embeddedFont.widthOfTextAtSize(textToDraw, origSize)
              if (textWidthAtOrigSize > ann.pdfWidth) {
                finalFontSize = Math.max(
                  6,
                  Math.floor((origSize * (ann.pdfWidth / textWidthAtOrigSize)) * 10) / 10
                )
              }
            }

            const textColor = hexToRgb(ann.color || '#000000')

            copiedPage.drawText(textToDraw, {
              x: ann.pdfX,
              y: ann.pdfY,
              size: finalFontSize,
              font: embeddedFont,
              color: rgb(textColor.r, textColor.g, textColor.b),
              rotate: rot,
              lineHeight: finalFontSize * 1.2,
            })
          }
        }
      }

      // 3. Render any non-text annotations (pen, highlight, shapes) via canvas overlay
      if (otherAnns.length > 0) {
        const isRotatedSideways = pageRotation % 180 !== 0
        const visibleWidth = isRotatedSideways ? copiedPage.getHeight() : copiedPage.getWidth()
        const visibleHeight = isRotatedSideways ? copiedPage.getWidth() : copiedPage.getHeight()

        // High-resolution canvas for crisp vector/drawing rendering
        const scaleFactor = 2.0
        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = Math.floor(visibleWidth * scaleFactor)
        offscreenCanvas.height = Math.floor(visibleHeight * scaleFactor)

        const ctx = offscreenCanvas.getContext('2d')
        if (ctx) {
          ctx.scale(scaleFactor, scaleFactor)
          drawAnnotationsToCanvas(ctx, otherAnns, visibleWidth, visibleHeight)

          const dataUrl = offscreenCanvas.toDataURL('image/png')
          const pngImage = await newDoc.embedPng(dataUrl)

          const originX = copiedPage.getX() || 0
          const originY = copiedPage.getY() || 0
          const pageW = copiedPage.getWidth()
          const pageH = copiedPage.getHeight()

          if (pageRotation === 0) {
            copiedPage.drawImage(pngImage, {
              x: originX,
              y: originY,
              width: visibleWidth,
              height: visibleHeight,
            })
          } else if (pageRotation === 90) {
            copiedPage.drawImage(pngImage, {
              x: originX,
              y: originY + pageH,
              width: visibleWidth,
              height: visibleHeight,
              rotate: degrees(-90),
            })
          } else if (pageRotation === 180) {
            copiedPage.drawImage(pngImage, {
              x: originX + pageW,
              y: originY + pageH,
              width: visibleWidth,
              height: visibleHeight,
              rotate: degrees(-180),
            })
          } else if (pageRotation === 270) {
            copiedPage.drawImage(pngImage, {
              x: originX + pageW,
              y: originY,
              width: visibleWidth,
              height: visibleHeight,
              rotate: degrees(-270),
            })
          }
        }
      }
    }
  }

  const outputBytes = await newDoc.save()

  // Trigger browser download if running in browser window
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' })
    const downloadUrl = URL.createObjectURL(outputBlob)

    const downloadLink = document.createElement('a')
    const baseName = originalFileName.replace(/\.[^/.]+$/, '')
    downloadLink.href = downloadUrl
    downloadLink.download = `${baseName || 'document'}_edited.pdf`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000)
  }

  return outputBytes
}
