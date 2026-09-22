import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { UnitConverter } from '../../tools/UnitConverter/UnitConverter'
import { ALL_TOOLS } from '../../data/toolsData'

export const UnitConverterPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'unit-converter')!

  const howToUseSteps = [
    'Choose a measurement category from the top buttons: Length, Weight / Mass, Temperature, Area, Volume, Time, or Digital Storage.',
    'Select your source unit in the "From" dropdown, and your target unit in the "To" dropdown.',
    'Enter your number in the value input. Decimal numbers and scientific exponential representations are supported.',
    'The converted quantity updates immediately with exact precision and zero rounding lag.',
    'Click the swap button between the units to invert the conversion instantly.',
  ]

  const formulas = [
    {
      title: 'Linear Multiplier Conversion',
      formula: 'Result = Value × (From Ratio / To Ratio)',
      explanation: 'For proportional dimensions like length, weight, area, and digital storage, conversion scales through an international SI base unit.',
    },
    {
      title: 'Celsius to Fahrenheit',
      formula: '°F = (°C × 9/5) + 32',
      explanation: 'Multiplies Celsius temperature by 1.8 and shifts by the 32° freezing offset of the Fahrenheit scale.',
    },
    {
      title: 'Fahrenheit to Celsius',
      formula: '°C = (°F - 32) × 5/9',
      explanation: 'Reverses Fahrenheit temperature by subtracting 32 and scaling by 5/9.',
    },
    {
      title: 'Celsius to Kelvin',
      formula: 'K = °C + 273.15',
      explanation: 'Translates Celsius temperature to absolute thermodynamic scale where 0 K represents absolute zero.',
    },
  ]

  const examples = [
    {
      title: 'Distance Measurement (Kilometer to Mile)',
      description: 'Converting Indian highway distance (100 km) to international imperial miles.',
      input: '100 km → mi',
      output: '62.13711922 mi',
    },
    {
      title: 'Cooking & Baking (Pounds to Kilograms)',
      description: 'Converting recipe cake weight from imperial pounds to metric grams.',
      input: '5 lb → kg',
      output: '2.26796185 kg',
    },
    {
      title: 'Body Temperature (Celsius to Fahrenheit)',
      description: 'Checking normal human oral temperature (37°C) on a clinical Fahrenheit thermometer.',
      input: '37 °C → °F',
      output: '98.6 °F',
    },
    {
      title: 'Broadband Data Cap (Gigabytes to Megabytes)',
      description: 'Calculating how many MB are in a 50 GB mobile 5G recharge.',
      input: '50 GB → MB',
      output: '51,200 MB',
    },
  ]

  const faqs = [
    {
      question: 'Why does temperature conversion require a formula instead of a ratio?',
      answer: 'Unlike length or mass, temperature scales do not share a common zero point. Water freezes at 0°C but 32°F, meaning temperature conversion requires both a multiplicative scaling factor (9/5 or 5/9) and an additive baseline shift (±32).',
    },
    {
      question: 'Are digital storage conversions based on 1024 or 1000?',
      answer: 'This utility adheres to standard binary computer memory conventions where 1 KB = 1,024 Bytes, 1 MB = 1,024 KB, and 1 GB = 1,024 MB.',
    },
    {
      question: 'How many decimal places are displayed?',
      answer: 'Our converter displays accurate figures up to 8 decimal places and strips unnecessary trailing zeroes to keep results clean and easily legible.',
    },
    {
      question: 'Can I convert units offline?',
      answer: 'Yes! All unit conversion tables and logic operate directly in your web browser. Once loaded, no internet request is needed.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Unit Converter — Convert Length, Weight, Area & Temperature | SmartTools India"
      seoDescription="Convert units across length, weight, area, temperature, volume, and digital storage instantly. Free online metric and imperial unit converter."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['percentage-calculator', 'discount-calculator', 'word-counter']}
    >
      <UnitConverter />
    </ToolPageLayout>
  )
}
