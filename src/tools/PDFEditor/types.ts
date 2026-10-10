export type EditorToolMode =
  | 'select'
  | 'editText'
  | 'text'
  | 'textbox'
  | 'draw'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'stickyNote'
  | 'image'
  | 'signature'

export interface SavedSignature {
  id: string
  dataUrl: string
  title?: string
  createdAt: number
  aspectRatio: number // natural width / height
}

export interface ImageCropData {
  x: number // normalized [0, 1] relative to original image width
  y: number // normalized [0, 1] relative to original image height
  width: number // normalized [0, 1] relative to original image width
  height: number // normalized [0, 1] relative to original image height
}

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
  isUnderline?: boolean
  isMonospace?: boolean
  isSerif?: boolean
  textAlign?: 'left' | 'center' | 'right'
  lineSpacing?: number
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
  isOpen?: boolean // For sticky notes expand/collapse
  author?: string // For sticky notes
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
  isUnderline?: boolean
  isMonospace?: boolean
  isSerif?: boolean
  textAlign?: 'left' | 'center' | 'right'
  lineSpacing?: number
  autoFit?: boolean
  rotation?: number
  // Image & Signature properties
  imageUrl?: string
  originalImageUrl?: string
  cropData?: ImageCropData
  isSignature?: boolean
  signatureType?: 'draw' | 'type' | 'upload'
}

export interface PDFPageItem {
  id: string // Unique identifier for React keys
  originalIndex: number // 0-based index in the original loaded PDF (-1 if blank)
  rotation: number // 0, 90, 180, 270 degrees
  width: number
  height: number
  isBlank?: boolean
  sourceDocId?: string // 'primary' or custom ID for inserted/merged PDFs
}

export interface SourcePdfDocument {
  id: string
  name: string
  pdfDoc: any // pdfjsLib.PDFDocumentProxy
  arrayBuffer: ArrayBuffer
}

export interface HistoryState {
  pages: PDFPageItem[]
  annotations: Annotation[]
}

export interface PdfSecuritySettings {
  enabled: boolean
  userPassword?: string // Document open password
  ownerPassword?: string // Master permissions password
  algorithm: 'AES-256' | 'RC4'
  allowPrinting: boolean // Printing permission
  allowHighQualityPrint: boolean // High-res printing
  allowCopying: boolean // Copying / content extraction permission
  allowModifying: boolean // Document modification permission
  allowAnnotating: boolean // Commenting & annotation permission
  allowFillingForms: boolean // Form filling permission
  allowAssembly: boolean // Page assembly permission
}
