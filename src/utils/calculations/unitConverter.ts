/**
 * Pure Calculation Functions for Multi-Category Unit Converter
 * Handles 7 categories with exact ratios and temperature formulas.
 */

export interface UnitDefinition {
  id: string
  name: string
  symbol: string
  ratioToBase?: number // Multiplier to convert to base unit
}

export interface UnitCategory {
  id: string
  name: string
  emoji: string
  units: UnitDefinition[]
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    emoji: '📏',
    units: [
      { id: 'mm', name: 'Millimeter', symbol: 'mm', ratioToBase: 0.001 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', ratioToBase: 0.01 },
      { id: 'm', name: 'Meter', symbol: 'm', ratioToBase: 1 },
      { id: 'km', name: 'Kilometer', symbol: 'km', ratioToBase: 1000 },
      { id: 'in', name: 'Inch', symbol: 'in', ratioToBase: 0.0254 },
      { id: 'ft', name: 'Foot', symbol: 'ft', ratioToBase: 0.3048 },
      { id: 'yd', name: 'Yard', symbol: 'yd', ratioToBase: 0.9144 },
      { id: 'mi', name: 'Mile', symbol: 'mi', ratioToBase: 1609.344 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight / Mass',
    emoji: '⚖️',
    units: [
      { id: 'mg', name: 'Milligram', symbol: 'mg', ratioToBase: 0.000001 },
      { id: 'g', name: 'Gram', symbol: 'g', ratioToBase: 0.001 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', ratioToBase: 1 },
      { id: 't', name: 'Tonne (Metric)', symbol: 't', ratioToBase: 1000 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', ratioToBase: 0.028349523125 },
      { id: 'lb', name: 'Pound', symbol: 'lb', ratioToBase: 0.45359237 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    emoji: '🌡️',
    units: [
      { id: 'celsius', name: 'Celsius', symbol: '°C' },
      { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F' },
      { id: 'kelvin', name: 'Kelvin', symbol: 'K' },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    emoji: '📐',
    units: [
      { id: 'sq_m', name: 'Square meter', symbol: 'm²', ratioToBase: 1 },
      { id: 'sq_km', name: 'Square kilometer', symbol: 'km²', ratioToBase: 1000000 },
      { id: 'sq_ft', name: 'Square foot', symbol: 'ft²', ratioToBase: 0.09290304 },
      { id: 'sq_yd', name: 'Square yard', symbol: 'yd²', ratioToBase: 0.83612736 },
      { id: 'acre', name: 'Acre', symbol: 'ac', ratioToBase: 4046.8564224 },
      { id: 'hectare', name: 'Hectare', symbol: 'ha', ratioToBase: 10000 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    emoji: '🧪',
    units: [
      { id: 'ml', name: 'Milliliter', symbol: 'mL', ratioToBase: 0.001 },
      { id: 'l', name: 'Liter', symbol: 'L', ratioToBase: 1 },
      { id: 'cu_m', name: 'Cubic meter', symbol: 'm³', ratioToBase: 1000 },
      { id: 'cu_ft', name: 'Cubic foot', symbol: 'ft³', ratioToBase: 28.316846592 },
      { id: 'gal', name: 'Gallon (US)', symbol: 'gal', ratioToBase: 3.785411784 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    emoji: '⏱️',
    units: [
      { id: 's', name: 'Seconds', symbol: 's', ratioToBase: 1 },
      { id: 'min', name: 'Minutes', symbol: 'min', ratioToBase: 60 },
      { id: 'h', name: 'Hours', symbol: 'h', ratioToBase: 3600 },
      { id: 'd', name: 'Days', symbol: 'd', ratioToBase: 86400 },
      { id: 'wk', name: 'Weeks', symbol: 'wk', ratioToBase: 604800 },
    ],
  },
  {
    id: 'digital',
    name: 'Digital Storage',
    emoji: '💾',
    units: [
      { id: 'b', name: 'Byte', symbol: 'B', ratioToBase: 1 },
      { id: 'kb', name: 'Kilobyte (KB)', symbol: 'KB', ratioToBase: 1024 },
      { id: 'mb', name: 'Megabyte (MB)', symbol: 'MB', ratioToBase: 1048576 },
      { id: 'gb', name: 'Gigabyte (GB)', symbol: 'GB', ratioToBase: 1073741824 },
      { id: 'tb', name: 'Terabyte (TB)', symbol: 'TB', ratioToBase: 1099511627776 },
    ],
  },
]

export interface ConversionResult {
  success: boolean
  result?: number
  formatted?: string
  formula?: string
  error?: string
}

/**
 * Converts a numeric value between two units within a category
 */
export function convertUnit(
  value: number,
  fromUnitId: string,
  toUnitId: string,
  categoryId: string
): ConversionResult {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return { success: false, error: 'Please enter a valid numeric value.' }
  }

  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId)
  if (!category) {
    return { success: false, error: 'Invalid conversion category.' }
  }

  const fromUnit = category.units.find((u) => u.id === fromUnitId)
  const toUnit = category.units.find((u) => u.id === toUnitId)

  if (!fromUnit || !toUnit) {
    return { success: false, error: 'Invalid units selected.' }
  }

  if (fromUnitId === toUnitId) {
    return {
      success: true,
      result: value,
      formatted: formatCleanNumber(value),
      formula: `1 ${fromUnit.symbol} = 1 ${toUnit.symbol}`,
    }
  }

  // Handle Temperature via non-linear formulas
  if (categoryId === 'temperature') {
    return convertTemperature(value, fromUnitId, toUnitId, fromUnit.symbol, toUnit.symbol)
  }

  // Standard multiplier-based conversion via base unit
  const baseValue = value * (fromUnit.ratioToBase ?? 1)
  const result = baseValue / (toUnit.ratioToBase ?? 1)

  if (!Number.isFinite(result) || Number.isNaN(result)) {
    return { success: false, error: 'Conversion resulted in an invalid number.' }
  }

  const ratio = (fromUnit.ratioToBase ?? 1) / (toUnit.ratioToBase ?? 1)
  const formulaText = `1 ${fromUnit.symbol} = ${formatCleanNumber(ratio)} ${toUnit.symbol}`

  return {
    success: true,
    result,
    formatted: formatCleanNumber(result),
    formula: formulaText,
  }
}

function convertTemperature(
  value: number,
  from: string,
  to: string,
  fromSym: string,
  toSym: string
): ConversionResult {
  let celsius: number

  // Convert from source to Celsius
  if (from === 'celsius') {
    celsius = value
  } else if (from === 'fahrenheit') {
    celsius = ((value - 32) * 5) / 9
  } else if (from === 'kelvin') {
    celsius = value - 273.15
  } else {
    return { success: false, error: 'Unknown temperature unit.' }
  }

  // Convert from Celsius to target
  let finalResult: number
  let formulaText = ''

  if (to === 'celsius') {
    finalResult = celsius
    if (from === 'fahrenheit') formulaText = `°C = (°F - 32) × 5/9`
    else if (from === 'kelvin') formulaText = `°C = K - 273.15`
  } else if (to === 'fahrenheit') {
    finalResult = (celsius * 9) / 5 + 32
    if (from === 'celsius') formulaText = `°F = (°C × 9/5) + 32`
    else if (from === 'kelvin') formulaText = `°F = (K - 273.15) × 9/5 + 32`
  } else if (to === 'kelvin') {
    finalResult = celsius + 273.15
    if (from === 'celsius') formulaText = `K = °C + 273.15`
    else if (from === 'fahrenheit') formulaText = `K = (°F - 32) × 5/9 + 273.15`
  } else {
    return { success: false, error: 'Unknown temperature unit.' }
  }

  if (Number.isNaN(finalResult) || !Number.isFinite(finalResult)) {
    return { success: false, error: 'Invalid temperature calculation.' }
  }

  return {
    success: true,
    result: finalResult,
    formatted: formatCleanNumber(finalResult),
    formula: formulaText || `${fromSym} → ${toSym}`,
  }
}

/**
 * Formats numbers cleanly without trailing floating-point decimals like 12.000000000000002
 */
export function formatCleanNumber(num: number): string {
  if (Math.abs(num) < 1e-6 && num !== 0) {
    return num.toExponential(4)
  }
  if (Math.abs(num) >= 1e12) {
    return num.toExponential(4)
  }

  // Round to up to 8 decimal places and remove trailing zeros
  const rounded = Math.round((num + Number.EPSILON) * 100000000) / 100000000
  return rounded.toLocaleString('en-IN', { maximumFractionDigits: 8 })
}
