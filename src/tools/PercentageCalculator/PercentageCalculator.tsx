import React, { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import {
  calculatePercentageOf,
  calculateIsWhatPercentage,
  calculatePercentageChange,
  calculateOriginalValue,
} from '../../utils/calculations/percentage'

type Mode = 'of' | 'isWhat' | 'change' | 'original'

export const PercentageCalculator: React.FC = () => {
  const [mode, setMode] = useState<Mode>('of')

  // Mode A state (What is X% of Y?)
  const [percentA, setPercentA] = useState<string>('20')
  const [totalA, setTotalA] = useState<string>('500')

  // Mode B state (X is what % of Y?)
  const [valueB, setValueB] = useState<string>('100')
  const [totalB, setTotalB] = useState<string>('500')

  // Mode C state (Percentage increase/decrease)
  const [originalC, setOriginalC] = useState<string>('500')
  const [newC, setNewC] = useState<string>('600')

  // Mode D state (Find original value: X% is Y)
  const [percentD, setPercentD] = useState<string>('20')
  const [valueD, setValueD] = useState<string>('100')

  // Calculation Results
  const resultA = useMemo(() => {
    if (!percentA || !totalA) return null
    return calculatePercentageOf(parseFloat(percentA), parseFloat(totalA))
  }, [percentA, totalA])

  const resultB = useMemo(() => {
    if (!valueB || !totalB) return null
    return calculateIsWhatPercentage(parseFloat(valueB), parseFloat(totalB))
  }, [valueB, totalB])

  const resultC = useMemo(() => {
    if (!originalC || !newC) return null
    return calculatePercentageChange(parseFloat(originalC), parseFloat(newC))
  }, [originalC, newC])

  const resultD = useMemo(() => {
    if (!percentD || !valueD) return null
    return calculateOriginalValue(parseFloat(percentD), parseFloat(valueD))
  }, [percentD, valueD])

  const handleReset = () => {
    if (mode === 'of') {
      setPercentA('')
      setTotalA('')
    } else if (mode === 'isWhat') {
      setValueB('')
      setTotalB('')
    } else if (mode === 'change') {
      setOriginalC('')
      setNewC('')
    } else {
      setPercentD('')
      setValueD('')
    }
  }


  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setMode('of')}
          className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'of'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          What is X% of Y?
        </button>
        <button
          type="button"
          onClick={() => setMode('isWhat')}
          className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'isWhat'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          X is what % of Y?
        </button>
        <button
          type="button"
          onClick={() => setMode('change')}
          className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'change'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          % Increase / Decrease
        </button>
        <button
          type="button"
          onClick={() => setMode('original')}
          className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'original'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Find Original Value
        </button>
      </div>

      {/* Mode A: What is X% of Y? */}
      {mode === 'of' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="percentA" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Percentage (%)
              </label>
              <div className="relative">
                <input
                  id="percentA"
                  type="number"
                  step="any"
                  value={percentA}
                  onChange={(e) => setPercentA(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="totalA" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Total Number (Y)
              </label>
              <input
                id="totalA"
                type="number"
                step="any"
                value={totalA}
                onChange={(e) => setTotalA(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
          </div>

          {/* Result Card A */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/60 border border-blue-100 dark:border-blue-900/40 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Calculated Result</span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            {resultA?.success && resultA.data ? (
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-blue-200 tracking-tight">
                  {resultA.data.formatted}
                </div>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400 font-medium">
                  {percentA}% of {totalA} is {resultA.data.formatted}
                </p>
              </div>
            ) : resultA?.error ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{resultA.error}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter numbers above to calculate result in real-time.</p>
            )}
          </div>
        </div>
      )}

      {/* Mode B: X is what % of Y? */}
      {mode === 'isWhat' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="valueB" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Value (X)
              </label>
              <input
                id="valueB"
                type="number"
                step="any"
                value={valueB}
                onChange={(e) => setValueB(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>

            <div>
              <label htmlFor="totalB" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Total (Y)
              </label>
              <input
                id="totalB"
                type="number"
                step="any"
                value={totalB}
                onChange={(e) => setTotalB(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
          </div>

          {/* Result Card B */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/60 border border-blue-100 dark:border-blue-900/40 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Calculated Percentage</span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            {resultB?.success && resultB.data ? (
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-blue-200 tracking-tight">
                  {resultB.data.formatted}
                </div>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400 font-medium">
                  {valueB} is {resultB.data.formatted} of {totalB}
                </p>
              </div>
            ) : resultB?.error ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{resultB.error}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter numbers above to calculate percentage.</p>
            )}
          </div>
        </div>
      )}

      {/* Mode C: Percentage increase / decrease */}
      {mode === 'change' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="originalC" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Original Value
              </label>
              <input
                id="originalC"
                type="number"
                step="any"
                value={originalC}
                onChange={(e) => setOriginalC(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>

            <div>
              <label htmlFor="newC" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                New Value
              </label>
              <input
                id="newC"
                type="number"
                step="any"
                value={newC}
                onChange={(e) => setNewC(e.target.value)}
                placeholder="e.g. 600"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
          </div>

          {/* Result Card C */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/60 border border-blue-100 dark:border-blue-900/40 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Percentage Change</span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            {resultC?.success && resultC.data ? (
              <div>
                <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  resultC.data.type === 'increase'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : resultC.data.type === 'decrease'
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {resultC.data.formatted}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Change Type: {resultC.data.type.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>Absolute Difference: {resultC.data.differenceFormatted}</span>
                </div>
              </div>
            ) : resultC?.error ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{resultC.error}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter original and new values to calculate change.</p>
            )}
          </div>
        </div>
      )}

      {/* Mode D: Find Original Value */}
      {mode === 'original' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="percentD" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Percentage (%)
              </label>
              <div className="relative">
                <input
                  id="percentD"
                  type="number"
                  step="any"
                  value={percentD}
                  onChange={(e) => setPercentD(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">%</span>
              </div>
            </div>

            <div>
              <label htmlFor="valueD" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Given Value / Result (Y)
              </label>
              <input
                id="valueD"
                type="number"
                step="any"
                value={valueD}
                onChange={(e) => setValueD(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
          </div>

          {/* Result Card D */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/60 border border-blue-100 dark:border-blue-900/40 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">Original Total Value</span>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            {resultD?.success && resultD.data ? (
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-900 dark:text-blue-200 tracking-tight">
                  {resultD.data.formatted}
                </div>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400 font-medium">
                  If {percentD}% is {valueD}, the full 100% original value is {resultD.data.formatted}.
                </p>
              </div>
            ) : resultD?.error ? (
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{resultD.error}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Enter percentage and value to find original total.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
