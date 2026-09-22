import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { GSTCalculator } from '../../tools/GSTCalculator/GSTCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const GSTCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'gst-calculator')!

  const howToUseSteps = [
    'Select your calculation mode: choose "Add GST" to compute gross price from a net amount, or "Remove GST" to extract base price from a tax-inclusive MRP bill.',
    'Enter the numerical amount in Indian Rupees (₹). Decimal numbers like ₹1249.50 are supported.',
    'Click one of the standard Indian GST tax slab buttons (0%, 5%, 12%, 18%, 28%) or type a custom percentage.',
    'View the instantaneous final price and detailed breakdown showing Central GST (CGST) and State GST (SGST).',
    'Click "Reset" whenever you wish to clear and calculate a new bill or quotation.',
  ]

  const formulas = [
    {
      title: 'Adding GST (Exclusive Calculation)',
      formula: 'GST Amount = (Base Amount × GST Rate) / 100\nFinal Amount = Base Amount + GST Amount',
      explanation: 'Applies tax on top of the original subtotal to arrive at total invoice bill value.',
    },
    {
      title: 'Removing GST (Inclusive Reverse Calculation)',
      formula: 'Base Amount = Inclusive Amount / (1 + GST Rate / 100)\nGST Amount = Inclusive Amount - Base Amount',
      explanation: 'Separates out the embedded tax from an MRP or gross retail receipt to find pre-tax cost.',
    },
    {
      title: 'Intra-State CGST & SGST Split',
      formula: 'CGST = GST Amount / 2\nSGST = GST Amount / 2',
      explanation: 'For sales within the same Indian state or union territory, tax is divided equally between the Central and State Governments.',
    },
    {
      title: 'Inter-State IGST Calculation',
      formula: 'IGST = GST Amount (100%)',
      explanation: 'For goods or services transferred between two different Indian states, the full tax rate is collected as Integrated GST (IGST).',
    },
  ]

  const examples = [
    {
      title: 'Adding 18% GST on Freelance / Consulting Invoice',
      description: 'An IT professional billing a client ₹50,000 for web development services.',
      input: 'Base Amount = ₹50,000, GST Slab = 18%',
      output: 'GST: ₹9,000 (CGST: ₹4,500, SGST: ₹4,500) • Total Bill: ₹59,000',
    },
    {
      title: 'Removing 18% GST from an Electronics Bill',
      description: 'Buying a smartphone accessory in Mumbai with a printed MRP of ₹1,180.',
      input: 'Inclusive Price = ₹1,180, GST Slab = 18%',
      output: 'Base Price: ₹1,000 • GST Portion: ₹180',
    },
    {
      title: '5% GST on Restaurant Dining / Packaged Foods',
      description: 'A food invoice with a net subtotal of ₹2,400 subject to 5% restaurant GST.',
      input: 'Base Amount = ₹2,400, GST Slab = 5%',
      output: 'GST: ₹120 (CGST: ₹60, SGST: ₹60) • Total Bill: ₹2,520',
    },
  ]

  const faqs = [
    {
      question: 'What are the official GST tax slabs in India?',
      answer: 'India operates four primary standard GST slabs: 5% (essential commodities, packaged basic foods), 12% (processed food, appliances), 18% (most commercial services, industrial goods, IT), and 28% (luxury items, automobiles, aerated drinks). Basic agricultural goods fall under 0% exemption.',
    },
    {
      question: 'What is the difference between CGST, SGST, and IGST?',
      answer: 'CGST (Central GST) and SGST (State GST) apply when goods/services are supplied within the same state (intra-state transaction) and each receives exactly 50% of the total tax rate. IGST (Integrated GST) is charged when transaction crosses state borders (inter-state).',
    },
    {
      question: 'How do I calculate GST on discounted items?',
      answer: 'According to Indian GST laws, discount amounts must be deducted from the list price before calculating GST. Always enter the post-discount subtotal into this calculator to determine the legally compliant GST liability.',
    },
    {
      question: 'Are calculations saved or sent to any tax authority?',
      answer: 'Never. SmartTools India operates purely client-side. None of your business numbers, client invoice values, or tax estimates are stored or sent anywhere.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="GST Calculator — Calculate GST, CGST, SGST & Reverse Tax | SmartTools India"
      seoDescription="Add or remove GST with standard Indian tax slabs (5%, 12%, 18%, 28%). Calculate CGST, SGST, IGST breakdowns and reverse inclusive tax instantly."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['discount-calculator', 'profit-loss-calculator', 'percentage-calculator']}
    >
      <GSTCalculator />
    </ToolPageLayout>
  )
}
