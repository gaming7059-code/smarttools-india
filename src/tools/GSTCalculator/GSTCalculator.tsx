import React, { useState, useMemo } from 'react'
import { RotateCcw, Info } from 'lucide-react'
import { calculateAddGST, calculateRemoveGST } from '../../utils/calculations/gst'
import { formatINR } from '../../utils/currency'

type GSTMode = 'add' | 'remove'

export const GSTCalculator: React.FC = () => {
  const [mode, setMode] = useState<GSTMode>('add')
  const [amount, setAmount] = useState<string>('10000')
  const [gstRate, setGstRate] = useState<string>('18')

  const standardRates = ['0', '5', '12', '18', '28']

  const addResult = useMemo(() => {
    if (mode !== 'add' || !amount || !gstRate) return null
    return calculateAddGST(parseFloat(amount), parseFloat(gstRate))
  }, [mode, amount, gstRate])

  const removeResult = useMemo(() => {
    if (mode !== 'remove' || !amount || !gstRate) return null
    return calculateRemoveGST(parseFloat(amount), parseFloat(gstRate))
  }, [mode, amount, gstRate])

  const handleReset = () => {
    setAmount('')
    setGstRate('18')
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setMode('add')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'add'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Add GST (Exclusive Amount)
        </button>
        <button
          type="button"
          onClick={() => setMode('remove')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'remove'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Remove GST (Inclusive Amount)
        </button>
      </div>

      {/* Inputs Form */}
      <div className="space-y-5">
        {/* Amount Input */}
        <div>
          <label htmlFor="gstAmountInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {mode === 'add' ? 'Original / Net Amount (₹)' : 'GST-Inclusive Amount (₹)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
            <input
              id="gstAmountInput"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>
        </div>

        {/* GST Rate Slabs & Custom Input */}
        <div>
          <label htmlFor="customGstRate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            GST Tax Slab Rate (%)
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {standardRates.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setGstRate(rate)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  gstRate === rate
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {rate}% GST
              </button>
            ))}
          </div>

          <div className="relative max-w-xs">
            <input
              id="customGstRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              placeholder="Custom rate %"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">%</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      {/* Mode A Results: Adding GST */}
      {mode === 'add' && addResult?.success && addResult.data && (
        <div className="space-y-6 pt-2">
          {/* Final Gross Amount Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Total Final Amount (With GST)
            </span>
            <div className="mt-1 text-3xl sm:text-5xl font-black text-blue-900 dark:text-blue-200 tracking-tight">
              {formatINR(addResult.data.finalAmount, { showDecimals: true })}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Net Price {formatINR(addResult.data.baseAmount, { showDecimals: true })} + {addResult.data.gstRate}% GST ({formatINR(addResult.data.gstAmount, { showDecimals: true })})
            </p>
          </div>

          {/* Tax Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total GST Amount
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatINR(addResult.data.gstAmount, { showDecimals: true })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                CGST ({(addResult.data.gstRate / 2).toFixed(2)}%)
              </span>
              <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {formatINR(addResult.data.cgst, { showDecimals: true })}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Central GST</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                SGST ({(addResult.data.gstRate / 2).toFixed(2)}%)
              </span>
              <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {formatINR(addResult.data.sgst, { showDecimals: true })}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">State GST / UTGST</div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              CGST and SGST equal 50/50 splits apply to standard intra-state sales within the same Indian state or union territory. For inter-state supply, full {addResult.data.gstRate}% is levied as Integrated GST (IGST: {formatINR(addResult.data.gstAmount, { showDecimals: true })}).
            </p>
          </div>
        </div>
      )}

      {/* Mode B Results: Removing GST */}
      {mode === 'remove' && removeResult?.success && removeResult.data && (
        <div className="space-y-6 pt-2">
          {/* Base Net Amount Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Original Base Amount (Excluding GST)
            </span>
            <div className="mt-1 text-3xl sm:text-5xl font-black text-blue-900 dark:text-blue-200 tracking-tight">
              {formatINR(removeResult.data.baseAmount, { showDecimals: true })}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Extracted from {formatINR(removeResult.data.inclusiveAmount, { showDecimals: true })} at {removeResult.data.gstRate}% tax rate.
            </p>
          </div>

          {/* Tax Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Embedded GST Amount
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatINR(removeResult.data.gstAmount, { showDecimals: true })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                CGST ({(removeResult.data.gstRate / 2).toFixed(2)}%)
              </span>
              <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {formatINR(removeResult.data.cgst, { showDecimals: true })}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Central GST portion</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                SGST ({(removeResult.data.gstRate / 2).toFixed(2)}%)
              </span>
              <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {formatINR(removeResult.data.sgst, { showDecimals: true })}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">State GST portion</div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              Calculated using the reverse tax formula: Base = Total / (1 + Rate / 100). Equal CGST/SGST split assumes intra-state transactions.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {((mode === 'add' && addResult?.error) || (mode === 'remove' && removeResult?.error)) && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-400">
          {mode === 'add' ? addResult?.error : removeResult?.error}
        </div>
      )}
    </div>
  )
}
