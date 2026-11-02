import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { JpgToPdf } from '../../tools/JpgToPdf/JpgToPdf'
import { ALL_TOOLS } from '../../data/toolsData'
import type { Tool } from '../../types/tools'

export const JpgToPdfPage: React.FC = () => {
  const tool: Tool = ALL_TOOLS.find((t) => t.slug === 'jpg-to-pdf') || {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF Converter',
    slug: 'jpg-to-pdf',
    path: '/tools/jpg-to-pdf',
    description: 'Convert multiple JPG, JPEG, and PNG images into a clean, professional PDF document with custom page sizes, orientations, and margins.',
    categoryId: 'pdf-tools',
    categoryIds: ['pdf-tools', 'creator-tools', 'education'],
    categoryName: 'PDF Tools',
    icon: 'FileImage',
    isPopular: true,
    isFunctional: true,
    keywords: ['jpg to pdf', 'images to pdf', 'convert jpg to pdf', 'png to pdf', 'jpeg to pdf', 'combine photos into pdf', 'pdf converter online'],
  }

  const howToUseSteps = [
    'Drag and drop your JPG, JPEG, PNG, or WebP images into the upload area or click "Select Images".',
    'Preview your uploaded thumbnails and verify their original pixel dimensions and file sizes.',
    'Rearrange image order using drag-and-drop or by clicking the Left/Right arrow buttons on each card.',
    'Choose your preferred PDF page size (A4 standard, A3 poster, US Letter, or exact Original image dimensions).',
    'Select page orientation (Auto detection, Portrait, or Landscape) and choose margin padding (None, Small, Medium, Large).',
    'Click "Convert to PDF" to compile your images into an optimized PDF document.',
    'Click "Download PDF" to save the finished document immediately to your device.',
  ]

  const formulas = [
    {
      title: 'Proportional Aspect Ratio Scaling',
      formula: 'Scale = min(PrintableWidth / ImageWidth, PrintableHeight / ImageHeight)',
      explanation:
        'Prevents any unwanted stretching, squishing, or distortion of your photos while maximizing printable coverage on the chosen page format.',
    },
    {
      title: 'Centering Offset Coordinate Math',
      formula: 'X_offset = Margin + (PrintableWidth - RenderedWidth) / 2, Y_offset = Margin + (PrintableHeight - RenderedHeight) / 2',
      explanation:
        'Calculates exact postscript point coordinates to mathematically center the photograph within printable margins.',
    },
    {
      title: 'ISO 216 Standard Page Sizing in Points',
      formula: 'A4 = 595.28 × 841.89 pt, A3 = 841.89 × 1190.55 pt, Letter = 612 × 792 pt (72 points = 1 inch)',
      explanation:
        'Converts physical paper millimeter specifications into native PDF vector points for crisp, high-resolution printing.',
    },
  ]

  const examples = [
    {
      title: 'Official Document Scanning & Submission',
      description: 'Combine three smartphone photos of Aadhaar card, PAN card, and passport photo into a single A4 PDF.',
      input: '3 JPEG images (front.jpg, back.jpg, photo.png)',
      output: 'A single 3-page professional PDF with uniform A4 pages and clean margins.',
    },
    {
      title: 'Full-Bleed Photo Album or Portfolio',
      description: 'Convert photography shots into a borderless PDF portfolio.',
      input: '5 high-resolution photography files with "Fit Image" and "None" margin',
      output: 'High-definition borderless PDF matching original photo dimensions with zero quality loss.',
    },
  ]

  const faqs = [
    {
      question: 'Are my private photos uploaded to any external server?',
      answer:
        'No. SmartTools India processes everything locally inside your web browser using client-side JavaScript and pdf-lib. Your photographs never leave your phone or computer, guaranteeing 100% confidentiality.',
    },
    {
      question: 'Can I change the order of pages before downloading?',
      answer:
        'Yes! You can reorder pages by dragging and dropping the cards or clicking the Left (←) and Right (→) arrow buttons on any image thumbnail.',
    },
    {
      question: 'Which image formats are supported?',
      answer:
        'The converter supports JPG, JPEG, PNG, and WebP image files. You can mix and match different formats in the same PDF document.',
    },
    {
      question: 'Will my images lose quality during conversion?',
      answer:
        'No. JPEG images are embedded directly into the PDF stream without re-compression, preserving the original sharpness, color fidelity, and metadata of your files.',
    },
  ]

  const relatedSlugs = ['pdf-editor', 'image-quality-increaser', 'word-counter', 'unit-converter']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free JPG to PDF Converter — Convert Images to PDF Online | SmartTools India"
      seoDescription="Convert multiple JPG, JPEG, and PNG images into a single professional PDF document. 100% free, private in your browser, custom page sizes, orientations, and margins."
      keywords="jpg to pdf, convert jpg to pdf, free image to pdf converter, combine photos to pdf, png to pdf, jpeg to pdf online, smarttools india"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <JpgToPdf />
    </ToolPageLayout>
  )
}
