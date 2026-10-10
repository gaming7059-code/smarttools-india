import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, degrees, StandardFonts, rgb, PDFFont } from 'pdf-lib'
import { encryptPDF } from '@pdfsmaller/pdf-encrypt'
import { decryptPDF } from '@pdfsmaller/pdf-decrypt'
import type { PDFPageItem, Annotation, DetectedTextItem, SourcePdfDocument, PdfSecuritySettings } from './types'

export class PasswordRequiredError extends Error {
  override name = 'PasswordRequiredError'
  constructor(message = 'This PDF document is protected with a password.') {
    super(message)
  }
}

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
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
}

export interface LoadedPdfResult {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  arrayBuffer: ArrayBuffer
  pages: PDFPageItem[]
  fileName: string
  fileSize: number
  sourceDocs?: Record<string, SourcePdfDocument>
}

/**
 * Loads a PDF file and extracts page dimensions and metadata.
 * Uses a cloned buffer for PDF.js so the original ArrayBuffer remains intact.
 */
export async function loadPdfData(file: File, password?: string): Promise<LoadedPdfResult> {
  let arrayBuffer = await file.arrayBuffer()

  // If password was provided, try decrypting first so pdf-lib will be able to edit/save pages without encryption stream errors
  if (password) {
    try {
      const decrypted = await decryptPDF(new Uint8Array(arrayBuffer), password)
      const copy = new Uint8Array(decrypted.byteLength)
      copy.set(decrypted)
      arrayBuffer = copy.buffer as ArrayBuffer
    } catch (decryptErr) {
      console.warn('Direct PDF decryption attempt failed; falling back to PDF.js with password:', decryptErr)
    }
  }

  // Clone buffer so PDF.js Web Worker does not transfer or detach the primary ArrayBuffer
  const bufferForWorker = arrayBuffer.slice(0)

  const cMapUrl = getLocalAssetUrl('pdfjs/cmaps/')
  const standardFontDataUrl = getLocalAssetUrl('pdfjs/standard_fonts/')

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(bufferForWorker),
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
    password: password || undefined,
  })

  let pdfDoc: pdfjsLib.PDFDocumentProxy
  try {
    pdfDoc = await loadingTask.promise
  } catch (err: unknown) {
    const errObj = err as { name?: string; message?: string; code?: number }
    const errName = (errObj?.name || '').toLowerCase()
    const errMsg = (errObj?.message || '').toLowerCase()

    if (
      errName.includes('password') ||
      errMsg.includes('password') ||
      errObj?.code === 1 || // NEED_PASSWORD
      errObj?.code === 2 // INCORRECT_PASSWORD
    ) {
      throw new PasswordRequiredError(
        password ? 'Incorrect password. Please try again.' : 'This PDF document is protected with a password.'
      )
    }
    throw err
  }

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
      sourceDocId: 'primary',
    })
  }

  const sourceDocs: Record<string, SourcePdfDocument> = {
    primary: {
      id: 'primary',
      name: file.name,
      pdfDoc,
      arrayBuffer,
    },
  }

  return {
    pdfDoc,
    arrayBuffer,
    pages,
    fileName: file.name,
    fileSize: file.size,
    sourceDocs,
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
  canvas: HTMLCanvasElement,
  isBlank?: boolean,
  pageWidth?: number,
  pageHeight?: number
): Promise<{ width: number; height: number }> {
  if (isBlank) {
    const effectiveRotation = ((rotation % 360) + 360) % 360
    const isSideways = effectiveRotation % 180 !== 0
    const baseW = pageWidth || 595.28
    const baseH = pageHeight || 841.89
    const visibleWidth = (isSideways ? baseH : baseW) * scale
    const visibleHeight = (isSideways ? baseW : baseH) * scale

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(visibleWidth * dpr)
    canvas.height = Math.floor(visibleHeight * dpr)
    canvas.style.width = `${Math.floor(visibleWidth)}px`
    canvas.style.height = `${Math.floor(visibleHeight)}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D canvas context')

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, visibleWidth, visibleHeight)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, visibleWidth, visibleHeight)

    return {
      width: visibleWidth,
      height: visibleHeight,
    }
  }

  const page = await pdfDoc.getPage(originalPageIndex + 1)
  const effectiveRotation = ((rotation % 360) + 360) % 360
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
    /monospace|courier/.test(family)
  )
  const isSerif = Boolean(
    !isMonospace && (
      meta.isSerif ||
      /times|roman|georgia|garamond|serif|baskerville|cambria|palatino|minion/.test(name) ||
      (family.includes('serif') && !family.includes('sans')) ||
      family.includes('times')
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
  canvas?: HTMLCanvasElement | null,
  isBlank?: boolean
): Promise<DetectedTextItem[]> {
  if (isBlank || originalPageIndex < 0) {
    return []
  }
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
  pageHeight: number,
  loadedImages?: Map<string, HTMLImageElement>
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
      } else if (ann.type === 'highlight') {
        const x = ann.x * pageWidth
        const y = ann.y * pageHeight
        const w = ann.width * pageWidth
        const h = ann.height * pageHeight
        ctx.fillStyle = ann.fillColor || ann.color || ann.strokeColor || '#fde047'
        ctx.globalAlpha = ann.opacity !== undefined ? ann.opacity : 0.38
        ctx.fillRect(x, y, w, h)
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
          ctx.textBaseline = 'top'
          const lines = text.split('\n')
          const lineSpacing = ann.lineSpacing || 1.2
          let effectiveSize = fontSize

          if (ann.autoFit !== false && w > 4) {
            let maxLineWidth = 0
            for (const line of lines) {
              const metrics = ctx.measureText(line)
              if (metrics.width > maxLineWidth) maxLineWidth = metrics.width
            }
            if (maxLineWidth > w - 4) {
              effectiveSize = Math.max(6, Math.floor(fontSize * ((w - 4) / maxLineWidth) * 10) / 10)
              ctx.font = `${fontStyle}${effectiveSize}px ${family}`
            }
          }

          const lineHeight = effectiveSize * lineSpacing
          const align = ann.textAlign || 'left'
          let currentY = y + Math.max(0, (h - lines.length * lineHeight) / 2)

          for (const line of lines) {
            const metrics = ctx.measureText(line)
            let lineX = x + 2
            if (align === 'center') {
              lineX = x + Math.max(0, (w - metrics.width) / 2)
            } else if (align === 'right') {
              lineX = x + Math.max(0, w - metrics.width - 2)
            }
            ctx.fillText(line, lineX, currentY)

            if (ann.isUnderline && line.trim()) {
              ctx.beginPath()
              ctx.strokeStyle = ann.color || '#0f172a'
              ctx.lineWidth = Math.max(1, effectiveSize * 0.07)
              const underlineY = currentY + effectiveSize * 0.95
              ctx.moveTo(lineX, underlineY)
              ctx.lineTo(lineX + metrics.width, underlineY)
              ctx.stroke()
            }

            currentY += lineHeight
          }
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
    } else if ((ann.type === 'image' || ann.type === 'signature') && ann.imageUrl) {
      const img = loadedImages?.get(ann.id)
      if (img) {
        const x = ann.x * pageWidth
        const y = ann.y * pageHeight
        const w = ann.width * pageWidth
        const h = ann.height * pageHeight
        const rot = ann.rotation || 0

        if (rot) {
          const cx = x + w / 2
          const cy = y + h / 2
          ctx.translate(cx, cy)
          ctx.rotate((rot * Math.PI) / 180)
          ctx.drawImage(img, -w / 2, -h / 2, w, h)
        } else {
          ctx.drawImage(img, x, y, w, h)
        }
      }
    } else if (ann.type === 'underline') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = ann.width * pageWidth
      const h = ann.height * pageHeight
      ctx.beginPath()
      ctx.strokeStyle = ann.strokeColor || ann.color || '#2563eb'
      ctx.lineWidth = ann.strokeWidth || 3
      ctx.lineCap = 'round'
      const lineY = y + h - (ann.strokeWidth || 3) / 2
      ctx.moveTo(x, lineY)
      ctx.lineTo(x + w, lineY)
      ctx.stroke()
    } else if (ann.type === 'strikethrough') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = ann.width * pageWidth
      const h = ann.height * pageHeight
      ctx.beginPath()
      ctx.strokeStyle = ann.strokeColor || ann.color || '#dc2626'
      ctx.lineWidth = ann.strokeWidth || 3
      ctx.lineCap = 'round'
      const lineY = y + h / 2
      ctx.moveTo(x, lineY)
      ctx.lineTo(x + w, lineY)
      ctx.stroke()
    } else if (ann.type === 'stickyNote') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = Math.max(120, ann.width * pageWidth)
      const h = Math.max(80, ann.height * pageHeight)
      const bg = ann.backgroundColor || '#fef08a'
      const border = ann.strokeColor || '#ca8a04'

      // Note card
      ctx.fillStyle = bg
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = border
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)

      // Top title bar
      ctx.fillStyle = border
      ctx.fillRect(x, y, w, 20)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textBaseline = 'middle'
      ctx.fillText(ann.author || 'Sticky Note', x + 8, y + 10)

      // Note content text
      if (ann.text) {
        ctx.fillStyle = ann.color || '#713f12'
        ctx.font = '12px sans-serif'
        ctx.textBaseline = 'top'
        const padding = 8
        const maxW = w - padding * 2
        const lineHeight = 16
        let currentY = y + 26
        const paragraphs = ann.text.split('\n')
        for (const para of paragraphs) {
          const words = para.split(' ')
          let currentLine = ''
          for (let n = 0; n < words.length; n++) {
            const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n]
            const metrics = ctx.measureText(testLine)
            if (metrics.width > maxW && n > 0) {
              ctx.fillText(currentLine, x + padding, currentY)
              currentLine = words[n]
              currentY += lineHeight
              if (currentY > y + h - 14) break
            } else {
              currentLine = testLine
            }
          }
          if (currentLine && currentY <= y + h - 14) {
            ctx.fillText(currentLine, x + padding, currentY)
            currentY += lineHeight
          }
        }
      }
    }

    ctx.restore()
  }
}

/**
 * Sanitizes and normalizes an exported PDF filename, ensuring safe cross-platform
 * filesystem characters and a guaranteed .pdf extension.
 */
export function sanitizePdfFileName(fileName: string, defaultName: string = 'document_edited.pdf'): string {
  if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
    return defaultName
  }
  let clean = fileName.split(/[/\\]/).pop() || defaultName
  clean = clean
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join('')
    .replace(/[/\\:*?"<>|]/g, '_')
    .trim()
  clean = clean.replace(/^[.\s]+|[.\s]+$/g, '')
  if (!clean) return defaultName
  if (!clean.toLowerCase().endsWith('.pdf')) {
    clean = `${clean}.pdf`
  }
  return clean
}

/**
 * Maps a visual rectangle (top-left origin, screen coordinates) to native PDF page coordinates,
 * taking page rotation into account.
 */
export function visualRectToPdfRect(
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  pageW: number,
  pageH: number,
  pageRotation: number
): { x: number; y: number; width: number; height: number } {
  const rot = ((pageRotation % 360) + 360) % 360
  if (rot === 0) {
    return { x: sx, y: pageH - sy - sh, width: sw, height: sh }
  } else if (rot === 90) {
    return { x: sy, y: sx, width: sh, height: sw }
  } else if (rot === 180) {
    return { x: pageW - sx - sw, y: sy, width: sw, height: sh }
  } else {
    // 270 degrees
    return { x: pageW - sy - sh, y: pageH - sx - sw, width: sh, height: sw }
  }
}

/**
 * Maps a visual text line baseline coordinate to native PDF page coordinates and rotation angle,
 * ensuring text remains visually horizontal and upright on rotated pages.
 */
export function visualTextToPdfCoords(
  sx: number,
  syBaseline: number,
  pageW: number,
  pageH: number,
  pageRotation: number
): { x: number; y: number; rotate: number } {
  const rot = ((pageRotation % 360) + 360) % 360
  if (rot === 0) {
    return { x: sx, y: pageH - syBaseline, rotate: 0 }
  } else if (rot === 90) {
    return { x: syBaseline, y: sx, rotate: -90 }
  } else if (rot === 180) {
    return { x: pageW - sx, y: syBaseline, rotate: -180 }
  } else {
    // 270 degrees
    return { x: pageW - syBaseline, y: pageH - sx, rotate: -270 }
  }
}

/**
 * Wraps text into lines based on font character widths and a maximum box width.
 */
export function wrapTextForPdf(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    const words = para.split(' ')
    let currentLine = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word
      let w = 0
      try {
        w = font.widthOfTextAtSize(testLine, fontSize)
      } catch {
        w = testLine.length * (fontSize * 0.6)
      }
      if (w > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/**
 * Helper to ensure an image data URL is PNG or JPEG for direct PDF embedding.
 */
async function ensurePngOrJpgDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:image/png') || url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
    return url
  }
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Canvas conversion unavailable outside browser'))
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth || img.width || 400
        c.height = img.naturalHeight || img.height || 400
        const ctx = c.getContext('2d')
        if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
        ctx.drawImage(img, 0, 0)
        resolve(c.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = (e) => reject(new Error(`Failed to load image for embedding: ${String(e)}`))
    img.src = url
  })
}

/**
 * Exports the modified PDF with pages rearranged, rotated, and annotations embedded.
 * Ensures high-quality vector text preservation, searchable text, direct high-resolution
 * image embedding, and accurate rotation handling with zero unwanted watermarks.
 * Returns the output bytes as a Uint8Array and triggers browser download when applicable.
 */
export async function exportEditedPdf(
  originalBytes: ArrayBuffer,
  pages: PDFPageItem[],
  annotations: Annotation[],
  originalFileName: string,
  sourceDocs?: Record<string, { arrayBuffer: ArrayBuffer }>,
  triggerDownload: boolean = true,
  securitySettings?: PdfSecuritySettings | null
): Promise<Uint8Array> {
  const loadedPdfLibDocs = new Map<string, PDFDocument>()
  const primaryDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true })
  loadedPdfLibDocs.set('primary', primaryDoc)

  if (sourceDocs) {
    for (const [docId, sDoc] of Object.entries(sourceDocs)) {
      if (!loadedPdfLibDocs.has(docId) && sDoc.arrayBuffer) {
        try {
          const lDoc = await PDFDocument.load(sDoc.arrayBuffer, { ignoreEncryption: true })
          loadedPdfLibDocs.set(docId, lDoc)
        } catch (e) {
          console.error(`Failed to load source doc ${docId}:`, e)
        }
      }
    }
  }

  const newDoc = await PDFDocument.create()
  const embeddedFontsMap = new Map<StandardFonts, PDFFont>()
  const getOrEmbedFont = async (stdFont: StandardFonts): Promise<PDFFont> => {
    let font = embeddedFontsMap.get(stdFont)
    if (!font) {
      font = await newDoc.embedFont(stdFont)
      embeddedFontsMap.set(stdFont, font)
    }
    return font
  }

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i]
    const pageRotation = ((pageItem.rotation % 360) + 360) % 360

    let copiedPage: import('pdf-lib').PDFPage
    if (pageItem.isBlank) {
      copiedPage = newDoc.addPage([pageItem.width || 595.28, pageItem.height || 841.89])
      copiedPage.setRotation(degrees(pageRotation))
    } else {
      const srcDocId = pageItem.sourceDocId || 'primary'
      const srcDoc = loadedPdfLibDocs.get(srcDocId) || primaryDoc
      const [copied] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex])
      copied.setRotation(degrees(pageRotation))
      newDoc.addPage(copied)
      copiedPage = copied
    }

    const pageW = copiedPage.getWidth()
    const pageH = copiedPage.getHeight()
    const isRotatedSideways = pageRotation % 180 !== 0
    const visibleWidth = isRotatedSideways ? pageH : pageW
    const visibleHeight = isRotatedSideways ? pageW : pageH

    // Filter annotations for this page
    const pageAnns = annotations.filter((a) => a.pageIndex === i)
    if (pageAnns.length > 0) {
      const handledAnnIds = new Set<string>()

      // 1. Vector PDF text replacements (conceal original text + draw replacement text)
      const textReplacementAnns = pageAnns.filter((a) => a.isPdfTextReplacement)
      for (const ann of textReplacementAnns) {
        let concealX: number
        let concealY: number
        let concealW: number
        let concealH: number
        const fontH = ann.pdfHeight || ann.fontSize || 14
        const rot = degrees(ann.rotation || 0)

        if (
          ann.pdfX !== undefined &&
          ann.pdfY !== undefined &&
          ann.pdfWidth !== undefined &&
          ann.pdfHeight !== undefined
        ) {
          const padX = 0.75
          const descent = fontH * 0.28
          const totalH = fontH * 1.16
          concealX = ann.pdfX - padX
          concealY = ann.pdfY - descent
          concealW = ann.pdfWidth + padX * 2
          concealH = totalH
        } else {
          const sx = ann.x * visibleWidth
          const sy = ann.y * visibleHeight
          const sw = Math.max(10, ann.width * visibleWidth)
          const sh = Math.max(8, ann.height * visibleHeight)
          const r = visualRectToPdfRect(sx, sy, sw, sh, pageW, pageH, pageRotation)
          concealX = r.x
          concealY = r.y
          concealW = r.width
          concealH = r.height
        }

        const bg = hexToRgb(ann.backgroundColor || '#ffffff')
        copiedPage.drawRectangle({
          x: concealX,
          y: concealY,
          width: concealW,
          height: concealH,
          color: rgb(bg.r, bg.g, bg.b),
          borderWidth: 0,
          rotate: rot,
        })

        if (ann.text && ann.text.trim()) {
          const stdFont = resolveStandardFont({
            fontName: ann.fontName,
            fontFamily: ann.fontFamily,
            isBold: ann.isBold,
            isItalic: ann.isItalic,
            isMonospace: ann.isMonospace,
            isSerif: ann.isSerif,
          })
          const embeddedFont = await getOrEmbedFont(stdFont)

          const origSize = ann.fontSize || 14
          let finalFontSize = origSize
          const lines = ann.text.split('\n')
          const lineSpacing = ann.lineSpacing || 1.2

          // Auto-fit to original width if autoFit is enabled
          const targetW = ann.pdfWidth || (ann.width * visibleWidth)
          if (ann.autoFit !== false && targetW > 0) {
            let maxLineWidth = 0
            for (const line of lines) {
              try {
                const w = embeddedFont.widthOfTextAtSize(line, origSize)
                if (w > maxLineWidth) maxLineWidth = w
              } catch {
                // Ignore font measurement errors
              }
            }
            if (maxLineWidth > targetW) {
              finalFontSize = Math.max(
                6,
                Math.floor((origSize * (targetW / maxLineWidth)) * 10) / 10
              )
            }
          }

          const lineHeight = finalFontSize * lineSpacing
          const textColor = hexToRgb(ann.color || '#000000')
          const align = ann.textAlign || 'left'

          // Expand concealment downwards if multiple lines
          if (lines.length > 1) {
            const extraHeight = (lines.length - 1) * lineHeight
            copiedPage.drawRectangle({
              x: concealX,
              y: concealY - extraHeight,
              width: concealW,
              height: concealH + extraHeight,
              color: rgb(bg.r, bg.g, bg.b),
              borderWidth: 0,
              rotate: rot,
            })
          }

          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx]
            let lineWidth = 0
            try {
              lineWidth = embeddedFont.widthOfTextAtSize(line, finalFontSize)
            } catch {
              lineWidth = line.length * (finalFontSize * 0.6)
            }

            let lineX = ann.pdfX !== undefined ? ann.pdfX : concealX
            if (align === 'center') {
              lineX += Math.max(0, (targetW - lineWidth) / 2)
            } else if (align === 'right') {
              lineX += Math.max(0, targetW - lineWidth)
            }
            const lineY = (ann.pdfY !== undefined ? ann.pdfY : (concealY + concealH - finalFontSize)) - lineIdx * lineHeight

            try {
              copiedPage.drawText(line, {
                x: lineX,
                y: lineY,
                size: finalFontSize,
                font: embeddedFont,
                color: rgb(textColor.r, textColor.g, textColor.b),
                rotate: rot,
                lineHeight: lineHeight,
              })

              if (ann.isUnderline && line.trim()) {
                const underlineThickness = Math.max(0.75, finalFontSize * 0.07)
                const underlineY = lineY - finalFontSize * 0.15
                copiedPage.drawRectangle({
                  x: lineX,
                  y: underlineY,
                  width: lineWidth,
                  height: underlineThickness,
                  color: rgb(textColor.r, textColor.g, textColor.b),
                  borderWidth: 0,
                  rotate: rot,
                })
              }
            } catch (err) {
              console.warn('Vector replacement text draw failed, falling back to canvas:', err)
            }
          }
        }
        handledAnnIds.add(ann.id)
      }

      // 2. User-added vector text and textboxes (preserve sharp vector text & searchability)
      const userTextAnns = pageAnns.filter(
        (a) => !handledAnnIds.has(a.id) && !a.isPdfTextReplacement && (a.type === 'text' || a.type === 'textbox') && a.text && a.text.trim()
      )

      for (const ann of userTextAnns) {
        const stdFont = resolveStandardFont({
          fontName: ann.fontName,
          fontFamily: ann.fontFamily,
          isBold: ann.isBold,
          isItalic: ann.isItalic,
          isMonospace: ann.isMonospace,
          isSerif: ann.isSerif,
        })
        const embeddedFont = await getOrEmbedFont(stdFont)

        const sx = ann.x * visibleWidth
        const sy = ann.y * visibleHeight
        const sw = Math.max(20, ann.width * visibleWidth)
        const sh = Math.max(16, ann.height * visibleHeight)
        const fontSize = ann.fontSize || 16
        const lineSpacing = ann.lineSpacing || 1.25
        const lineHeight = fontSize * lineSpacing
        const padding = ann.type === 'textbox' ? 6 : 0
        const align = ann.textAlign || 'left'
        const textColor = hexToRgb(ann.color || '#0f172a')

        // Wrap lines if textbox, or split lines if free text
        const lines =
          ann.type === 'textbox'
            ? wrapTextForPdf(ann.text!, embeddedFont, fontSize, Math.max(20, sw - padding * 2))
            : ann.text!.split('\n')

        // Check if font can encode all characters line-by-line
        let canEncodeAll = true
        for (const line of lines) {
          try {
            embeddedFont.encodeText(line)
          } catch {
            canEncodeAll = false
            break
          }
        }

        // If characters can be encoded by standard font, render directly as vector text
        if (canEncodeAll) {
          // Draw Textbox background
          if (ann.type === 'textbox' && ann.backgroundColor && ann.backgroundColor !== 'transparent') {
            const bg = hexToRgb(ann.backgroundColor)
            const bgRect = visualRectToPdfRect(sx, sy, sw, sh, pageW, pageH, pageRotation)
            copiedPage.drawRectangle({
              x: bgRect.x,
              y: bgRect.y,
              width: bgRect.width,
              height: bgRect.height,
              color: rgb(bg.r, bg.g, bg.b),
              borderWidth: 0,
            })
          }

          // Draw Textbox border
          if (
            ann.type === 'textbox' &&
            ann.strokeWidth &&
            ann.strokeWidth > 0 &&
            ann.strokeColor &&
            ann.strokeColor !== 'transparent'
          ) {
            const st = hexToRgb(ann.strokeColor || '#94a3b8')
            const borderRect = visualRectToPdfRect(sx, sy, sw, sh, pageW, pageH, pageRotation)
            copiedPage.drawRectangle({
              x: borderRect.x,
              y: borderRect.y,
              width: borderRect.width,
              height: borderRect.height,
              borderColor: rgb(st.r, st.g, st.b),
              borderWidth: ann.strokeWidth,
            })
          }

          for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            const line = lines[lineIdx]
            let lineWidth = 0
            try {
              lineWidth = embeddedFont.widthOfTextAtSize(line, fontSize)
            } catch {
              lineWidth = line.length * (fontSize * 0.6)
            }

            let lineVisualX = sx + padding
            if (align === 'center') {
              lineVisualX = sx + padding + Math.max(0, (sw - padding * 2 - lineWidth) / 2)
            } else if (align === 'right') {
              lineVisualX = sx + padding + Math.max(0, sw - padding * 2 - lineWidth)
            }
            const lineVisualY_baseline = sy + padding + lineIdx * lineHeight + fontSize * 0.8

            const tCoords = visualTextToPdfCoords(lineVisualX, lineVisualY_baseline, pageW, pageH, pageRotation)
            copiedPage.drawText(line, {
              x: tCoords.x,
              y: tCoords.y,
              size: fontSize,
              font: embeddedFont,
              color: rgb(textColor.r, textColor.g, textColor.b),
              rotate: degrees(tCoords.rotate),
            })

            // Draw Underline if enabled
            if (ann.isUnderline && line.trim()) {
              const uRect = visualRectToPdfRect(
                lineVisualX,
                lineVisualY_baseline + 1,
                lineWidth,
                Math.max(0.75, fontSize * 0.07),
                pageW,
                pageH,
                pageRotation
              )
              copiedPage.drawRectangle({
                x: uRect.x,
                y: uRect.y,
                width: uRect.width,
                height: uRect.height,
                color: rgb(textColor.r, textColor.g, textColor.b),
                borderWidth: 0,
              })
            }
          }

          handledAnnIds.add(ann.id)
        }
      }

      // 3. Direct Image & Signature embedding (preserving 100% original image quality & crispness)
      const directImageAnns = pageAnns.filter(
        (a) => !handledAnnIds.has(a.id) && (a.type === 'image' || a.type === 'signature') && a.imageUrl
      )

      for (const ann of directImageAnns) {
        try {
          let dataUrl = ann.imageUrl!
          if (
            !dataUrl.startsWith('data:image/png') &&
            !dataUrl.startsWith('data:image/jpeg') &&
            !dataUrl.startsWith('data:image/jpg')
          ) {
            dataUrl = await ensurePngOrJpgDataUrl(dataUrl)
          }

          const isJpg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')
          const embeddedImg = isJpg ? await newDoc.embedJpg(dataUrl) : await newDoc.embedPng(dataUrl)

          const imgW = ann.width * visibleWidth
          const imgH = ann.height * visibleHeight
          const vsx = (ann.x + ann.width / 2) * visibleWidth
          const vsy = (ann.y + ann.height / 2) * visibleHeight

          let pdfCx = 0
          let pdfCy = 0
          if (pageRotation === 0) {
            pdfCx = vsx
            pdfCy = pageH - vsy
          } else if (pageRotation === 90) {
            pdfCx = vsy
            pdfCy = vsx
          } else if (pageRotation === 180) {
            pdfCx = pageW - vsx
            pdfCy = vsy
          } else {
            pdfCx = pageW - vsy
            pdfCy = pageH - vsx
          }

          const userRot = ann.rotation || 0
          const effectiveRot = -userRot - pageRotation
          const rad = (effectiveRot * Math.PI) / 180
          const dx = (-imgW / 2) * Math.cos(rad) + (imgH / 2) * Math.sin(rad)
          const dy = (-imgW / 2) * Math.sin(rad) - (imgH / 2) * Math.cos(rad)

          copiedPage.drawImage(embeddedImg, {
            x: pdfCx + dx,
            y: pdfCy + dy,
            width: imgW,
            height: imgH,
            rotate: degrees(effectiveRot),
          })

          handledAnnIds.add(ann.id)
        } catch (imgErr) {
          console.warn('Direct image embedding failed, fallback to canvas overlay:', imgErr)
        }
      }

      // 4. Render remaining annotations (freehand pen, highlight, shapes, sticky notes, non-Latin text) via high-res canvas
      const markupAnns = pageAnns.filter((a) => !handledAnnIds.has(a.id))
      if (markupAnns.length > 0 && typeof window !== 'undefined' && typeof document !== 'undefined') {
        const remImageAnns = markupAnns.filter((a) => (a.type === 'image' || a.type === 'signature') && a.imageUrl)
        const loadedImages = new Map<string, HTMLImageElement>()
        if (remImageAnns.length > 0) {
          await Promise.all(
            remImageAnns.map((ann) => {
              return new Promise<void>((resolve) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = () => {
                  loadedImages.set(ann.id, img)
                  resolve()
                }
                img.onerror = () => {
                  resolve()
                }
                img.src = ann.imageUrl!
              })
            })
          )
        }

        // High-resolution canvas (3.0x scaleFactor for ~300 DPI high-definition print quality)
        const scaleFactor = 3.0
        const offscreenCanvas = document.createElement('canvas')
        offscreenCanvas.width = Math.floor(visibleWidth * scaleFactor)
        offscreenCanvas.height = Math.floor(visibleHeight * scaleFactor)

        const ctx = offscreenCanvas.getContext('2d')
        if (ctx) {
          ctx.scale(scaleFactor, scaleFactor)
          drawAnnotationsToCanvas(ctx, markupAnns, visibleWidth, visibleHeight, loadedImages)

          const dataUrl = offscreenCanvas.toDataURL('image/png')
          const pngImage = await newDoc.embedPng(dataUrl)

          const originX = copiedPage.getX() || 0
          const originY = copiedPage.getY() || 0

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

  let outputBytes = await newDoc.save()

  // Apply PDF Security (Encryption, Passwords, Permissions) if enabled
  if (securitySettings && securitySettings.enabled) {
    try {
      const userPassword = securitySettings.userPassword || ''
      const ownerPassword = securitySettings.ownerPassword || securitySettings.userPassword || ''
      outputBytes = await encryptPDF(outputBytes, userPassword, {
        ownerPassword: ownerPassword || undefined,
        algorithm: securitySettings.algorithm || 'AES-256',
        allowPrinting: securitySettings.allowPrinting,
        allowHighQualityPrint: securitySettings.allowHighQualityPrint,
        allowCopying: securitySettings.allowCopying,
        allowExtraction: securitySettings.allowCopying,
        allowModifying: securitySettings.allowModifying,
        allowAnnotating: securitySettings.allowAnnotating,
        allowFillingForms: securitySettings.allowFillingForms,
        allowAssembly: securitySettings.allowAssembly,
      })
    } catch (encryptErr) {
      console.error('Failed to encrypt PDF during export:', encryptErr)
      throw new Error(
        `PDF Encryption failed: ${encryptErr instanceof Error ? encryptErr.message : String(encryptErr)}`
      )
    }
  }

  // Trigger browser download if running in browser window and triggerDownload is true
  if (triggerDownload && typeof window !== 'undefined' && typeof document !== 'undefined') {
    const outputBlob = new Blob([outputBytes as unknown as BlobPart], { type: 'application/pdf' })
    const downloadUrl = URL.createObjectURL(outputBlob)

    const downloadLink = document.createElement('a')
    const finalName = sanitizePdfFileName(originalFileName)
    downloadLink.href = downloadUrl
    downloadLink.download = finalName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000)
  }

  return outputBytes
}

/**
 * Exports only the selected page indices as a new PDF document.
 * Automatically remaps annotations for those pages to 0-based indices.
 */
export async function exportSelectedPagesPdf(
  originalBytes: ArrayBuffer,
  allPages: PDFPageItem[],
  allAnnotations: Annotation[],
  selectedPageIndices: number[],
  outputFileName: string,
  sourceDocs?: Record<string, { arrayBuffer: ArrayBuffer }>
): Promise<Uint8Array> {
  const sortedIndices = [...new Set(selectedPageIndices)].sort((a, b) => a - b)
  const subsetPages: PDFPageItem[] = sortedIndices.map((idx) => allPages[idx])

  const subsetAnns: Annotation[] = []
  sortedIndices.forEach((origIdx, newIdx) => {
    const annsForPage = allAnnotations.filter((a) => a.pageIndex === origIdx)
    annsForPage.forEach((ann) => {
      subsetAnns.push({
        ...ann,
        pageIndex: newIdx,
      })
    })
  })

  return await exportEditedPdf(
    originalBytes,
    subsetPages,
    subsetAnns,
    outputFileName,
    sourceDocs,
    true
  )
}

export interface SplitRange {
  fromPage: number // 1-based
  toPage: number // 1-based
  label?: string
}

/**
 * Splits the document into multiple PDF files based on ranges or single pages.
 */
export async function splitPdf(
  originalBytes: ArrayBuffer,
  allPages: PDFPageItem[],
  allAnnotations: Annotation[],
  baseFileName: string,
  ranges: SplitRange[],
  sourceDocs?: Record<string, { arrayBuffer: ArrayBuffer }>
): Promise<void> {
  const baseName = baseFileName.replace(/\.[^/.]+$/, '')

  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i]
    const fromIdx = Math.max(0, range.fromPage - 1)
    const toIdx = Math.min(allPages.length - 1, range.toPage - 1)

    const selectedIndices: number[] = []
    for (let p = fromIdx; p <= toIdx; p++) {
      selectedIndices.push(p)
    }

    if (selectedIndices.length === 0) continue

    const rangeLabel =
      range.label ||
      (fromIdx === toIdx ? `page_${range.fromPage}` : `pages_${range.fromPage}-${range.toPage}`)
    const fileName = `${baseName}_${rangeLabel}.pdf`

    await exportSelectedPagesPdf(
      originalBytes,
      allPages,
      allAnnotations,
      selectedIndices,
      fileName,
      sourceDocs
    )

    // Brief delay so browser handles multiple downloads cleanly
    if (ranges.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
  }
}
