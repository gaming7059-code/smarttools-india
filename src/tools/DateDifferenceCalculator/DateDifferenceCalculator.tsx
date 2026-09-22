import React, { useState, useMemo } from 'react'
import { RotateCcw, Plus, Minus } from 'lucide-react'

import { calculateDateDifference, calculateAddSubtractDays } from '../../utils/calculations/dateDifference'
import { formatNumberIN } from '../../utils/currency'

type DateCalcMode = 'difference' | 'addSubtract'

export const DateDifferenceCalculator: React.FC = () => {
  const getTodayStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [mode, setMode] = useState<DateCalcMode>('difference')

  // Mode 1 State
  const [startDate, setStartDate] = useState<string>('2025-01-01')
  const [endDate, setEndDate] = useState<string>(getTodayStr())

  // Mode 2 State
  const [baseDate, setBaseDate] = useState<string>(getTodayStr())
  const [daysCount, setDaysCount] = useState<string>('30')
  const [operation, setOperation] = useState<'add' | 'subtract'>('add')

  // Calculations
  const diffResult = useMemo(() => {
    if (!startDate || !endDate) return null
    return calculateDateDifference(startDate, endDate)
  }, [startDate, endDate])

  const addSubtractResult = useMemo(() => {
    if (!baseDate || !daysCount) return null
    return calculateAddSubtractDays(baseDate, parseFloat(daysCount), operation)
  }, [baseDate, daysCount, operation])

  const handleReset = () => {
    if (mode === 'difference') {
      setStartDate(getTodayStr())
      setEndDate(getTodayStr())
    } else {
      setBaseDate(getTodayStr())
      setDaysCount('30')
      setOperation('add')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setMode('difference')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'difference'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Difference Between Two Dates
        </button>
        <button
          type="button"
          onClick={() => setMode('addSubtract')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'addSubtract'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Add or Subtract Days
        </button>
      </div>

      {/* Mode 1: Date Difference */}
      {mode === 'difference' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="startDateInput" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Start Date
                </label>
                <button
                  type="button"
                  onClick={() => setStartDate(getTodayStr())}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Set Today
                </button>
              </div>
              <input
                id="startDateInput"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* End Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="endDateInput" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  End Date
                </label>
                <button
                  type="button"
                  onClick={() => setEndDate(getTodayStr())}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Set Today
                </button>
              </div>
              <input
                id="endDateInput"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Dates
            </button>
          </div>

          {/* Results Display */}
          {diffResult?.success && diffResult.data ? (
            <div className="space-y-6 pt-2">
              {/* Primary Difference Card */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 border border-blue-100 p-6 sm:p-8 text-center sm:text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Exact Calendar Difference
                  </span>
                  {diffResult.data.isReversed && (
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Reversed (Start is after End)
                    </span>
                  )}
                </div>

                <div className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {diffResult.data.formattedDifference}
                </div>

                <p className="mt-2 text-sm sm:text-base font-bold text-blue-700">
                  {diffResult.data.formattedTotalDays}
                </p>
              </div>

              {/* Total Unit Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formatNumberIN(diffResult.data.totalDays)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Total Days</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formatNumberIN(diffResult.data.totalWeeks)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    Weeks {diffResult.data.remainingDays > 0 ? `+ ${diffResult.data.remainingDays}d` : ''}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formatNumberIN(diffResult.data.totalMonths)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Total Months</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-lg sm:text-2xl font-bold text-slate-900">
                    {formatNumberIN(diffResult.data.totalDays * 24)}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Total Hours</div>
                </div>
              </div>
            </div>
          ) : diffResult?.error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {diffResult.error}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Select start and end dates above to calculate the duration.
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Add or Subtract Days */}
      {mode === 'addSubtract' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Base Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="baseDateInput" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Starting Date
                </label>
                <button
                  type="button"
                  onClick={() => setBaseDate(getTodayStr())}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Set Today
                </button>
              </div>
              <input
                id="baseDateInput"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Operation Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Operation
              </label>
              <div className="grid grid-cols-2 rounded-xl border border-slate-200 p-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setOperation('add')}
                  className={`flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    operation === 'add'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Days
                </button>
                <button
                  type="button"
                  onClick={() => setOperation('subtract')}
                  className={`flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    operation === 'subtract'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Minus className="h-3.5 w-3.5" /> Subtract Days
                </button>
              </div>
            </div>

            {/* Number of Days */}
            <div>
              <label htmlFor="daysCountInput" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Number of Days
              </label>
              <input
                id="daysCountInput"
                type="number"
                min="0"
                step="1"
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Quick Days:</span>
            {['7', '15', '30', '45', '60', '90', '180', '365'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysCount(d)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  daysCount === d
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>

          {/* Control Bar */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>

          {/* Result Card 2 */}
          {addSubtractResult?.success && addSubtractResult.data ? (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 border border-blue-100 p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Calculated Target Date
              </span>
              <div className="mt-1 text-2xl sm:text-4xl font-extrabold text-blue-900 tracking-tight">
                {addSubtractResult.data.formattedDate}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                <span className="font-semibold text-slate-800">Day: {addSubtractResult.data.weekday}</span>
                <span>•</span>
                <span>ISO: {addSubtractResult.data.resultDateISO}</span>
                <span>•</span>
                <span>{operation === 'add' ? `+${daysCount} days` : `-${daysCount} days`}</span>
              </div>
            </div>
          ) : addSubtractResult?.error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              {addSubtractResult.error}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Enter starting date and days count above.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
