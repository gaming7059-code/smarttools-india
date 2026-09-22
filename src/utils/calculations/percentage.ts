/**
 * Pure Calculation Functions for Percentage Calculator
 * Zero external dependencies, pure TypeScript, safe division.
 */

export interface PercentageResult<T> {
  success: boolean
  data?: T
  error?: string
}

/** Mode A: What is X% of Y? */
export function calculatePercentageOf(
  percentage: number,
  total: number
): PercentageResult<{ result: number; formatted: string }> {
  if (Number.isNaN(percentage) || Number.isNaN(total)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  const result = (percentage / 100) * total
  if (!Number.isFinite(result)) {
    return { success: false, error: 'Calculation resulted in an invalid number.' }
  }

  // Round to 4 decimal places if needed for clean display
  const rounded = Math.round(result * 10000) / 10000
  return {
    success: true,
    data: {
      result: rounded,
      formatted: rounded.toLocaleString('en-IN', { maximumFractionDigits: 4 }),
    },
  }
}

/** Mode B: X is what percentage of Y? */
export function calculateIsWhatPercentage(
  value: number,
  total: number
): PercentageResult<{ percentage: number; formatted: string }> {
  if (Number.isNaN(value) || Number.isNaN(total)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (total === 0) {
    return { success: false, error: 'Total (Y) cannot be 0 for this calculation.' }
  }

  const percentage = (value / total) * 100
  if (!Number.isFinite(percentage)) {
    return { success: false, error: 'Calculation resulted in an invalid number.' }
  }

  const rounded = Math.round(percentage * 10000) / 10000
  return {
    success: true,
    data: {
      percentage: rounded,
      formatted: `${rounded.toLocaleString('en-IN', { maximumFractionDigits: 4 })}%`,
    },
  }
}

/** Mode C: Percentage increase/decrease */
export interface PercentageChangeData {
  changePercent: number
  absoluteChange: number
  type: 'increase' | 'decrease' | 'no-change'
  formatted: string
  differenceFormatted: string
}

export function calculatePercentageChange(
  originalValue: number,
  newValue: number
): PercentageResult<PercentageChangeData> {
  if (Number.isNaN(originalValue) || Number.isNaN(newValue)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (originalValue === 0) {
    if (newValue === 0) {
      return {
        success: true,
        data: {
          changePercent: 0,
          absoluteChange: 0,
          type: 'no-change',
          formatted: '0%',
          differenceFormatted: '0',
        },
      }
    }
    return {
      success: false,
      error: 'Original value cannot be 0 when calculating percentage change.',
    }
  }

  const difference = newValue - originalValue
  const changePercent = (difference / Math.abs(originalValue)) * 100

  if (!Number.isFinite(changePercent)) {
    return { success: false, error: 'Calculation resulted in an invalid number.' }
  }

  const roundedChange = Math.round(Math.abs(changePercent) * 10000) / 10000
  const roundedDiff = Math.round(Math.abs(difference) * 10000) / 10000

  let type: 'increase' | 'decrease' | 'no-change' = 'no-change'
  if (difference > 0) type = 'increase'
  else if (difference < 0) type = 'decrease'

  return {
    success: true,
    data: {
      changePercent: roundedChange,
      absoluteChange: roundedDiff,
      type,
      formatted: `${type === 'decrease' ? '-' : type === 'increase' ? '+' : ''}${roundedChange.toLocaleString('en-IN', { maximumFractionDigits: 4 })}%`,
      differenceFormatted: roundedDiff.toLocaleString('en-IN', { maximumFractionDigits: 4 }),
    },
  }
}

/** Mode D: Find the original value (X% of what number is Y?) */
export function calculateOriginalValue(
  percentage: number,
  result: number
): PercentageResult<{ originalValue: number; formatted: string }> {
  if (Number.isNaN(percentage) || Number.isNaN(result)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (percentage === 0) {
    return { success: false, error: 'Percentage cannot be 0.' }
  }

  const originalValue = result / (percentage / 100)
  if (!Number.isFinite(originalValue)) {
    return { success: false, error: 'Calculation resulted in an invalid number.' }
  }

  const rounded = Math.round(originalValue * 10000) / 10000
  return {
    success: true,
    data: {
      originalValue: rounded,
      formatted: rounded.toLocaleString('en-IN', { maximumFractionDigits: 4 }),
    },
  }
}
