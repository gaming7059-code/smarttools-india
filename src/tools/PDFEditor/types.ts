export type EditorToolMode =
  | 'select'
  | 'editText'
  | 'text'
  | 'textbox'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'

export interface DetectedTextItem {
  id: string
  str: string
  x: number // normalized [0, 1] relative to visible page width
  y: number // normalized [0, 1] relative to visible page height
  width: number // normalized [0, 1] relative to visible page width
  height: number // normalized [0, 1] relative to visible page height
  fontSize: number // estimated px font size
  fontName?: string
  fontFamily?: string
  color?: string
  backgroundColor?: string
  isBold?: boolean
  isItalic?: boolean
  isMonospace?: boolean
  isSerif?: boolean
  rotation?: number
  transform?: number[]
  pdfX?: number
  pdfY?: number
  pdfWidth?: number
  pdfHeight?: number
}

export interface Point {
  x: number
  y: number
}

export interface Annotation {
  id: string
  pageIndex: number // The index of the page in the current document (0-based)
  type: EditorToolMode
  x: number // Relative percentage or canvas coordinate (0 to 1 relative to page width)
  y: number // Relative percentage or canvas coordinate (0 to 1 relative to page height)
  width: number
  height: number
  text?: string
  fontSize?: number
  color?: string
  backgroundColor?: string
  strokeColor?: string
  strokeWidth?: number
  fillColor?: string
  opacity?: number
  points?: Point[] // For freehand pen and highlighter
  // Vector PDF text replacement metadata
  isPdfTextReplacement?: boolean
  originalText?: string
  pdfX?: number
  pdfY?: number
  pdfWidth?: number
  pdfHeight?: number
  fontName?: string
  fontFamily?: string
  isBold?: boolean
  isItalic?: boolean
  isMonospace?: boolean
  isSerif?: boolean
  autoFit?: boolean
  rotation?: number
}

export interface PDFPageItem {
  id: string // Unique identifier for React keys
  originalIndex: number // 0-based index in the original loaded PDF
  rotation: number // 0, 90, 180, 270 degrees
  width: number
  height: number
}

export interface HistoryState {
  pages: PDFPageItem[]
  annotations: Annotation[]
}
