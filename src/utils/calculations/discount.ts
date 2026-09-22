/**
 * Pure Calculation Functions for Discount Calculator
 * Accurate financial math with decimal support and input validation.
 */

export interface DiscountCalculationResult {
  discountAmount: number
  finalPrice: number
  youSave: number
  discountPercent: number
  originalPrice: number
}

export interface DiscountReverseResult {
  discountPercent: number
  amountSaved: number
  originalPrice: number
  salePrice: number
}

export interface DiscountResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Section 1: Calculate Final Price and Savings from Original Price & Discount Percentage
 */
export function calculateDiscount(
  originalPrice: number,
  discountPercent: number
): DiscountResult<DiscountCalculationResult> {
  if (Number.isNaN(originalPrice) || Number.isNaN(discountPercent)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (originalPrice < 0) {
    return { success: false, error: 'Original price cannot be negative.' }
  }

  if (discountPercent < 0) {
    return { success: false, error: 'Discount percentage cannot be negative.' }
  }

  if (discountPercent > 100) {
    return { success: false, error: 'Discount percentage cannot exceed 100%.' }
  }

  const discountAmount = (originalPrice * discountPercent) / 100
  const finalPrice = Math.max(0, originalPrice - discountAmount)
  const youSave = discountAmount

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

  return {
    success: true,
    data: {
      originalPrice: round2(originalPrice),
      discountPercent: round2(discountPercent),
      discountAmount: round2(discountAmount),
      finalPrice: round2(finalPrice),
      youSave: round2(youSave),
    },
  }
}

/**
 * Section 2: Calculate Discount Percentage from Original Price & Sale Price
 */
export function calculateDiscountFromSale(
  originalPrice: number,
  salePrice: number
): DiscountResult<DiscountReverseResult> {
  if (Number.isNaN(originalPrice) || Number.isNaN(salePrice)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (originalPrice <= 0) {
    return { success: false, error: 'Original price must be greater than 0.' }
  }

  if (salePrice < 0) {
    return { success: false, error: 'Sale price cannot be negative.' }
  }

  if (salePrice > originalPrice) {
    return {
      success: false,
      error: 'Sale price cannot be greater than the original price.',
    }
  }

  const amountSaved = originalPrice - salePrice
  const discountPercent = (amountSaved / originalPrice) * 100

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

  return {
    success: true,
    data: {
      originalPrice: round2(originalPrice),
      salePrice: round2(salePrice),
      amountSaved: round2(amountSaved),
      discountPercent: round2(discountPercent),
    },
  }
}
