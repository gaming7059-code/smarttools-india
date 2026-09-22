/**
 * Pure Calculation Functions for Salary Breakdown Calculator
 * Indian salary structure estimation (CTC, Basic, HRA, PF, PT, in-hand).
 */

export interface SalaryInputs {
  annualCTC: number
  basicPercent: number
  hraPercent: number
  monthlyOtherAllowances: number
  employeePFPercent: number
  monthlyProfessionalTax: number
}

export interface SalaryBreakdownData {
  // Monthly Breakdown
  monthlyGrossSalary: number
  monthlyBasic: number
  monthlyHRA: number
  monthlyOtherAllowances: number
  monthlyEmployeePF: number
  monthlyProfessionalTax: number
  monthlyTotalDeductions: number
  estimatedMonthlyTakeHome: number

  // Annual Breakdown
  annualGrossSalary: number
  annualBasic: number
  annualHRA: number
  annualOtherAllowances: number
  annualEmployeePF: number
  annualProfessionalTax: number
  annualTotalDeductions: number
  estimatedAnnualTakeHome: number
}

export interface SalaryResult {
  success: boolean
  data?: SalaryBreakdownData
  error?: string
}

const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100

export function calculateSalaryBreakdown(inputs: SalaryInputs): SalaryResult {
  const {
    annualCTC,
    basicPercent,
    hraPercent,
    monthlyOtherAllowances,
    employeePFPercent,
    monthlyProfessionalTax,
  } = inputs

  if (
    Number.isNaN(annualCTC) ||
    Number.isNaN(basicPercent) ||
    Number.isNaN(hraPercent) ||
    Number.isNaN(monthlyOtherAllowances) ||
    Number.isNaN(employeePFPercent) ||
    Number.isNaN(monthlyProfessionalTax)
  ) {
    return { success: false, error: 'Please enter valid numerical values.' }
  }

  if (annualCTC < 0) {
    return { success: false, error: 'Annual CTC cannot be negative.' }
  }

  if (basicPercent < 0 || basicPercent > 100) {
    return { success: false, error: 'Basic salary percentage must be between 0% and 100%.' }
  }

  if (hraPercent < 0 || hraPercent > 100) {
    return { success: false, error: 'HRA percentage must be between 0% and 100%.' }
  }

  if (monthlyOtherAllowances < 0) {
    return { success: false, error: 'Other allowances cannot be negative.' }
  }

  if (employeePFPercent < 0 || employeePFPercent > 100) {
    return { success: false, error: 'Employee PF percentage must be between 0% and 100%.' }
  }

  if (monthlyProfessionalTax < 0) {
    return { success: false, error: 'Professional tax cannot be negative.' }
  }

  // Monthly Basic = (Annual CTC * (basicPercent / 100)) / 12
  const annualBasic = (annualCTC * basicPercent) / 100
  const monthlyBasic = annualBasic / 12

  // Monthly HRA = Monthly Basic * (hraPercent / 100)
  const monthlyHRA = (monthlyBasic * hraPercent) / 100
  const annualHRA = monthlyHRA * 12

  // Monthly Gross Salary = Monthly Basic + Monthly HRA + Monthly Other Allowances
  const monthlyGrossSalary = monthlyBasic + monthlyHRA + monthlyOtherAllowances
  const annualGrossSalary = monthlyGrossSalary * 12

  // Deductions:
  // Employee PF = Monthly Basic * (employeePFPercent / 100)
  const monthlyEmployeePF = (monthlyBasic * employeePFPercent) / 100
  const annualEmployeePF = monthlyEmployeePF * 12

  const annualProfessionalTax = monthlyProfessionalTax * 12

  const monthlyTotalDeductions = monthlyEmployeePF + monthlyProfessionalTax
  const annualTotalDeductions = monthlyTotalDeductions * 12

  // Estimated Take-Home = Gross - Deductions
  const estimatedMonthlyTakeHome = Math.max(0, monthlyGrossSalary - monthlyTotalDeductions)
  const estimatedAnnualTakeHome = estimatedMonthlyTakeHome * 12

  return {
    success: true,
    data: {
      monthlyGrossSalary: round2(monthlyGrossSalary),
      monthlyBasic: round2(monthlyBasic),
      monthlyHRA: round2(monthlyHRA),
      monthlyOtherAllowances: round2(monthlyOtherAllowances),
      monthlyEmployeePF: round2(monthlyEmployeePF),
      monthlyProfessionalTax: round2(monthlyProfessionalTax),
      monthlyTotalDeductions: round2(monthlyTotalDeductions),
      estimatedMonthlyTakeHome: round2(estimatedMonthlyTakeHome),

      annualGrossSalary: round2(annualGrossSalary),
      annualBasic: round2(annualBasic),
      annualHRA: round2(annualHRA),
      annualOtherAllowances: round2(monthlyOtherAllowances * 12),
      annualEmployeePF: round2(annualEmployeePF),
      annualProfessionalTax: round2(annualProfessionalTax),
      annualTotalDeductions: round2(annualTotalDeductions),
      estimatedAnnualTakeHome: round2(estimatedAnnualTakeHome),
    },
  }
}
