import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { EMICalculator } from '../../tools/EMICalculator/EMICalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const EMICalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'emi-calculator')!

  const howToUseSteps = [
    'Enter the desired Loan Amount in Indian Rupees (₹) or use the preset quick buttons (₹5L, ₹10L, ₹25L, ₹50L, ₹1Cr).',
    'Input the annual interest rate quoted by your bank or financial institution (e.g. 8.5% for Home Loans, 10.5% for Car Loans).',
    'Specify the loan tenure in years or switch the toggle to enter exact duration in months.',
    'Review your monthly EMI, total interest payable, total repayment amount, and principal-vs-interest proportion bar.',
    'Use the Reset button to recalculate with different parameters as you compare bank loan offers.',
  ]

  const formulas = [
    {
      title: 'Monthly EMI Formula',
      formula: 'EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)',
      explanation: 'Where P is loan principal, r is monthly interest rate (Annual Rate / 12 / 100), and n is total monthly installments.',
    },
    {
      title: 'Zero Interest Loan (0% Scheme)',
      formula: 'EMI = P / n',
      explanation: 'When interest rate is 0%, the monthly installment is simply the principal divided by total tenure months.',
    },
    {
      title: 'Total Interest Payable',
      formula: 'Total Interest = (EMI × n) - P',
      explanation: 'Total cost of borrowing paid over the life of the loan exceeding the initial borrowed principal.',
    },
    {
      title: 'Total Payment Amount',
      formula: 'Total Payment = P + Total Interest',
      explanation: 'The complete sum paid to the lender across all monthly installment tenures.',
    },
  ]

  const examples = [
    {
      title: 'SBI Home Loan Example',
      description: 'A ₹30 Lakhs home loan at 8.75% annual interest for 20 years.',
      input: 'P = ₹30,00,000, Rate = 8.75%, Tenure = 20 Years',
      output: 'Monthly EMI: ₹26,511 • Total Interest: ₹33,62,710',
    },
    {
      title: 'HDFC Car Loan Example',
      description: 'A ₹8 Lakhs new car loan at 9.25% interest for 5 years.',
      input: 'P = ₹8,00,000, Rate = 9.25%, Tenure = 5 Years',
      output: 'Monthly EMI: ₹16,707 • Total Interest: ₹2,02,408',
    },
    {
      title: 'Personal Loan Example',
      description: 'A ₹2 Lakhs urgent personal loan at 13.5% interest for 2 years.',
      input: 'P = ₹2,00,000, Rate = 13.5%, Tenure = 2 Years (24 Months)',
      output: 'Monthly EMI: ₹9,557 • Total Interest: ₹29,376',
    },
  ]

  const faqs = [
    {
      question: 'What is an EMI?',
      answer: 'An Equated Monthly Installment (EMI) is a fixed payment amount made by a borrower to a lender at a specified date each calendar month. EMIs are applied to both interest and principal each month so that over a specified number of years, the loan is fully paid off.',
    },
    {
      question: 'Does increasing loan tenure reduce my EMI?',
      answer: 'Yes, a longer tenure spreads the principal repayment over more months, which reduces your monthly EMI amount. However, longer tenures result in substantially higher total interest paid over the life of the loan.',
    },
    {
      question: 'How do prepayments affect my loan EMI?',
      answer: 'Making partial prepayments reduces your outstanding loan principal balance. Borrowers can choose either to lower their remaining monthly EMI or shorten their loan repayment tenure.',
    },
    {
      question: 'Are there hidden charges included in this EMI calculator?',
      answer: 'No. This calculator computes pure mathematical interest and principal amortization. Bank loan processing fees, stamp duty, documentation charges, and loan insurance are levied separately by lenders.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="EMI Calculator — Calculate Home, Car & Personal Loan EMI | SmartTools India"
      seoDescription="Calculate equated monthly installments (EMI), total interest payable, and amortization splits for home, car, and personal loans in India accurately."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['salary-calculator', 'gst-calculator', 'profit-loss-calculator']}
    >
      <EMICalculator />
    </ToolPageLayout>
  )
}
