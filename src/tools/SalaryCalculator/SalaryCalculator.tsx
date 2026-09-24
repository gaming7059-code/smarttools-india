import React, { useState, useMemo } from 'react'
import { RotateCcw, AlertTriangle } from 'lucide-react'

import { calculateSalaryBreakdown } from '../../utils/calculations/salary'
import { formatINR } from '../../utils/currency'

export const SalaryCalculator: React.FC = () => {
  const [annualCTC, setAnnualCTC] = useState<string>('600000') // ₹6 Lakhs
  const [basicPercent, setBasicPercent] = useState<string>('50') // 50%
  const [hraPercent, setHraPercent] = useState<string>('50') // 50% of Basic
  const [otherAllowances, setOtherAllowances] = useState<string>('5000') // ₹5,000 / month
  const [employeePFPercent, setEmployeePFPercent] = useState<string>('12') // 12%
  const [professionalTax, setProfessionalTax] = useState<string>('200') // ₹200 / month

  const ctcPresets = [
    { label: '₹3 LPA', value: '300000' },
    { label: '₹6 LPA', value: '600000' },
    { label: '₹10 LPA', value: '1000000' },
    { label: '₹15 LPA', value: '1500000' },
    { label: '₹25 LPA', value: '2500000' },
  ]

  const salaryResult = useMemo(() => {
    if (!annualCTC) return null
    return calculateSalaryBreakdown({
      annualCTC: parseFloat(annualCTC) || 0,
      basicPercent: parseFloat(basicPercent) || 0,
      hraPercent: parseFloat(hraPercent) || 0,
      monthlyOtherAllowances: parseFloat(otherAllowances) || 0,
      employeePFPercent: parseFloat(employeePFPercent) || 0,
      monthlyProfessionalTax: parseFloat(professionalTax) || 0,
    })
  }, [annualCTC, basicPercent, hraPercent, otherAllowances, employeePFPercent, professionalTax])

  const handleReset = () => {
    setAnnualCTC('')
    setBasicPercent('50')
    setHraPercent('50')
    setOtherAllowances('0')
    setEmployeePFPercent('12')
    setProfessionalTax('200')
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Inputs Section */}
      <div className="space-y-5">
        {/* Annual CTC Input & Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="annualCTC" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Annual CTC Package (Cost to Company in ₹)
            </label>
            <div className="flex gap-1 flex-wrap">
              {ctcPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAnnualCTC(preset.value)}
                  className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                    annualCTC === preset.value
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
              id="annualCTC"
              type="number"
              min="0"
              step="any"
              value={annualCTC}
              onChange={(e) => setAnnualCTC(e.target.value)}
              placeholder="e.g. 600000"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
            />
          </div>
        </div>

        {/* Breakdown Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {/* Basic % */}
          <div>
            <label htmlFor="basicPercent" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Basic Salary (% of CTC)
            </label>
            <div className="relative">
              <input
                id="basicPercent"
                type="number"
                min="0"
                max="100"
                step="any"
                value={basicPercent}
                onChange={(e) => setBasicPercent(e.target.value)}
                placeholder="50"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">%</span>
            </div>
          </div>

          {/* HRA % */}
          <div>
            <label htmlFor="hraPercent" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              HRA (% of Basic)
            </label>
            <div className="relative">
              <input
                id="hraPercent"
                type="number"
                min="0"
                max="100"
                step="any"
                value={hraPercent}
                onChange={(e) => setHraPercent(e.target.value)}
                placeholder="50"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">%</span>
            </div>
          </div>

          {/* Other Allowances */}
          <div>
            <label htmlFor="otherAllowances" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Other Monthly Allowances (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">₹</span>
              <input
                id="otherAllowances"
                type="number"
                min="0"
                step="any"
                value={otherAllowances}
                onChange={(e) => setOtherAllowances(e.target.value)}
                placeholder="5000"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-7 pr-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
          </div>

          {/* Employee PF % */}
          <div>
            <label htmlFor="employeePFPercent" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Employee PF (% of Basic)
            </label>
            <div className="relative">
              <input
                id="employeePFPercent"
                type="number"
                min="0"
                max="100"
                step="any"
                value={employeePFPercent}
                onChange={(e) => setEmployeePFPercent(e.target.value)}
                placeholder="12"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">%</span>
            </div>
          </div>

          {/* Professional Tax */}
          <div>
            <label htmlFor="professionalTax" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Professional Tax (₹ / month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-xs">₹</span>
              <input
                id="professionalTax"
                type="number"
                min="0"
                step="any"
                value={professionalTax}
                onChange={(e) => setProfessionalTax(e.target.value)}
                placeholder="200"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-7 pr-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40"
              />
            </div>
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
      {salaryResult?.success && salaryResult.data ? (
        <div className="space-y-6 pt-2">
          {/* Take-Home Pay Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-blue-50/40 dark:from-emerald-950/25 dark:via-slate-900/40 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-900/40 p-6 sm:p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
              Estimated Monthly In-Hand / Take-Home Pay
            </span>
            <div className="mt-1 text-3xl sm:text-5xl font-black text-emerald-950 dark:text-emerald-200 tracking-tight">
              {formatINR(salaryResult.data.estimatedMonthlyTakeHome, { showDecimals: true })}
            </div>
            <div className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>Estimated Annual Take-Home: <strong>{formatINR(salaryResult.data.estimatedAnnualTakeHome, { showDecimals: true })}</strong></span>
              <span>•</span>
              <span>Monthly Gross: {formatINR(salaryResult.data.monthlyGrossSalary, { showDecimals: true })}</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Salary Component</th>
                  <th className="px-4 py-3 text-right">Monthly (₹)</th>
                  <th className="px-4 py-3 text-right">Annual (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {/* Earnings */}
                <tr className="bg-slate-50/40 dark:bg-slate-800/40 font-semibold text-slate-900 dark:text-white">
                  <td colSpan={3} className="px-4 py-2 text-xs text-blue-700 dark:text-blue-400">Gross Earnings</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 pl-6 text-slate-700 dark:text-slate-300">Basic Salary</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.monthlyBasic, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.annualBasic, { showDecimals: true })}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 pl-6 text-slate-700 dark:text-slate-300">House Rent Allowance (HRA)</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.monthlyHRA, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.annualHRA, { showDecimals: true })}</td>
                </tr>
                {salaryResult.data.monthlyOtherAllowances > 0 && (
                  <tr>
                    <td className="px-4 py-2.5 pl-6 text-slate-700 dark:text-slate-300">Other Allowances</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.monthlyOtherAllowances, { showDecimals: true })}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatINR(salaryResult.data.annualOtherAllowances, { showDecimals: true })}</td>
                  </tr>
                )}
                <tr className="bg-blue-50/50 dark:bg-blue-950/30 font-semibold text-blue-950 dark:text-blue-200">
                  <td className="px-4 py-2.5">Total Gross Salary</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(salaryResult.data.monthlyGrossSalary, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(salaryResult.data.annualGrossSalary, { showDecimals: true })}</td>
                </tr>

                {/* Deductions */}
                <tr className="bg-slate-50/40 dark:bg-slate-800/40 font-semibold text-slate-900 dark:text-white">
                  <td colSpan={3} className="px-4 py-2 text-xs text-rose-700 dark:text-rose-400">Standard Deductions</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 pl-6 text-slate-700 dark:text-slate-300">Employee Provident Fund (EPF)</td>
                  <td className="px-4 py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">- {formatINR(salaryResult.data.monthlyEmployeePF, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">- {formatINR(salaryResult.data.annualEmployeePF, { showDecimals: true })}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 pl-6 text-slate-700 dark:text-slate-300">Professional Tax (PT)</td>
                  <td className="px-4 py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">- {formatINR(salaryResult.data.monthlyProfessionalTax, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-rose-600 dark:text-rose-400">- {formatINR(salaryResult.data.annualProfessionalTax, { showDecimals: true })}</td>
                </tr>
                <tr className="bg-rose-50/50 dark:bg-rose-950/30 font-semibold text-rose-950 dark:text-rose-300">
                  <td className="px-4 py-2.5">Total Deductions</td>
                  <td className="px-4 py-2.5 text-right">- {formatINR(salaryResult.data.monthlyTotalDeductions, { showDecimals: true })}</td>
                  <td className="px-4 py-2.5 text-right">- {formatINR(salaryResult.data.annualTotalDeductions, { showDecimals: true })}</td>
                </tr>

                {/* Net Take-Home */}
                <tr className="bg-emerald-100/60 dark:bg-emerald-950/50 font-bold text-emerald-950 dark:text-emerald-200 text-sm sm:text-base">
                  <td className="px-4 py-3">Estimated Net Take-Home Pay</td>
                  <td className="px-4 py-3 text-right">{formatINR(salaryResult.data.estimatedMonthlyTakeHome, { showDecimals: true })}</td>
                  <td className="px-4 py-3 text-right">{formatINR(salaryResult.data.estimatedAnnualTakeHome, { showDecimals: true })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mandatory Disclaimer Note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> Take-home salary is an estimate based on the values entered. Actual salary may vary based on employer deductions, taxes, benefits, and payroll rules.
            </p>
          </div>
        </div>
      ) : salaryResult?.error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-700 dark:text-rose-400">
          {salaryResult.error}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Enter annual CTC and salary components above to calculate estimated take-home.
        </div>
      )}
    </div>
  )
}
