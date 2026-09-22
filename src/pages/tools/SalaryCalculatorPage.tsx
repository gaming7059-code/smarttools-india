import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { SalaryCalculator } from '../../tools/SalaryCalculator/SalaryCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const SalaryCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'salary-calculator')!

  const howToUseSteps = [
    'Enter your annual Cost to Company (CTC) package in Indian Rupees (₹) or click a preset button (e.g. ₹3 LPA, ₹6 LPA, ₹12 LPA).',
    'Review the standard Indian salary proportions: Basic Salary (typically 40%–50% of CTC) and House Rent Allowance (typically 40%–50% of Basic).',
    'Enter any monthly special allowances or additional benefits provided by your employer.',
    'Confirm statutory deduction rates: Employee Provident Fund (EPF is 12% of basic) and monthly Professional Tax (usually ₹200).',
    'Review your estimated monthly take-home salary and annual in-hand income breakdown table.',
    'Click "Reset" to compare different job offers or compensation structures.',
  ]

  const formulas = [
    {
      title: 'Basic Salary & HRA Distribution',
      formula: 'Basic Salary = CTC × (Basic % / 100)\nHRA = Basic Salary × (HRA % / 100)',
      explanation: 'In India, Basic salary constitutes the foundation for calculating retirement benefits like EPF and gratuity.',
    },
    {
      title: 'Gross Salary Formula',
      formula: 'Monthly Gross = Monthly Basic + Monthly HRA + Monthly Other Allowances',
      explanation: 'Total earnings credited before statutory deductions or payroll contributions are subtracted.',
    },
    {
      title: 'Employee Provident Fund (EPF)',
      formula: 'Employee PF = Monthly Basic × 12%',
      explanation: 'Mandatory retirement savings contribution deducted from the employee wages under the EPFO scheme.',
    },
    {
      title: 'Estimated In-Hand Take-Home Pay',
      formula: 'Take-Home Pay = Monthly Gross - (Employee PF + Professional Tax)',
      explanation: 'The actual liquid cash deposited into your salary bank account each month.',
    },
  ]

  const examples = [
    {
      title: '₹6 LPA Junior Software Engineer Offer',
      description: 'Standard fresh hire IT package with 50% Basic, 50% HRA, ₹5,000 monthly allowances, 12% PF, and ₹200 PT.',
      input: 'CTC = ₹6,00,000 / year (₹50,000 / month gross CTC)',
      output: 'Estimated Take-Home: ₹39,500 / month (Annual: ₹4,74,000)',
    },
    {
      title: '₹12 LPA Mid-Level Specialist Offer',
      description: 'Senior engineer package with 40% Basic, 50% HRA, ₹10,000 other allowances, 12% PF, and ₹200 PT.',
      input: 'CTC = ₹12,00,000 / year',
      output: 'Estimated Take-Home: ₹65,000 / month (Annual: ₹7,80,000)',
    },
    {
      title: '₹3 LPA Entry Level Associate Offer',
      description: 'Starter salary package with 50% Basic, 40% HRA, ₹2,000 allowances, 12% PF, and ₹200 PT.',
      input: 'CTC = ₹3,00,000 / year',
      output: 'Estimated Take-Home: ₹18,000 / month (Annual: ₹2,16,000)',
    },
  ]

  const faqs = [
    {
      question: 'Why is take-home pay lower than CTC divided by 12?',
      answer: 'CTC (Cost to Company) includes both employer expenses (Employer PF contribution, gratuity, health insurance, bonuses) and employee deductions (Employee PF, Professional Tax). In-hand take-home pay only reflects the net liquid salary transferred to your bank account after all deductions.',
    },
    {
      question: 'Is Income Tax (TDS) deducted in this calculator?',
      answer: 'This utility provides an estimated structural breakdown of your gross salary and statutory deductions (EPF and Professional Tax). Actual income tax TDS depends on your chosen tax regime (New vs Old), Section 80C deductions, and individual tax slabs.',
    },
    {
      question: 'What is the standard Professional Tax in Indian states?',
      answer: 'Professional tax is a state-level tax levied on salaried individuals in states like Maharashtra, Karnataka, Telangana, Tamil Nadu, and West Bengal. It is typically capped at ₹200 per month (₹2,400 to ₹2,500 annually).',
    },
    {
      question: 'Can I customize the PF percentage?',
      answer: 'Yes, while the standard statutory EPF deduction is 12% of basic salary, you can adjust the percentage if your employer operates under special wage ceilings or opt-out schemes.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Salary Calculator — In-Hand Take-Home Pay from CTC | SmartTools India"
      seoDescription="Calculate your estimated monthly in-hand take-home salary from your annual CTC package with EPF, HRA, and tax deductions. Free online salary calculator."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['emi-calculator', 'gst-calculator', 'percentage-calculator']}
    >
      <SalaryCalculator />
    </ToolPageLayout>
  )
}
