/**
 * Pure Calculation Functions for Date Difference Calculator
 * Computes calendar differences, total units, and date addition/subtraction.
 */

export interface DateDifferenceResultData {
  years: number
  months: number
  days: number
  totalDays: number
  totalWeeks: number
  remainingDays: number
  totalMonths: number
  isReversed: boolean
  formattedDifference: string
  formattedTotalDays: string
}

export interface AddSubtractDaysResultData {
  startDate: string
  days: number
  operation: 'add' | 'subtract'
  resultDateISO: string
  formattedDate: string
  weekday: string
}

export interface DateCalcResult<T> {
  success: boolean
  data?: T
  error?: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Mode 1: Calculate difference between two dates
 */
export function calculateDateDifference(
  startDateStr: string,
  endDateStr: string
): DateCalcResult<DateDifferenceResultData> {
  if (!startDateStr || !endDateStr) {
    return { success: false, error: 'Please enter both start and end dates.' }
  }

  const [sY, sM, sD] = startDateStr.split('-').map(Number)
  const [eY, eM, eD] = endDateStr.split('-').map(Number)

  if (!sY || !sM || !sD || !eY || !eM || !eD) {
    return { success: false, error: 'Please enter valid calendar dates.' }
  }

  const sDate = new Date(sY, sM - 1, sD)
  const eDate = new Date(eY, eM - 1, eD)

  if (Number.isNaN(sDate.getTime()) || Number.isNaN(eDate.getTime())) {
    return { success: false, error: 'Invalid date values entered.' }
  }

  // Check if dates are reversed
  const isReversed = sDate.getTime() > eDate.getTime()
  const [dStart, dEnd] = isReversed ? [eDate, sDate] : [sDate, eDate]

  let years = dEnd.getFullYear() - dStart.getFullYear()
  let months = dEnd.getMonth() - dStart.getMonth()
  let days = dEnd.getDate() - dStart.getDate()

  if (days < 0) {
    months -= 1
    // Days in preceding month
    const prevMonthDays = new Date(dEnd.getFullYear(), dEnd.getMonth(), 0).getDate()
    days += prevMonthDays
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  const diffMs = Math.abs(eDate.getTime() - sDate.getTime())
  const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  const totalWeeks = Math.floor(totalDays / 7)
  const remainingDays = totalDays % 7
  const totalMonths = years * 12 + months

  // Format readable breakdown
  const parts: string[] = []
  if (years > 0) parts.push(`${years} ${years === 1 ? 'Year' : 'Years'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`)
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`)

  const formattedDifference = parts.join(', ')
  const formattedTotalDays = `Total: ${totalDays.toLocaleString('en-IN')} ${totalDays === 1 ? 'Day' : 'Days'}`

  return {
    success: true,
    data: {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      remainingDays,
      totalMonths,
      isReversed,
      formattedDifference,
      formattedTotalDays,
    },
  }
}

/**
 * Mode 2: Add or Subtract days from a starting date
 */
export function calculateAddSubtractDays(
  startDateStr: string,
  days: number,
  operation: 'add' | 'subtract'
): DateCalcResult<AddSubtractDaysResultData> {
  if (!startDateStr) {
    return { success: false, error: 'Please select a starting date.' }
  }

  if (Number.isNaN(days) || days < 0 || !Number.isFinite(days)) {
    return { success: false, error: 'Please enter a valid positive number of days.' }
  }

  const [sY, sM, sD] = startDateStr.split('-').map(Number)
  if (!sY || !sM || !sD) {
    return { success: false, error: 'Invalid starting date.' }
  }

  const date = new Date(sY, sM - 1, sD)
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: 'Invalid calendar date.' }
  }

  const dayOffset = operation === 'add' ? Math.round(days) : -Math.round(days)
  date.setDate(date.getDate() + dayOffset)

  const resultYear = date.getFullYear()
  const resultMonth = String(date.getMonth() + 1).padStart(2, '0')
  const resultDay = String(date.getDate()).padStart(2, '0')
  const resultDateISO = `${resultYear}-${resultMonth}-${resultDay}`

  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const weekday = WEEKDAYS[date.getDay()]

  return {
    success: true,
    data: {
      startDate: startDateStr,
      days: Math.round(days),
      operation,
      resultDateISO,
      formattedDate,
      weekday,
    },
  }
}
