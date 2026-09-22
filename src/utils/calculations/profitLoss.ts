/**
 * Pure Calculation Functions for Profit and Loss Calculator
 * Commercial mathematics for business owners, traders, and students.
 */

export interface ProfitLossResultData {
  costPrice: number
  sellingPrice: number
  amount: number
  percentage: number
  status: 'profit' | 'loss' | 'breakeven'
}

export interface TargetSellingPriceData {
  costPrice: number
  desiredProfitPercent: number
  sellingPrice: number
  profitAmount: number
}

export interface ProfitLossResult<T> {
  success: boolean
  data?: T
  error?: string
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

/**
 * Mode 1: Calculate Profit or Loss from Cost Price and Selling Price
 */
export function calculateProfitLoss(
  costPrice: number,
  sellingPrice: number
): ProfitLossResult<ProfitLossResultData> {
  if (Number.isNaN(costPrice) || Number.isNaN(sellingPrice)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (costPrice <= 0) {
    return { success: false, error: 'Cost price must be greater than 0.' }
  }

  if (sellingPrice < 0) {
    return { success: false, error: 'Selling price cannot be negative.' }
  }

  if (sellingPrice > costPrice) {
    const profit = sellingPrice - costPrice
    const profitPercent = (profit / costPrice) * 100
    return {
      success: true,
      data: {
        costPrice: round2(costPrice),
        sellingPrice: round2(sellingPrice),
        amount: round2(profit),
        percentage: round2(profitPercent),
        status: 'profit',
      },
    }
  }

  if (sellingPrice < costPrice) {
    const loss = costPrice - sellingPrice
    const lossPercent = (loss / costPrice) * 100
    return {
      success: true,
      data: {
        costPrice: round2(costPrice),
        sellingPrice: round2(sellingPrice),
        amount: round2(loss),
        percentage: round2(lossPercent),
        status: 'loss',
      },
    }
  }

  return {
    success: true,
    data: {
      costPrice: round2(costPrice),
      sellingPrice: round2(sellingPrice),
      amount: 0,
      percentage: 0,
      status: 'breakeven',
    },
  }
}

/**
 * Mode 2: Calculate Target Selling Price from Cost Price & Desired Profit %
 */
export function calculateTargetSellingPrice(
  costPrice: number,
  desiredProfitPercent: number
): ProfitLossResult<TargetSellingPriceData> {
  if (Number.isNaN(costPrice) || Number.isNaN(desiredProfitPercent)) {
    return { success: false, error: 'Please enter valid numbers.' }
  }

  if (costPrice <= 0) {
    return { success: false, error: 'Cost price must be greater than 0.' }
  }

  if (desiredProfitPercent < -100) {
    return { success: false, error: 'Loss percentage cannot exceed 100%.' }
  }

  const sellingPrice = costPrice * (1 + desiredProfitPercent / 100)
  const profitAmount = sellingPrice - costPrice

  return {
    success: true,
    data: {
      costPrice: round2(costPrice),
      desiredProfitPercent: round2(desiredProfitPercent),
      sellingPrice: round2(sellingPrice),
      profitAmount: round2(profitAmount),
    },
  }
}
