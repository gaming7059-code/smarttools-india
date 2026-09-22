/**
 * Pure Calculation Functions for EMI (Equated Monthly Installment) Calculator
 * Zero external dependencies, pure TypeScript, safe division.
 */

export interface EMICalculationResult {
  monthlyEMI: number
  totalInterest: number
  totalPayment: number
  principal: number
  principalPercentage: number
  interestPercentage: number
  totalMonths: number
}

export interface EMIResult {
  success: boolean
  data?: EMICalculationResult
  error?: string
}

/**
 * Calculates loan EMI, total interest, and total repayment
 * @param principal Loan amount in Rupees
 * @param annualInterestRate Annual interest rate in percentage (e.g. 8.5)
 * @param tenure Tenure duration
 * @param tenureUnit 'years' or 'months'
 */
export function calculateLoanEMI(
  principal: number,
  annualInterestRate: number,
  tenure: number,
  tenureUnit: 'years' | 'months' = 'years'
): EMIResult {
  if (
    Number.isNaN(principal) ||
    Number.isNaN(annualInterestRate) ||
    Number.isNaN(tenure)
  ) {
    return { success: false, error: 'Please enter valid numerical values.' }
  }

  if (principal <= 0) {
    return { success: false, error: 'Loan amount must be greater than 0.' }
  }

  if (annualInterestRate < 0) {
    return { success: false, error: 'Interest rate cannot be negative.' }
  }

  if (tenure <= 0) {
    return { success: false, error: 'Loan tenure must be greater than 0.' }
  }

  const totalMonths = tenureUnit === 'years' ? Math.round(tenure * 12) : Math.round(tenure)

  if (totalMonths <= 0 || !Number.isFinite(totalMonths)) {
    return { success: false, error: 'Invalid tenure duration.' }
  }

  const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

  // Zero-interest loan calculation
  if (annualInterestRate === 0) {
    const monthlyEMI = principal / totalMonths
    return {
      success: true,
      data: {
        principal: round2(principal),
        monthlyEMI: round2(monthlyEMI),
        totalInterest: 0,
        totalPayment: round2(principal),
        principalPercentage: 100,
        interestPercentage: 0,
        totalMonths,
      },
    }
  }

  // Monthly interest rate = Annual rate / 12 / 100
  const monthlyRate = annualInterestRate / 12 / 100

  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, totalMonths)
  if (!Number.isFinite(factor) || factor - 1 === 0) {
    return { success: false, error: 'Calculation resulted in an invalid number.' }
  }

  const monthlyEMI = (principal * monthlyRate * factor) / (factor - 1)
  const totalPayment = monthlyEMI * totalMonths
  const totalInterest = Math.max(0, totalPayment - principal)

  const principalPercentage = (principal / totalPayment) * 100
  const interestPercentage = (totalInterest / totalPayment) * 100

  return {
    success: true,
    data: {
      principal: round2(principal),
      monthlyEMI: round2(monthlyEMI),
      totalInterest: round2(totalInterest),
      totalPayment: round2(totalPayment),
      principalPercentage: round2(principalPercentage),
      interestPercentage: round2(interestPercentage),
      totalMonths,
    },
  }
}
