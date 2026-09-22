import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { DiscountCalculator } from '../../tools/DiscountCalculator/DiscountCalculator'
import { ALL_TOOLS } from '../../data/toolsData'

export const DiscountCalculatorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'discount-calculator')!

  const howToUseSteps = [
    'Choose your preferred calculation mode: "Calculate Sale Price & Savings" if you know the discount percentage, or "Calculate Discount Percentage" if comparing two prices.',
    'Enter the original list price (MRP) in Indian Rupees (₹). Decimal amounts like ₹999.50 are fully supported.',
    'Enter either the discount percentage (e.g., 20%) or use the convenient quick discount preset buttons (10%, 20%, 50%, etc.).',
    'View your instantaneous savings amount and final payable price clearly highlighted.',
    'Click "Reset" to clear inputs for your next shopping comparison.',
  ]

  const formulas = [
    {
      title: 'Discount Amount',
      formula: 'Discount Amount = (Original Price × Discount %) / 100',
      explanation: 'Calculates the exact amount of money deducted from the retail price.',
    },
    {
      title: 'Final Discounted Price',
      formula: 'Final Price = Original Price - Discount Amount',
      explanation: 'The actual net price payable after the discount is subtracted.',
    },
    {
      title: 'Reverse Discount Percentage',
      formula: 'Discount % = ((Original Price - Sale Price) / Original Price) × 100',
      explanation: 'Determines what percentage of the original price you are saving when given the final checkout price.',
    },
    {
      title: 'Total Savings',
      formula: 'You Save = Original Price - Final Price',
      explanation: 'Total rupee amount remaining in your pocket after the promotional concession.',
    },
  ]

  const examples = [
    {
      title: 'Festival Sale Discount (Diwali / Big Billion Days)',
      description: 'Buying a smart television listed at ₹45,000 with an instant 15% discount.',
      input: 'Original = ₹45,000, Discount = 15%',
      output: 'You Save ₹6,750 • Final Price = ₹38,250',
    },
    {
      title: 'Apparel Clearance Sale',
      description: 'Branded denim jeans marked at ₹2,499 offered at 40% off.',
      input: 'Original = ₹2,499, Discount = 40%',
      output: 'You Save ₹999.60 • Final Price = ₹1,499.40',
    },
    {
      title: 'Finding the Discount Percentage',
      description: 'A bookstore sells a ₹800 textbook for ₹640.',
      input: 'Original = ₹800, Sale Price = ₹640',
      output: '20% Discount • You Save ₹160',
    },
  ]

  const faqs = [
    {
      question: 'How do stacked or double discounts work (e.g. 50% + 20% off)?',
      answer: 'Retailers usually apply the second discount to the already reduced price rather than adding them up directly. For instance, on a ₹1,000 item, 50% reduces it to ₹500, and an additional 20% off ₹500 takes off another ₹100, leaving a final price of ₹400 (which is an effective 60% discount, not 70%).',
    },
    {
      question: 'Can I enter paise and fractional rupee values?',
      answer: 'Yes. The calculator accepts any positive decimal amounts (e.g. ₹499.99) and formats the output properly using standard Indian Rupee currency rules.',
    },
    {
      question: 'Does this calculator include GST in the discount?',
      answer: 'Discounts in Indian retail are typically calculated on the MRP (which already includes GST) or on the base subtotal. You can calculate the discount first, and verify post-tax figures using our GST Calculator.',
    },
    {
      question: 'Are my prices or calculations saved anywhere?',
      answer: 'Never. All calculations run strictly in your web browser. No shopping cart data or prices are logged or transmitted.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Discount Calculator — Find Sale Price, Savings & Offers | SmartTools India"
      seoDescription="Calculate final sale prices, money saved, and shopping discounts instantly. Free online discount calculator with stacked festival offer support."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['percentage-calculator', 'profit-loss-calculator', 'gst-calculator']}
    >
      <DiscountCalculator />
    </ToolPageLayout>
  )
}
