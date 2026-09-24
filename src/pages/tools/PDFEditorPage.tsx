import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { PDFEditor } from '../../tools/PDFEditor/PDFEditor'
import { ALL_TOOLS } from '../../data/toolsData'

export const PDFEditorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'pdf-editor')!

  const howToUseSteps = [
    'Upload your PDF document by dragging and dropping it into the workspace or clicking "Browse PDF File". You can also click "Try with Sample PDF" for instant testing.',
    'Select an annotation tool from the top toolbar: Text, Freehand Pen, Highlighter, Rectangle, Circle, Line, or Arrow.',
    'Customize your styling: pick colors from the preset palette, adjust font sizes for text, or change stroke thickness for pen and shapes.',
    'Click, drag, or type directly onto the active page. Switch between pages or reorder, rotate, duplicate, and delete pages using the left sidebar.',
    'Click the "Download PDF" button to export your edited document instantly with all page modifications and annotations preserved.',
  ]

  const formulas = [
    {
      title: 'Client-Side Canvas Vector Blending',
      formula: 'Render(PDF, DPR = 2.0) + Canvas(Overlay) → Lossless PNG Embed',
      explanation:
        'High-DPI rendering ensures that custom annotations, handwritten notes, highlighters, and vector shapes retain crisp fidelity when exported.',
    },
    {
      title: 'Page Transformation Matrix',
      formula: 'Rotation Angle = (Initial + 90° × N) mod 360°',
      explanation:
        'Page rotation attributes are updated directly within the PDF document dictionary without degrading or recompressing embedded graphics.',
    },
    {
      title: 'Zero-Knowledge Security Architecture',
      formula: 'Network Requests = 0 (Offline Client-Only Execution)',
      explanation:
        'Files never leave your local device memory or browser sandbox, ensuring absolute privacy for sensitive contracts, invoices, and personal documents.',
    },
  ]

  const examples = [
    {
      title: 'Marking Up Contracts & Invoices',
      description: 'Highlighting payment terms, adding reviewer notes, and circling billing discrepancies.',
      input: 'GST_Invoice_Sample.pdf',
      output: 'Annotated invoice with highlighted GSTIN and approval note',
    },
    {
      title: 'Organizing Multi-Page Scanned Documents',
      description: 'Rotating sideways scans upright, deleting blank back pages, and arranging page sequence.',
      input: 'Scanned_Documents_Batch.pdf (6 pages)',
      output: 'Cleaned 4-page PDF with uniform portrait orientation',
    },
    {
      title: 'Academic & Homework Feedback',
      description: 'Using the pen and text tools to grade assignments and provide directional arrows on diagrams.',
      input: 'Physics_Assignment_Draft.pdf',
      output: 'Graded student assignment with corrections and remarks',
    },
  ]

  const faqs = [
    {
      question: 'Are my uploaded PDF files saved on your servers?',
      answer:
        'No. SmartTools India processes all PDF operations 100% locally in your browser using JavaScript and HTML5 Canvas. Your files are never sent across the internet, stored in any database, or shared with third parties.',
    },
    {
      question: 'Is this PDF Editor completely free to use?',
      answer:
        'Yes, it is completely free with no hidden charges, no mandatory signup or registration, no file size penalties, and no watermarks added to your downloaded documents.',
    },
    {
      question: 'Can I add text and digital signatures to my PDF?',
      answer:
        'Yes! You can use the Text tool to type anywhere on the document, or use the freehand Pen tool to draw a digital signature or handwritten annotation.',
    },
    {
      question: 'Can I reorder, rotate, or delete pages in my PDF?',
      answer:
        'Yes. The thumbnail panel on the left provides one-click controls to rotate any page by 90°, duplicate pages, move pages up and down, or delete unwanted pages.',
    },
    {
      question: 'Do I need to install any software or browser extensions?',
      answer:
        'No software installation is required. SmartTools India PDF Editor works directly in all modern desktop, tablet, and mobile browsers (Chrome, Firefox, Safari, Edge).',
    },
  ]

  const relatedSlugs = ['word-counter', 'percentage-calculator', 'gst-calculator', 'date-difference-calculator']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free Online PDF Editor | Edit, Annotate & Organize PDF in Browser"
      seoDescription="Edit and annotate PDF files directly in your web browser with 100% client-side privacy. Add text, freehand draw, highlight, draw shapes, rotate pages, and download without signup."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <PDFEditor />
    </ToolPageLayout>
  )
}
