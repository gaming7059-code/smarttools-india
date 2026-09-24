import React, { useState, useMemo } from 'react'
import { RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { calculateProfitLoss, calculateTargetSellingPrice } from '../../utils/calculations/profitLoss'
import { formatINR } from '../../utils/currency'

type PLMode = 'calculateResult' | 'calculateTargetPrice'

export const ProfitLossCalculator: React.FC = () => {
  const [mode, setMode] = useState<PLMode>('calculateResult')

  // Mode 1: CP & SP
  const [costPrice1, setCostPrice1] = useState<string>('5000')
  const [sellingPrice1, setSellingPrice1] = useState<string>('6500')

  // Mode 2: CP & Target Profit %
  const [costPrice2, setCostPrice2] = useState<string>('5000')
  const [targetProfitPercent, setTargetProfitPercent] = useState<string>('25')

  const result1 = useMemo(() => {
    if (!costPrice1 || !sellingPrice1) return null
    return calculateProfitLoss(parseFloat(costPrice1), parseFloat(sellingPrice1))
  }, [costPrice1, sellingPrice1])

  const result2 = useMemo(() => {
    if (!costPrice2 || !targetProfitPercent) return null
    return calculateTargetSellingPrice(parseFloat(costPrice2), parseFloat(targetProfitPercent))
  }, [costPrice2, targetProfitPercent])

  const handleReset = () => {
    if (mode === 'calculateResult') {
      setCostPrice1('')
      setSellingPrice1('')
    } else {
      setCostPrice2('')
      setTargetProfitPercent('')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setMode('calculateResult')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'calculateResult'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Calculate Profit or Loss
        </button>
        <button
          type="button"
          onClick={() => setMode('calculateTargetPrice')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'calculateTargetPrice'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Find Selling Price for Target Profit %
        </button>
      </div>

      {/* Mode 1: Cost Price + Selling Price */}
      {mode === 'calculateResult' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost Price */}
            <div>
              <label htmlFor="costPrice1" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cost Price (CP in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                <input
                  id="costPrice1"
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice1}
                  onChange={(e) => setCostPrice1(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
              </div>
            </div>

            {/* Selling Price */}
            <div>
              <label htmlFor="sellingPrice1" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Price (SP in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                <input
                  id="sellingPrice1"
                  type="number"
                  min="0"
                  step="any"
                  value={sellingPrice1}
                  onChange={(e) => setSellingPrice1(e.target.value)}
                  placeholder="e.g. 6500"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
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

          {/* Result Card 1 */}
          {result1?.success && result1.data ? (
            <div className={`rounded-2xl border p-6 sm:p-8 space-y-6 animate-result-in ${
              result1.data.status === 'profit'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                : result1.data.status === 'loss'
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result1.data.status === 'profit' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                      <TrendingUp className="h-3.5 w-3.5" /> NET PROFIT
                    </span>
                  )}
                  {result1.data.status === 'loss' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                      <TrendingDown className="h-3.5 w-3.5" /> NET LOSS
                    </span>
                  )}
                  {result1.data.status === 'breakeven' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-600 px-3 py-1 text-xs font-bold text-white shadow-2xs">
                      <Minus className="h-3.5 w-3.5" /> BREAK-EVEN (NO PROFIT NO LOSS)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Margin / Return</span>
                  <div className={`text-xl sm:text-2xl font-extrabold ${
                    result1.data.status === 'profit'
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : result1.data.status === 'loss'
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {result1.data.status === 'loss' ? '-' : result1.data.status === 'profit' ? '+' : ''}
                    {result1.data.percentage.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Big Result Amount */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {result1.data.status === 'profit' ? 'Total Profit Amount' : result1.data.status === 'loss' ? 'Total Loss Amount' : 'Net Difference'}
                </span>
                <div className={`mt-1 text-3xl sm:text-5xl font-black tracking-tight ${
                  result1.data.status === 'profit'
                    ? 'text-emerald-900 dark:text-emerald-300'
                    : result1.data.status === 'loss'
                    ? 'text-rose-900 dark:text-rose-300'
                    : 'text-slate-900 dark:text-white'
                }`}>
                  {formatINR(result1.data.amount, { showDecimals: true })}
                </div>
              </div>

              {/* Breakdown cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                <div className="rounded-xl bg-white dark:bg-slate-900/80 p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost Price (CP)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {formatINR(result1.data.costPrice, { showDecimals: true })}
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-slate-900/80 p-4 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selling Price (SP)</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {formatINR(result1.data.sellingPrice, { showDecimals: true })}
                  </div>
                </div>
              </div>
            </div>
          ) : result1?.error ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-400">
              {result1.error}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Enter cost price and selling price above to calculate profit or loss.
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Calculate Target Selling Price */}
      {mode === 'calculateTargetPrice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cost Price */}
            <div>
              <label htmlFor="costPrice2" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Cost Price (CP in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                <input
                  id="costPrice2"
                  type="number"
                  min="0"
                  step="any"
                  value={costPrice2}
                  onChange={(e) => setCostPrice2(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
              </div>
            </div>

            {/* Target Profit % */}
            <div>
              <label htmlFor="targetProfitPercent" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Desired Profit Margin (%)
              </label>
              <div className="relative">
                <input
                  id="targetProfitPercent"
                  type="number"
                  step="any"
                  value={targetProfitPercent}
                  onChange={(e) => setTargetProfitPercent(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">%</span>
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

          {/* Result Card 2 */}
          {result2?.success && result2.data ? (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-blue-50/40 dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 sm:p-8 space-y-6 animate-result-in">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Target Selling Price (SP)
                </span>
                <div className="mt-1 text-3xl sm:text-5xl font-black text-emerald-950 dark:text-emerald-200 tracking-tight">
                  {formatINR(result2.data.sellingPrice, { showDecimals: true })}
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Sell at this price to make a {result2.data.desiredProfitPercent}% profit on your {formatINR(result2.data.costPrice, { showDecimals: true })} cost.
                </p>
              </div>

              <div className="rounded-xl bg-white dark:bg-slate-900/80 p-4 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Expected Net Profit
                </span>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  + {formatINR(result2.data.profitAmount, { showDecimals: true })}
                </div>
              </div>
            </div>
          ) : result2?.error ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-400">
              {result2.error}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Enter cost price and desired profit percentage above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
