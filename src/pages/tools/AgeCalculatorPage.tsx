import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { AgeCalculator } from '../../tools/AgeCalculator/AgeCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const AgeCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'age-calculator')!

  const howToUseSteps = [
    'Select your Date of Birth using the calendar input picker or typing in YYYY-MM-DD format.',
    'By default, the calculator computes your age as of today. If you need your age on a specific future or past milestone date (e.g. for exam eligibility, passport or job forms), choose the "Age on Date" input.',
    'Your exact age is immediately calculated in years, months, and days.',
    'Explore the additional lifetime breakdown (total months, weeks, days, and hours) as well as the upcoming birthday tracker.',
    'Click "Reset Dates" to clear your entries anytime.',
  ]

  const formulas = [
    {
      title: 'Calendar Day & Month Borrowing',
      formula: 'Years = tYear - bYear; Months = tMonth - bMonth; Days = tDay - bDay',
      explanation: 'When target days are smaller than birth days, days from the previous month are borrowed according to the exact number of days in that calendar month.',
    },
    {
      title: 'Leap Year Compensation',
      formula: 'Leap Year = (Year % 4 === 0 && Year % 100 !== 0) || (Year % 400 === 0)',
      explanation: 'February counts 29 days in leap years and 28 days in non-leap years, ensuring that birthdays on February 29th calculate accurately.',
    },
    {
      title: 'Total Elapsed Days',
      formula: 'Total Days = (Target Timestamp - Birth Timestamp) / (86,400,000 ms)',
      explanation: 'Calculates the complete elapsed duration converted into standard 24-hour solar days.',
    },
    {
      title: 'Lifetime Breakdown Conversions',
      formula: 'Weeks = Total Days / 7; Hours = Total Days × 24',
      explanation: 'Converts elapsed duration into convenient units for applications, timelines, and life event tracking.',
    },
  ]

  const examples = [
    {
      title: 'Exam or Government Job Eligibility',
      description: 'Calculating age on August 1st for an Indian competitive examination (UPSC/SSC).',
      input: 'DOB = 15 Oct 1998, Target Date = 01 Aug 2026',
      output: '27 Years, 9 Months, 17 Days',
    },
    {
      title: 'Child Milestone Tracking',
      description: 'Checking an infant’s precise age for pediatric vaccinations.',
      input: 'DOB = 10 May 2025, Target Date = 22 Sep 2026',
      output: '1 Year, 4 Months, 12 Days',
    },
    {
      title: 'Born in a Leap Year',
      description: 'Person born on February 29th, 2000 calculating age in 2026.',
      input: 'DOB = 29 Feb 2000, Target Date = 22 Sep 2026',
      output: '26 Years, 6 Months, 24 Days',
    },
  ]

  const faqs = [
    {
      question: 'Why does age calculation require month length adjustments?',
      answer: 'Unlike simple 365-day divisions, Gregorian calendar months vary in length between 28, 29, 30, and 31 days. Our calculator respects individual month boundaries to give you the legally recognized calendar age.',
    },
    {
      question: 'What happens if I enter a birth date that is in the future?',
      answer: 'If you accidentally select a birth date that occurs after your target date, the calculator displays a clear validation message: "Please enter a valid date of birth."',
    },
    {
      question: 'Can I calculate my age on a past date?',
      answer: 'Yes! Simply modify the "Age on Date" field to any historical date after your birth date to see how old you were at that specific point in time.',
    },
    {
      question: 'Is my birth date recorded or shared?',
      answer: 'No. The calculation takes place purely in your local browser session. SmartTools India does not retain, track, or transmit your birth date.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Age Calculator — Calculate Exact Age in Years, Months & Days | SmartTools India"
      seoDescription="Find your exact age in years, months, days, and total hours instantly. Calculate age eligibility for exams and upcoming birthday countdowns accurately."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['date-difference-calculator', 'percentage-calculator', 'salary-calculator']}
    >
      <AgeCalculator />
    </ToolPageLayout>
  )
}
