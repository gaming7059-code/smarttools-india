import React, { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { ChevronRight, HelpCircle, BookOpen, Calculator, Sparkles, ChevronDown } from 'lucide-react'
import { ALL_TOOLS } from '../../data/toolsData'
import { ToolCard } from '../common/ToolCard'
import {
  usePageSEO,
  createWebApplicationSchema,
  createBreadcrumbSchema,
  createFAQSchema,
} from '../../utils/seo'
import type { LayoutContextType } from '../../layouts/MainLayout'
import type { Tool } from '../../types/tools'

export interface FAQItem {
  question: string
  answer: string
}

export interface FormulaItem {
  title: string
  formula: string
  explanation: string
}

export interface ExampleItem {
  title: string
  description: string
  input: string
  output: string
}

export interface ToolPageLayoutProps {
  tool: Tool
  seoTitle: string
  seoDescription: string
  howToUseSteps: string[]
  formulas: FormulaItem[]
  examples: ExampleItem[]
  faqs: FAQItem[]
  relatedSlugs: string[]
  children: React.ReactNode
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  tool,
  seoTitle,
  seoDescription,
  howToUseSteps,
  formulas,
  examples,
  faqs,
  relatedSlugs,
  children,
}) => {
  // Build structured data schemas
  const schemas: Array<Record<string, unknown>> = [
    createWebApplicationSchema(tool.name, seoDescription || tool.description, tool.path),
    createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: tool.categoryName, path: `/tools?category=${tool.categoryId}` },
      { name: tool.name, path: tool.path },
    ]),
  ]

  const faqSchema = createFAQSchema(faqs)
  if (faqSchema) {
    schemas.push(faqSchema)
  }

  usePageSEO({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: tool.path,
    schema: schemas,
  })

  const { openToolPreview } = useOutletContext<LayoutContextType>()
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Find related tools from slugs
  const relatedTools = ALL_TOOLS.filter((t) => relatedSlugs.includes(t.slug))

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link to="/tools" className="hover:text-blue-600 transition-colors">
          Tools
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link
          to={`/tools?category=${tool.categoryId}`}
          className="hover:text-blue-600 transition-colors"
        >
          {tool.categoryName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-900 font-medium truncate" aria-current="page">
          {tool.name}
        </span>
      </nav>

      {/* 2. Page Header */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{tool.categoryName} Utility</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {tool.name}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          {tool.description}
        </p>
      </header>

      {/* 3. Main Calculator Area (Calculator + Result Cards) */}
      <section aria-label="Calculator Workspace">
        {children}
      </section>

      {/* 4. How to Use */}
      {howToUseSteps.length > 0 && (
        <section aria-labelledby="how-to-use-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 id="how-to-use-heading">How to Use the {tool.name}</h2>
          </div>
          <ol className="list-decimal list-inside space-y-2.5 text-sm text-slate-600">
            {howToUseSteps.map((step, index) => (
              <li key={index} className="leading-relaxed pl-1">
                <span className="text-slate-800 font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 5. Formula & Explanation */}
      {formulas.length > 0 && (
        <section aria-labelledby="formula-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h2 id="formula-heading">Formulas &amp; Calculation Method</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formulas.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <div className="rounded-lg bg-white p-3 border border-slate-200 font-mono text-xs sm:text-sm text-blue-700 select-all overflow-x-auto">
                  {item.formula}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Worked Examples */}
      {examples.length > 0 && (
        <section aria-labelledby="examples-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <h2 id="examples-heading" className="text-lg font-bold text-slate-900">
            Practical Examples
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {examples.map((ex, idx) => (
              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">{ex.title}</h3>
                <p className="text-xs text-slate-600">{ex.description}</p>
                <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-xs">
                  <div className="text-slate-500">
                    <span className="font-semibold text-slate-700">Input:</span> {ex.input}
                  </div>
                  <div className="text-blue-700 font-medium">
                    <span className="font-semibold text-slate-700">Result:</span> {ex.output}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. FAQ Section */}
      {faqs.length > 0 && (
        <section aria-labelledby="faq-heading" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h2 id="faq-heading">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div key={idx} className="py-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-4">
                      {faq.answer}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 8. Related Tools */}
      {relatedTools.length > 0 && (
        <section aria-labelledby="related-heading" className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 id="related-heading" className="text-xl font-bold tracking-tight text-slate-900">
                Related Tools &amp; Calculators
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore complementary calculation and conversion helpers for everyday tasks.
              </p>
            </div>
            <Link
              to="/tools"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
            >
              Browse all 10 tools →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedTools.map((relTool) => (
              <ToolCard
                key={relTool.id}
                tool={relTool}
                onOpenPreview={openToolPreview}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
