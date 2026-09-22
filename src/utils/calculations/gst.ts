/**
 * Pure Calculation Functions for GST (Goods and Services Tax) Calculator
 * Accurate financial math with standard Indian tax slabs and CGST/SGST breakdown.
 */

export interface GSTAddResult {
  baseAmount: number
  gstRate: number
  gstAmount: number
  cgst: number
  sgst: number
  finalAmount: number
}

export interface GSTRemoveResult {
  inclusiveAmount: number
  gstRate: number
  baseAmount: number
  gstAmount: number
  cgst: number
  sgst: number
}

export interface GSTResult<T> {
  success: boolean
  data?: T
  error?: string
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

/**
 * Mode A: Add GST to base amount
 */
export function calculateAddGST(
  baseAmount: number,
  gstRate: number
): GSTResult<GSTAddResult> {
  if (Number.isNaN(baseAmount) || Number.isNaN(gstRate)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (baseAmount < 0) {
    return { success: false, error: 'Base amount cannot be negative.' }
  }

  if (gstRate < 0) {
    return { success: false, error: 'GST rate cannot be negative.' }
  }

  if (gstRate > 100) {
    return { success: false, error: 'GST rate cannot exceed 100%.' }
  }

  const gstAmount = (baseAmount * gstRate) / 100
  const finalAmount = baseAmount + gstAmount
  const cgst = gstAmount / 2
  const sgst = gstAmount / 2

  return {
    success: true,
    data: {
      baseAmount: round2(baseAmount),
      gstRate: round2(gstRate),
      gstAmount: round2(gstAmount),
      cgst: round2(cgst),
      sgst: round2(sgst),
      finalAmount: round2(finalAmount),
    },
  }
}

/**
 * Mode B: Remove GST from inclusive amount
 * Base = Inclusive / (1 + Rate / 100)
 * GST = Inclusive - Base
 */
export function calculateRemoveGST(
  inclusiveAmount: number,
  gstRate: number
): GSTResult<GSTRemoveResult> {
  if (Number.isNaN(inclusiveAmount) || Number.isNaN(gstRate)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (inclusiveAmount < 0) {
    return { success: false, error: 'Total amount cannot be negative.' }
  }

  if (gstRate < 0) {
    return { success: false, error: 'GST rate cannot be negative.' }
  }

  if (gstRate > 100) {
    return { success: false, error: 'GST rate cannot exceed 100%.' }
  }

  const baseAmount = inclusiveAmount / (1 + gstRate / 100)
  const gstAmount = inclusiveAmount - baseAmount
  const cgst = gstAmount / 2
  const sgst = gstAmount / 2

  return {
    success: true,
    data: {
      inclusiveAmount: round2(inclusiveAmount),
      gstRate: round2(gstRate),
      baseAmount: round2(baseAmount),
      gstAmount: round2(gstAmount),
      cgst: round2(cgst),
      sgst: round2(sgst),
    },
  }
}
