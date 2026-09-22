/**
 * SmartTools India — Tools Module Registry
 * 
 * Individual calculator components will be implemented and registered here
 * in Step 2.
 */

export const REGISTERED_TOOL_MODULES = [
  'percentage-calculator',
  'age-calculator',
  'emi-calculator',
  'gst-calculator',
  'discount-calculator',
  'profit-and-loss-calculator',
  'salary-calculator',
  'date-difference-calculator',
  'unit-converter',
  'word-counter',
] as const

export type RegisteredToolId = typeof REGISTERED_TOOL_MODULES[number]
