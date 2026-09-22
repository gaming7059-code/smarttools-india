import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { DateDifferenceCalculator } from '../../tools/DateDifferenceCalculator/DateDifferenceCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const DateDifferenceCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'date-difference-calculator')!

  const howToUseSteps = [
    'Select your calculation mode: choose "Difference Between Two Dates" to count days between milestones, or "Add or Subtract Days" to find a future deadline or past event date.',
    'Pick your Start Date and End Date using the date picker or click the "Set Today" shortcut.',
    'View the exact calendar breakdown in years, months, and days, as well as total aggregate days, weeks, and hours.',
    'In Add/Subtract mode, choose whether to add or subtract days, enter the number of days, and see the exact target calendar date and day of the week.',
    'Click "Reset Dates" whenever you need to clear and recalculate new project schedules.',
  ]

  const formulas = [
    {
      title: 'Total Days Between Timestamps',
      formula: 'Total Days = |EndDate Timestamp - StartDate Timestamp| / (86,400,000 ms)',
      explanation: 'Converts absolute millisecond timestamp difference into standard 24-hour solar days.',
    },
    {
      title: 'Calendar Month & Year Amortization',
      formula: 'Years = eYear - sYear; Months = eMonth - sMonth; Days = eDay - sDay',
      explanation: 'Compensates for varying calendar month lengths (28, 29, 30, or 31 days) and leap years by borrowing days from preceding months.',
    },
    {
      title: 'Total Weeks and Remaining Days',
      formula: 'Total Weeks = Math.floor(Total Days / 7)\nRemaining Days = Total Days % 7',
      explanation: 'Splits total duration into complete calendar weeks plus leftover days.',
    },
    {
      title: 'Date Addition & Subtraction',
      formula: 'Target Date = Start Date ± (Days × 86,400,000 ms)',
      explanation: 'Computes target milestone date while adjusting automatically across month and year boundaries.',
    },
  ]

  const examples = [
    {
      title: 'Project Deadline & Sprint Planning',
      description: 'Calculating available working duration from 1st April 2026 to 15th August 2026.',
      input: 'Start = 01 Apr 2026, End = 15 Aug 2026',
      output: '4 Months, 14 Days (Total: 136 Days / 19 Weeks + 3d)',
    },
    {
      title: 'Visa or Passport 90-Day Rule',
      description: 'Finding the exact expiration date 90 days after arriving on 1st November 2026.',
      input: 'Start = 01 Nov 2026, Add = 90 Days',
      output: 'Target Date: Saturday, 30 January 2027',
    },
    {
      title: 'Warranty or Lease Expiry',
      description: 'Counting days remaining on an equipment lease ending 31st December 2026.',
      input: 'Start = Today, End = 31 Dec 2026',
      output: 'Precise countdown in days and weeks',
    },
  ]

  const faqs = [
    {
      question: 'Does this calculator account for leap years?',
      answer: 'Yes! All leap years (such as 2024, 2028) including February 29th are calculated with full mathematical accuracy using standard Gregorian calendar rules.',
    },
    {
      question: 'Does the calculation include both the start date and the end date?',
      answer: 'This calculator measures elapsed duration (the interval between dates). For example, the difference between May 1st and May 2nd is 1 day. If your legal contract requires both start and end days inclusive, simply add 1 day to the total.',
    },
    {
      question: 'Can I calculate date differences across different centuries?',
      answer: 'Yes, any standard historical or future calendar dates supported by the modern Gregorian calendar can be compared seamlessly.',
    },
    {
      question: 'Are my project dates stored or logged?',
      answer: 'No. The entire calculation runs directly in your local browser session without communicating with any external servers.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Date Difference Calculator — Days Between Dates & Add Days | SmartTools India"
      seoDescription="Calculate exact days, weeks, and months between any two dates or add and subtract days to find target deadlines. Free online calendar calculator."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['age-calculator', 'percentage-calculator', 'emi-calculator']}
    >
      <DateDifferenceCalculator />
    </ToolPageLayout>
  )
}
