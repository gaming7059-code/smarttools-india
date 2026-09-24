import React, { useState } from 'react'
import { Mail, MessageSquare, CheckCircle } from 'lucide-react'
import { usePageSEO, createBreadcrumbSchema } from '../utils/seo'

export const ContactPage: React.FC = () => {
  usePageSEO({
    title: 'Contact Us — SmartTools India',
    description: 'Get in touch with the SmartTools India team. Suggest new calculators, report issues, or provide feedback.',
    canonicalPath: '/contact',
    schema: createBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
  })

  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-fade-in-up">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Get in Touch
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Contact SmartTools India
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Have an idea for a new calculator or utility? Found a bug? Send us a message below.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xs">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              We have noted your message. We continuously review user suggestions to expand our suite of free online utilities.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setName('')
                setEmail('')
                setMessage('')
              }}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Send another note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Message / Tool Suggestion
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what new tool or enhancement you would like to see..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              Send Message
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>General inquiries: contact@smarttools.in</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Feature requests reviewed continuously</span>
        </div>
      </div>
    </div>
  )
}
