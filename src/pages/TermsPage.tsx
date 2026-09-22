import React from 'react'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'

export const TermsPage: React.FC = () => {
  usePageSEO({
    title: 'Terms of Service — SmartTools India',
    description: 'Read the SmartTools India terms of service. Understand the terms, disclaimer of warranties, and educational purpose of our free online calculation utilities.',
    canonicalPath: '/terms',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Terms of Service', path: '/terms' },
    ]),
  })
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Legal Agreement
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 2026
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-2xs space-y-6 text-slate-600 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and utilizing SmartTools India (&ldquo;the Website&rdquo;), you agree to be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue use of the tools.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            2. Nature of the Service
          </h2>
          <p>
            SmartTools India provides free, browser-based calculation, conversion, and digital utilities. The service is provided &ldquo;as is&rdquo; without warranties of any kind.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            3. Informational and Educational Purpose Only
          </h2>
          <p>
            All financial calculators (such as EMI, GST, Salary, and Profit &amp; Loss calculators) provide approximations based on mathematical formulas and user inputs. They do not constitute official financial advice, certified accounting reports, or legal counsel. For formal loan approvals, statutory tax filings, or audited balance sheets, consult certified financial planners or chartered accountants.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            4. No Fees or Subscriptions
          </h2>
          <p>
            Access to our standard utilities is completely free of charge. No subscriptions, recurring billing, or payments are processed.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">
            5. Modifications
          </h2>
          <p>
            We reserve the right to revise or improve any calculator, tool, or document on this website at any time without prior notice.
          </p>
        </section>
      </div>
    </div>
  )
}
