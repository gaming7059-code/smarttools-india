import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PDFDocument, degrees } from 'pdf-lib'
import type { PDFPageItem, Annotation } from './types'

// Initialize PDF.js worker
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
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
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bufferForWorker) })
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
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
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
    } else if (ann.type === 'text' || ann.type === 'textbox') {
      const x = ann.x * pageWidth
      const y = ann.y * pageHeight
      const w = Math.max(30, ann.width * pageWidth)
      const h = Math.max(20, ann.height * pageHeight)
      const fontSize = ann.fontSize || 16

      if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
        ctx.fillStyle = ann.backgroundColor
        ctx.fillRect(x, y, w, h)
        if (ann.type === 'textbox') {
          ctx.strokeStyle = ann.strokeColor || '#94a3b8'
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, w, h)
        }
      }

      ctx.fillStyle = ann.color || '#0f172a'
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textBaseline = 'top'

      const text = ann.text || ''
      if (text.trim()) {
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
        drawAnnotationsToCanvas(ctx, pageAnns, visibleWidth, visibleHeight)

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

  const outputBytes = await newDoc.save()

  // Trigger browser download if running in browser window
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const outputBlob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
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
