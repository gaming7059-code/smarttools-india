import React, { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { calculateLoanEMI } from '../../utils/calculations/emi'
import { formatINR } from '../../utils/currency'

export const EMICalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<string>('1000000') // ₹10 Lakhs
  const [interestRate, setInterestRate] = useState<string>('8.5') // 8.5%
  const [tenure, setTenure] = useState<string>('10') // 10 Years
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years')

  const amountPresets = [
    { label: '₹5L', value: '500000' },
    { label: '₹10L', value: '1000000' },
    { label: '₹25L', value: '2500000' },
    { label: '₹50L', value: '5000000' },
    { label: '₹1Cr', value: '10000000' },
  ]

  const emiResult = useMemo(() => {
    if (!loanAmount || !interestRate || !tenure) return null
    return calculateLoanEMI(
      parseFloat(loanAmount),
      parseFloat(interestRate),
      parseFloat(tenure),
      tenureUnit
    )
  }, [loanAmount, interestRate, tenure, tenureUnit])

  const handleReset = () => {
    setLoanAmount('')
    setInterestRate('')
    setTenure('')
    setTenureUnit('years')
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Inputs Section */}
      <div className="space-y-5">
        {/* Loan Amount Input & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="loanAmount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Loan Amount (₹)
            </label>
            <div className="flex gap-1">
              {amountPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setLoanAmount(preset.value)}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    loanAmount === preset.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
            <input
              id="loanAmount"
              type="number"
              min="0"
              step="any"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="e.g. 1000000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>
        </div>

        {/* Rate & Tenure Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Interest Rate */}
          <div>
            <label htmlFor="interestRate" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Annual Interest Rate (%)
            </label>
            <div className="relative">
              <input
                id="interestRate"
                type="number"
                min="0"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">%</span>
            </div>
          </div>

          {/* Tenure & Unit Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="tenure" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Loan Tenure
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setTenureUnit('years')}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-colors ${
                    tenureUnit === 'years'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Years
                </button>
                <button
                  type="button"
                  onClick={() => setTenureUnit('months')}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition-colors ${
                    tenureUnit === 'months'
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Months
                </button>
              </div>
            </div>
            <input
              id="tenure"
              type="number"
              min="1"
              step="any"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
              placeholder={tenureUnit === 'years' ? 'e.g. 10' : 'e.g. 120'}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
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

      {/* Results Section */}
      {emiResult?.success && emiResult.data ? (
        <div className="space-y-6 pt-2 animate-result-in">
          {/* Monthly EMI Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40 p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Monthly Loan EMI
              </span>
              <div className="mt-1 text-3xl sm:text-5xl font-black text-blue-900 dark:text-blue-200 tracking-tight">
                {formatINR(emiResult.data.monthlyEMI)}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Payable monthly for {emiResult.data.totalMonths} installments.
              </p>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Principal Amount
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatINR(emiResult.data.principal)}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {emiResult.data.principalPercentage.toFixed(1)}% of total payment
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Total Interest Payable
              </span>
              <div className="text-lg sm:text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">
                {formatINR(emiResult.data.totalInterest)}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                {emiResult.data.interestPercentage.toFixed(1)}% of total payment
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Payment
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatINR(emiResult.data.totalPayment)}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Principal + Interest</div>
            </div>
          </div>

          {/* Visual Proportion Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              <span>Principal: {emiResult.data.principalPercentage.toFixed(1)}%</span>
              <span>Interest: {emiResult.data.interestPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${emiResult.data.principalPercentage}%` }}
                className="bg-blue-600 h-full transition-all duration-300"
                title={`Principal: ${emiResult.data.principalPercentage.toFixed(1)}%`}
              />
              <div
                style={{ width: `${emiResult.data.interestPercentage}%` }}
                className="bg-amber-500 h-full transition-all duration-300"
                title={`Interest: ${emiResult.data.interestPercentage.toFixed(1)}%`}
              />
            </div>
          </div>
        </div>
      ) : emiResult?.error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-400">
          {emiResult.error}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Enter loan amount, interest rate, and tenure above to view EMI schedule.
        </div>
      )}
    </div>
  )
}
