/**
 * SmartTools India — Currency & Number Formatting Utilities
 * Uses standard en-IN locale with Intl.NumberFormat
 */

export function formatINR(
  amount: number,
  options?: {
    showDecimals?: boolean
    maxFractionDigits?: number
  }
): string {
  if (amount === undefined || amount === null || Number.isNaN(amount) || !Number.isFinite(amount)) {
    return '₹0'
  }

  const { showDecimals = false, maxFractionDigits = 2 } = options || {}

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? (amount % 1 === 0 ? 0 : 2) : 0,
    maximumFractionDigits: maxFractionDigits,
  })

  return formatter.format(amount)
}

export function formatNumberIN(
  value: number,
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }
): string {
  if (value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return '0'
  }

  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options || {}

  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter.format(value)
}
