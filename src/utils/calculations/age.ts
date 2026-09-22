/**
 * Pure Calculation Functions for Age Calculator
 * Accurate Gregorian calendar math accounting for leap years and variable month lengths.
 */

export interface AgeCalculationResult {
  years: number
  months: number
  days: number
  totalMonths: number
  totalWeeks: number
  remainingDaysInWeek: number
  totalDays: number
  totalHours: number
  nextBirthday: {
    daysUntil: number
    weekday: string
    dateString: string
  }
}

export interface AgeResult {
  success: boolean
  data?: AgeCalculationResult
  error?: string
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Validates and calculates precise calendar age
 * @param birthDateStr Date string in 'YYYY-MM-DD' format
 * @param targetDateStr Optional target date in 'YYYY-MM-DD' format (defaults to current date)
 */
export function calculateAge(birthDateStr: string, targetDateStr?: string): AgeResult {
  if (!birthDateStr) {
    return { success: false, error: 'Please enter your date of birth.' }
  }

  // Parse dates with time zeroed in local time zone
  const [bYear, bMonth, bDay] = birthDateStr.split('-').map(Number)
  if (!bYear || !bMonth || !bDay) {
    return { success: false, error: 'Please enter a valid date of birth.' }
  }

  const birthDate = new Date(bYear, bMonth - 1, bDay)
  if (
    birthDate.getFullYear() !== bYear ||
    birthDate.getMonth() !== bMonth - 1 ||
    birthDate.getDate() !== bDay
  ) {
    return { success: false, error: 'Please enter a valid date of birth.' }
  }

  let targetDate: Date
  if (targetDateStr) {
    const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number)
    if (!tYear || !tMonth || !tDay) {
      return { success: false, error: 'Please enter a valid target date.' }
    }
    targetDate = new Date(tYear, tMonth - 1, tDay)
  } else {
    const now = new Date()
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }

  // Future birth date validation
  if (birthDate.getTime() > targetDate.getTime()) {
    return { success: false, error: 'Please enter a valid date of birth.' }
  }

  let years = targetDate.getFullYear() - birthDate.getFullYear()
  let months = targetDate.getMonth() - birthDate.getMonth()
  let days = targetDate.getDate() - birthDate.getDate()

  if (days < 0) {
    months -= 1
    // Days in the previous month before target date
    const prevMonthDays = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0).getDate()
    days += prevMonthDays
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  // Total absolute day differences
  const diffTimeMs = targetDate.getTime() - birthDate.getTime()
  const totalDays = Math.round(diffTimeMs / (1000 * 60 * 60 * 24))
  const totalWeeks = Math.floor(totalDays / 7)
  const remainingDaysInWeek = totalDays % 7
  const totalMonths = years * 12 + months
  const totalHours = totalDays * 24

  // Next birthday calculation
  let nextBdayYear = targetDate.getFullYear()
  let nextBdayDate = new Date(nextBdayYear, birthDate.getMonth(), birthDate.getDate())

  // Handle Feb 29 for non-leap years
  if (birthDate.getMonth() === 1 && birthDate.getDate() === 29) {
    const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    if (!isLeap(nextBdayYear)) {
      nextBdayDate = new Date(nextBdayYear, 1, 28)
    }
  }

  if (nextBdayDate.getTime() < targetDate.getTime()) {
    nextBdayYear += 1
    nextBdayDate = new Date(nextBdayYear, birthDate.getMonth(), birthDate.getDate())
    if (birthDate.getMonth() === 1 && birthDate.getDate() === 29) {
      const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      if (!isLeap(nextBdayYear)) {
        nextBdayDate = new Date(nextBdayYear, 1, 28)
      }
    }
  }

  const daysUntilNext = Math.round(
    (nextBdayDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const weekday = WEEKDAYS[nextBdayDate.getDay()]
  const dateString = nextBdayDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return {
    success: true,
    data: {
      years,
      months,
      days,
      totalMonths,
      totalWeeks,
      remainingDaysInWeek,
      totalDays,
      totalHours,
      nextBirthday: {
        daysUntil: daysUntilNext,
        weekday,
        dateString,
      },
    },
  }
}
