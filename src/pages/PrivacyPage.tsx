import React from 'react'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'

export const PrivacyPage: React.FC = () => {
  usePageSEO({
    title: 'Privacy Policy — SmartTools India',
    description: 'Read the SmartTools India privacy policy. Learn how our browser-based client-side architecture safeguards your data without user registration or central databases.',
    canonicalPath: '/privacy',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Privacy Policy', path: '/privacy' },
    ]),
  })
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Legal &amp; Privacy
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Last updated: September 2026
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-2xs space-y-6 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Browser-First Architecture
          </h2>
          <p>
            At SmartTools India, we believe in privacy by design. Our utilities, calculators, and converters are designed to execute directly within your web browser using client-side JavaScript. This means that numerical inputs, dates, financial figures, and texts you enter into calculators are computed directly on your local device.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. No User Accounts or Personal Registration
          </h2>
          <p>
            We do not require or provide user account registration, sign-up forms, passwords, or login mechanisms. We do not solicit your phone number, Aadhaar number, PAN, credit card details, or other sensitive identifiers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. No Central Calculation Database
          </h2>
          <p>
            We do not store or transmit your calculation records to any centralized database. When you calculate an EMI, GST liability, or word count, the calculations are temporary and disappear when you reload or close your browser tab unless saved locally by your own browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Local Storage
          </h2>
          <p>
            Certain tools may offer local preferences (such as light/dark mode or remembering your last unit selection) utilizing standard browser <code className="text-xs bg-slate-100 dark:bg-slate-800 dark:text-slate-200 px-1 py-0.5 rounded">localStorage</code>. This data never leaves your device.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            5. Realistic Security Scope
          </h2>
          <p>
            While client-side execution prevents server-side interception of inputs by our service, you are responsible for maintaining the security of your own device, browser, and internet connection against third-party extensions, malware, or shared device access.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            6. Inquiries
          </h2>
          <p>
            If you have questions regarding this Privacy Policy, you can reach out via our contact page.
          </p>
        </section>
      </div>
    </div>
  )
}
