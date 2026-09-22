import React, { useState, useMemo } from 'react'
import { RotateCcw, PartyPopper, AlertCircle } from 'lucide-react'

import { calculateAge } from '../../utils/calculations/age'
import { formatNumberIN } from '../../utils/currency'

export const AgeCalculator: React.FC = () => {
  // Helper to get today's date in YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [dob, setDob] = useState<string>('2000-01-01')
  const [targetDate, setTargetDate] = useState<string>(getTodayStr())

  const ageResult = useMemo(() => {
    return calculateAge(dob, targetDate)
  }, [dob, targetDate])

  const handleReset = () => {
    setDob('')
    setTargetDate(getTodayStr())
  }

  const handleSetToday = () => {
    setTargetDate(getTodayStr())
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Inputs Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Date of Birth Input */}
        <div>
          <label htmlFor="dob" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={targetDate || getTodayStr()}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Select your birth date from the picker.</p>
        </div>

        {/* Age on Date Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="targetDate" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Age on Date (Optional)
            </label>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Set Today
            </button>
          </div>
          <input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-400">Defaults to today’s date.</p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Dates</span>
        </button>
      </div>

      {/* Results Section */}
      {ageResult.success && ageResult.data ? (
        <div className="space-y-6 pt-2">
          {/* Primary Age Display */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-blue-50/40 border border-blue-100 p-6 sm:p-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Your Exact Age
            </span>
            <div className="mt-2 flex flex-wrap items-baseline justify-center gap-2 sm:gap-4 text-slate-900">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-5xl font-black text-blue-700 tracking-tight">
                  {ageResult.data.years}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-600">
                  {ageResult.data.years === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-5xl font-black text-blue-700 tracking-tight">
                  {ageResult.data.months}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-600">
                  {ageResult.data.months === 1 ? 'Month' : 'Months'}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-5xl font-black text-blue-700 tracking-tight">
                  {ageResult.data.days}
                </span>
                <span className="text-sm sm:text-base font-semibold text-slate-600">
                  {ageResult.data.days === 1 ? 'Day' : 'Days'}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Calculated accurately considering leap years and variable calendar months.
            </p>
          </div>

          {/* Granular Total Units Breakdown */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Total Lifetime Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                  {formatNumberIN(ageResult.data.totalMonths)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Total Months</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                  {formatNumberIN(ageResult.data.totalWeeks)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  Total Weeks {ageResult.data.remainingDaysInWeek > 0 ? `+ ${ageResult.data.remainingDaysInWeek}d` : ''}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                  {formatNumberIN(ageResult.data.totalDays)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Total Days</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-slate-900">
                  {formatNumberIN(ageResult.data.totalHours)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">Total Hours</div>
              </div>
            </div>
          </div>

          {/* Upcoming Birthday Highlight */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <PartyPopper className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Next Birthday
                </h4>
                <p className="text-xs text-slate-600">
                  {ageResult.data.nextBirthday.dateString} ({ageResult.data.nextBirthday.weekday})
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-base sm:text-lg font-bold text-amber-700">
                {ageResult.data.nextBirthday.daysUntil === 0
                  ? 'Today! 🎉'
                  : `${ageResult.data.nextBirthday.daysUntil} days left`}
              </div>
            </div>
          </div>
        </div>
      ) : ageResult.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center gap-3 text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <p className="text-sm font-medium">{ageResult.error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
          Please enter your date of birth above to calculate your age.
        </div>
      )}
    </div>
  )
}
