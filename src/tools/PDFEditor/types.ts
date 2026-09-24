export type EditorToolMode =
  | 'select'
  | 'text'
  | 'textbox'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'

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
