import React, { useState, useMemo } from 'react'
import { RotateCcw } from 'lucide-react'

import { calculateDiscount, calculateDiscountFromSale } from '../../utils/calculations/discount'
import { formatINR } from '../../utils/currency'

type DiscountMode = 'calculateSalePrice' | 'calculateDiscountPercent'

export const DiscountCalculator: React.FC = () => {
  const [mode, setMode] = useState<DiscountMode>('calculateSalePrice')

  // Mode 1: Price + Discount %
  const [originalPrice1, setOriginalPrice1] = useState<string>('1000')
  const [discountPercent1, setDiscountPercent1] = useState<string>('20')

  // Mode 2: Original Price + Sale Price
  const [originalPrice2, setOriginalPrice2] = useState<string>('1000')
  const [salePrice2, setSalePrice2] = useState<string>('800')

  // Common quick discount shortcuts for shoppers
  const discountPills = [5, 10, 15, 20, 25, 30, 40, 50, 70]

  // Mode 1 calculation
  const result1 = useMemo(() => {
    if (!originalPrice1 || !discountPercent1) return null
    return calculateDiscount(parseFloat(originalPrice1), parseFloat(discountPercent1))
  }, [originalPrice1, discountPercent1])

  // Mode 2 calculation
  const result2 = useMemo(() => {
    if (!originalPrice2 || !salePrice2) return null
    return calculateDiscountFromSale(parseFloat(originalPrice2), parseFloat(salePrice2))
  }, [originalPrice2, salePrice2])

  const handleReset = () => {
    if (mode === 'calculateSalePrice') {
      setOriginalPrice1('')
      setDiscountPercent1('')
    } else {
      setOriginalPrice2('')
      setSalePrice2('')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          type="button"
          onClick={() => setMode('calculateSalePrice')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'calculateSalePrice'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Calculate Sale Price &amp; Savings
        </button>
        <button
          type="button"
          onClick={() => setMode('calculateDiscountPercent')}
          className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors ${
            mode === 'calculateDiscountPercent'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Calculate Discount Percentage
        </button>
      </div>

      {/* Mode 1: Calculate Sale Price from Original Price and Discount % */}
      {mode === 'calculateSalePrice' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Original Price */}
            <div>
              <label htmlFor="origPrice1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Original Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  id="origPrice1"
                  type="number"
                  step="any"
                  min="0"
                  value={originalPrice1}
                  onChange={(e) => setOriginalPrice1(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Discount Percentage */}
            <div>
              <label htmlFor="discPercent1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Percentage (%)
              </label>
              <div className="relative">
                <input
                  id="discPercent1"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={discountPercent1}
                  onChange={(e) => setDiscountPercent1(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-xs font-medium text-slate-400 mr-2">Quick Discounts:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1 sm:mt-0">
              {discountPills.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent1(pct.toString())}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    discountPercent1 === pct.toString()
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pct}% off
                </button>
              ))}
            </div>
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

          {/* Result Card 1 */}
          {result1?.success && result1.data ? (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-emerald-50/40 border border-blue-100 p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Final Discounted Price
                </span>
                <div className="mt-1 text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  {formatINR(result1.data.finalPrice, { showDecimals: true })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Discount Amount</div>
                  <div className="text-lg sm:text-xl font-bold text-rose-600 mt-1">
                    - {formatINR(result1.data.discountAmount, { showDecimals: true })}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-emerald-200 shadow-2xs">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">You Save</div>
                  <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-1">
                    {formatINR(result1.data.youSave, { showDecimals: true })}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Savings Percentage</div>
                  <div className="text-lg sm:text-xl font-bold text-blue-700 mt-1">
                    {result1.data.discountPercent}% Off
                  </div>
                </div>
              </div>
            </div>
          ) : result1?.error ? (
            <p className="text-sm font-medium text-rose-600">{result1.error}</p>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Enter original price and discount percentage above to see savings.
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Calculate Discount Percentage from Original & Sale Price */}
      {mode === 'calculateDiscountPercent' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Original Price */}
            <div>
              <label htmlFor="origPrice2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Original Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  id="origPrice2"
                  type="number"
                  step="any"
                  min="0"
                  value={originalPrice2}
                  onChange={(e) => setOriginalPrice2(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Sale / Offer Price */}
            <div>
              <label htmlFor="salePrice2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Sale / Final Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  id="salePrice2"
                  type="number"
                  step="any"
                  min="0"
                  value={salePrice2}
                  onChange={(e) => setSalePrice2(e.target.value)}
                  placeholder="e.g. 800"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3.5 py-2.5 text-base font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
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
          {result2?.success && result2.data ? (
            <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-emerald-50/40 border border-blue-100 p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Calculated Discount Rate
                </span>
                <div className="mt-1 text-3xl sm:text-5xl font-black text-blue-700 tracking-tight">
                  {result2.data.discountPercent}% Off
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div className="rounded-xl bg-white p-4 border border-emerald-200 shadow-2xs">
                  <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Total Amount Saved</div>
                  <div className="text-xl font-bold text-emerald-700 mt-1">
                    {formatINR(result2.data.amountSaved, { showDecimals: true })}
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Final Price Paid</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {formatINR(result2.data.salePrice, { showDecimals: true })}
                  </div>
                </div>
              </div>
            </div>
          ) : result2?.error ? (
            <p className="text-sm font-medium text-rose-600">{result2.error}</p>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Enter original price and sale price to determine the discount percentage.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
