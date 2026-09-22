import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { ProfitLossCalculator } from '../../tools/ProfitLossCalculator/ProfitLossCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const ProfitLossCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'profit-and-loss-calculator' || t.slug === 'profit-loss-calculator')!

  const howToUseSteps = [
    'Select your calculation goal: "Calculate Profit or Loss" if you already know both Cost Price and Selling Price, or "Find Selling Price for Target Profit %" if setting product retail prices.',
    'Enter your Cost Price (CP) in Indian Rupees (₹). Cost price must be greater than zero.',
    'Enter your Selling Price (SP) or your desired profit margin percentage.',
    'The calculator instantly displays the net profit or loss in Rupees, along with the accurate return percentage.',
    'Click "Reset" to clear and calculate figures for other inventory products or business deals.',
  ]

  const formulas = [
    {
      title: 'Net Profit Calculation (SP > CP)',
      formula: 'Profit = Selling Price - Cost Price\nProfit % = (Profit / Cost Price) × 100',
      explanation: 'When goods are sold above cost, profit is the surplus earned divided by original cost investment.',
    },
    {
      title: 'Net Loss Calculation (SP < CP)',
      formula: 'Loss = Cost Price - Selling Price\nLoss % = (Loss / Cost Price) × 100',
      explanation: 'When goods are sold at a discount below cost, loss represents the deficit relative to initial capital spent.',
    },
    {
      title: 'Target Selling Price Formula',
      formula: 'Selling Price = Cost Price × (1 + Desired Profit % / 100)',
      explanation: 'Calculates the necessary list price to guarantee your desired gross percentage return.',
    },
    {
      title: 'Break-Even Condition',
      formula: 'Selling Price = Cost Price (0% Gain/Loss)',
      explanation: 'When total revenues equal total expenditures, the business achieves break-even without profit or loss.',
    },
  ]

  const examples = [
    {
      title: 'Retail Shop Profit Margin',
      description: 'A kirana store owner purchases cooking oil for ₹850 and sells it for ₹1,020.',
      input: 'CP = ₹850, SP = ₹1,020',
      output: 'Profit: ₹170 (+20.00% Profit)',
    },
    {
      title: 'Stock Clearance Loss',
      description: 'Liquidating slow-moving winter apparel bought at ₹1,500 for ₹1,200.',
      input: 'CP = ₹1,500, SP = ₹1,200',
      output: 'Loss: ₹300 (-20.00% Loss)',
    },
    {
      title: 'Pricing a Handmade Craft for 35% Profit',
      description: 'An artisan spends ₹400 in raw material and wants a 35% profit margin.',
      input: 'CP = ₹400, Desired Profit = 35%',
      output: 'Target Selling Price: ₹540 (Profit: ₹140)',
    },
  ]

  const faqs = [
    {
      question: 'Is profit percentage calculated on Cost Price or Selling Price?',
      answer: 'In standard commercial mathematics and accounting, profit and loss percentages are always calculated relative to the Cost Price (CP) unless explicitly labeled as "Profit Margin on Revenue (SP)". This calculator computes standard CP-based return on investment.',
    },
    {
      question: 'What is the difference between markup and margin?',
      answer: 'Markup is the percentage added on top of the Cost Price (e.g. ₹100 cost + 25% markup = ₹125 selling price). Profit margin is the ratio of profit to the Selling Price (₹25 profit / ₹125 selling price = 20% margin).',
    },
    {
      question: 'Can I calculate negative profit / loss on bulk goods?',
      answer: 'Yes! Decimal numbers, high values, and distress sale prices are fully supported with instant red/green status highlights.',
    },
    {
      question: 'Are overhead expenses (shipping, packaging) included?',
      answer: 'To ensure accurate results, add all freight, packaging, and handling costs directly into your Cost Price (total landed cost) before entering it into the calculator.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Profit & Loss Calculator — Calculate Profit Margin, Loss & Markup | SmartTools India"
      seoDescription="Determine profit margin percentages, markup rates, and net gain or loss on goods sold. Free online calculator for Indian business owners and retailers."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['discount-calculator', 'gst-calculator', 'percentage-calculator']}
    >
      <ProfitLossCalculator />
    </ToolPageLayout>
  )
}
