import React, { useState, useMemo } from 'react'
import { ArrowLeftRight, RotateCcw } from 'lucide-react'
import { UNIT_CATEGORIES, convertUnit } from '../../utils/calculations/unitConverter'

export const UnitConverter: React.FC = () => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>('length')
  const [inputValue, setInputValue] = useState<string>('1')

  const currentCategory = useMemo(() => {
    return UNIT_CATEGORIES.find((c) => c.id === activeCategoryId) || UNIT_CATEGORIES[0]
  }, [activeCategoryId])

  const [fromUnitId, setFromUnitId] = useState<string>(currentCategory.units[0]?.id || 'm')
  const [toUnitId, setToUnitId] = useState<string>(currentCategory.units[1]?.id || 'km')

  // Switch category updates default units
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategoryId(categoryId)
    const cat = UNIT_CATEGORIES.find((c) => c.id === categoryId) || UNIT_CATEGORIES[0]
    setFromUnitId(cat.units[0]?.id || '')
    setToUnitId(cat.units[1]?.id || cat.units[0]?.id || '')
  }

  // Swap units
  const handleSwapUnits = () => {
    const prevFrom = fromUnitId
    setFromUnitId(toUnitId)
    setToUnitId(prevFrom)
  }

  const handleReset = () => {
    setInputValue('1')
  }

  // Live Conversion
  const conversionResult = useMemo(() => {
    if (inputValue === '' || inputValue === undefined) return null
    const num = parseFloat(inputValue)
    return convertUnit(num, fromUnitId, toUnitId, activeCategoryId)
  }, [inputValue, fromUnitId, toUnitId, activeCategoryId])

  const fromUnitObj = currentCategory.units.find((u) => u.id === fromUnitId)
  const toUnitObj = currentCategory.units.find((u) => u.id === toUnitId)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Category Pills Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Select Measurement Category
        </label>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {UNIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategoryId === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Converter Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
        {/* From Side (3 cols) */}
        <div className="md:col-span-3 space-y-2">
          <label htmlFor="fromValueInput" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            From
          </label>
          <div className="space-y-2">
            <input
              id="fromValueInput"
              type="number"
              step="any"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter value"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={fromUnitId}
              onChange={(e) => setFromUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {currentCategory.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Button (1 col) */}
        <div className="md:col-span-1 flex justify-center pt-4 md:pt-6">
          <button
            type="button"
            onClick={handleSwapUnits}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-2xs"
            title="Swap Units"
            aria-label="Swap from and to units"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        {/* To Side (3 cols) */}
        <div className="md:col-span-3 space-y-2">
          <label htmlFor="toUnitSelect" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            To
          </label>
          <div className="space-y-2">
            <div className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-base font-bold text-blue-900 truncate">
              {conversionResult?.success && conversionResult.formatted !== undefined
                ? conversionResult.formatted
                : '—'}
            </div>
            <select
              id="toUnitSelect"
              value={toUnitId}
              onChange={(e) => setToUnitId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              {currentCategory.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
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

      {/* Result Card */}
      {conversionResult?.success && conversionResult.formatted !== undefined ? (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/40 border border-blue-100 p-6 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Conversion Result
          </span>
          <div className="mt-1 text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex flex-wrap items-baseline gap-2">
            <span>{inputValue || '0'} {fromUnitObj?.symbol}</span>
            <span className="text-blue-600">=</span>
            <span className="text-blue-700">{conversionResult.formatted} {toUnitObj?.symbol}</span>
          </div>
          {conversionResult.formula && (
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              Formula: {conversionResult.formula}
            </p>
          )}
        </div>
      ) : conversionResult?.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          {conversionResult.error}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Enter a value to convert units in real time.
        </div>
      )}
    </div>
  )
}
