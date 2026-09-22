import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { PercentageCalculator } from '../../tools/PercentageCalculator/PercentageCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const PercentageCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'percentage-calculator')!

  const howToUseSteps = [
    'Select your desired calculation mode from the top tabs (e.g., What is X% of Y, or % Increase/Decrease).',
    'Enter your known numerical values into the labeled input boxes. Decimal numbers are fully supported.',
    'Review the instantaneous calculated result displayed in the result card below.',
    'Use the Reset button to clear all inputs and perform another calculation whenever needed.',
  ]

  const formulas = [
    {
      title: 'What is X% of Y?',
      formula: 'Result = (X / 100) × Y',
      explanation: 'Divide the percentage rate by 100 to convert it into a decimal fraction, then multiply by the total number.',
    },
    {
      title: 'X is what % of Y?',
      formula: 'Percentage = (X / Y) × 100',
      explanation: 'Divide the part value (X) by the whole total (Y), then multiply by 100 to express as a percentage.',
    },
    {
      title: 'Percentage Increase / Decrease',
      formula: 'Change % = ((New Value - Original) / Original) × 100',
      explanation: 'Compute the difference between the new and old values, divide by the original value, and multiply by 100.',
    },
    {
      title: 'Find Original Value (X% is Y)',
      formula: 'Original = Y / (X / 100)',
      explanation: 'Determine the 100% baseline by dividing the given value by its fractional percentage.',
    },
  ]

  const examples = [
    {
      title: 'Calculating GST / Tax Percentage',
      description: 'You want to find an 18% GST charge on a ₹5,000 product.',
      input: 'X = 18%, Y = 5,000',
      output: '₹900 GST amount',
    },
    {
      title: 'Academic Exam Score Percentage',
      description: 'A student scores 460 marks out of a total maximum of 600.',
      input: 'X = 460, Y = 600',
      output: '76.6667%',
    },
    {
      title: 'Annual Salary Increment',
      description: 'A monthly salary rises from ₹40,000 to ₹48,000.',
      input: 'Original = 40,000, New = 48,000',
      output: '+20% Increase',
    },
    {
      title: 'Reverse Discount Deduction',
      description: 'A discounted product saves you ₹300, which was 15% of the full price.',
      input: 'X = 15%, Y = 300',
      output: 'Original Price = ₹2,000',
    },
  ]

  const faqs = [
    {
      question: 'Can this percentage calculator handle decimal points?',
      answer: 'Yes! You can enter decimal percentages (such as 18.5%) and decimal totals (such as 1299.75) without any restrictions.',
    },
    {
      question: 'How do I calculate a negative percentage change?',
      answer: 'Use the "% Increase / Decrease" tab. When the new value is smaller than the original value, the calculator automatically displays a negative percentage change indicating a decrease.',
    },
    {
      question: 'Is any calculation data stored or sent to a server?',
      answer: 'No. All percentage calculations occur 100% locally within your web browser using client-side JavaScript. No data is stored, tracked, or transmitted.',
    },
    {
      question: 'What happens if I divide by zero?',
      answer: 'The calculator detects zero denominators (such as a total of 0 in "X is what % of Y") and safely displays a clear warning rather than displaying NaN or Infinity.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Percentage Calculator — Quick Percent, Ratio & Growth Math | SmartTools India"
      seoDescription="Calculate percentages, percentage increases, decreases, ratios, and original amounts quickly and accurately. Free browser calculator with step-by-step formulas."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['discount-calculator', 'profit-loss-calculator', 'salary-calculator']}
    >
      <PercentageCalculator />
    </ToolPageLayout>
  )
}
