import React, { useState, useMemo } from 'react'
import { Copy, Check, Trash2, FileText, Clock, Type, AlignLeft } from 'lucide-react'

import { analyzeText } from '../../utils/calculations/wordCounter'
import { formatNumberIN } from '../../utils/currency'

export const WordCounter: React.FC = () => {
  const [text, setText] = useState<string>(
    'SmartTools India provides fast, free, and privacy-friendly online calculators for students, professionals, and everyday internet users.'
  )
  const [copied, setCopied] = useState(false)

  const analytics = useMemo(() => {
    return analyzeText(text)
  }, [text])

  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      setCopied(false)
    }
  }

  const handleClear = () => {
    setText('')
  }

  const handleInsertSample = () => {
    setText(
      'SmartTools India is designed to make everyday calculations seamless and instant. All calculations run directly in your browser without requiring logins, databases, or API keys.\n\nWhether calculating loan EMIs, computing GST, converting units, or counting words in an essay, SmartTools delivers rapid and trustworthy results on mobile and desktop devices alike.'
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Words */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Words</span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-blue-950 tracking-tight">
            {formatNumberIN(analytics.wordCount)}
          </div>
        </div>

        {/* Characters (all) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Characters</span>
            <Type className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {formatNumberIN(analytics.characterCount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {formatNumberIN(analytics.charactersWithoutSpaces)} without spaces
          </div>
        </div>

        {/* Sentences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Sentences</span>
            <AlignLeft className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {formatNumberIN(analytics.sentenceCount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Avg {analytics.averageWordsPerSentence} words/sentence
          </div>
        </div>

        {/* Reading Time */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reading Time</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 tracking-tight">
            {analytics.readingTimeText}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            Estimated reading time
          </div>
        </div>
      </div>

      {/* Main Textarea Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Action Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Paragraphs: <strong>{analytics.paragraphCount}</strong></span>
            <span>•</span>
            <span>Lines: <strong>{analytics.lineCount}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleInsertSample}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              Load Sample
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!text}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                copied
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40'
              }`}
              title="Copy text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!text}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 transition-colors"
              title="Clear text"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Text Input Area */}
        <div className="p-4 sm:p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Type or paste your text here to count words, characters, sentences and reading time..."
            className="w-full resize-y bg-transparent text-sm sm:text-base leading-relaxed text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>Client-side counting • Zero character transmission</span>
          <span>{text.length === 0 ? 'Ready' : `${analytics.wordCount} words recorded`}</span>
        </div>
      </div>
    </div>
  )
}
