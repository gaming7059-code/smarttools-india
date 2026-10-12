import React from 'react'
import type { CategoryId } from '../../types/tools'

export interface CategoryIconProps {
  categoryId: CategoryId | string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

/**
 * 1. All Tools: Modular multi-tool grid / toolbox
 */
const AllToolsIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-all-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="9" height="9" rx="2.5" fill="url(#cat-all-g)" />
    <rect x="18" y="5" width="9" height="9" rx="2.5" fill="url(#cat-all-g)" opacity="0.8" />
    <rect x="5" y="18" width="9" height="9" rx="2.5" fill="url(#cat-all-g)" opacity="0.8" />
    <rect x="18" y="18" width="9" height="9" rx="2.5" fill="url(#cat-all-g)" />
    {/* Inner micro accents */}
    <circle cx="9.5" cy="9.5" r="1.5" fill="#ffffff" />
    <path d="M21 9.5H24" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 22.5H11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="22.5" cy="22.5" r="1.5" fill="#ffffff" />
  </svg>
)

/**
 * 2. Calculators: Sleek modern calculator with + - * = keys
 */
const CalculatorsIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-calc-g" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    <rect x="6" y="4" width="20" height="24" rx="4" fill="url(#cat-calc-g)" />
    {/* Display Screen */}
    <rect x="9" y="7" width="14" height="5" rx="1.5" fill="#064e3b" />
    <rect x="17" y="8.5" width="4" height="2" rx="0.5" fill="#6ee7b7" />
    {/* Keypad dots and operations */}
    <circle cx="11" cy="16" r="1.25" fill="#ffffff" />
    <circle cx="16" cy="16" r="1.25" fill="#ffffff" />
    <circle cx="21" cy="16" r="1.25" fill="#ffffff" />
    <circle cx="11" cy="20.5" r="1.25" fill="#ffffff" />
    <circle cx="16" cy="20.5" r="1.25" fill="#ffffff" />
    <circle cx="21" cy="20.5" r="1.25" fill="#ffffff" />
    {/* Equals key */}
    <rect x="10" y="24" width="12" height="1.5" rx="0.75" fill="#a7f3d0" />
  </svg>
)

/**
 * 3. Finance Tools: Indian Rupee coin and bank vault
 */
const FinanceIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-fin-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="12" fill="url(#cat-fin-g)" />
    <circle cx="16" cy="16" r="9.5" stroke="#fef3c7" strokeWidth="1" strokeDasharray="1.5 1.5" />
    {/* Indian Rupee Symbol ₹ */}
    <path
      d="M12 11H20M12 14H18.5M15 14C17.5 14 18.5 13 18.5 11.5M12 11V18L18.5 22"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * 4. Math Tools: Arithmetic symbols & Sigma
 */
const MathIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-math-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="22" rx="5" fill="url(#cat-math-g)" />
    {/* Plus */}
    <path d="M10 11H14M12 9V13" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" />
    {/* Minus */}
    <path d="M18 11H22" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" />
    {/* Multiply */}
    <path d="M10 19L14 23M14 19L10 23" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" />
    {/* Equals */}
    <path d="M18 20H22M18 22.5H22" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
)

/**
 * 5. Converters: Dynamic bidirectional exchange arrows
 */
const ConvertersIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-conv-g" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06b6d4" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="12" fill="url(#cat-conv-g)" />
    {/* Upper arrow pointing right */}
    <path
      d="M10 13H21M21 13L17.5 9.5M21 13L17.5 16.5"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Lower arrow pointing left */}
    <path
      d="M22 19H11M11 19L14.5 15.5M11 19L14.5 22.5"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/**
 * 6. Date & Time Tools: Calendar milestone with clock
 */
const DateTimeIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-dt-g" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Calendar Body */}
    <rect x="5" y="6" width="22" height="21" rx="4" fill="url(#cat-dt-g)" />
    <path d="M5 12H27" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
    <path d="M10 4V8M22 4V8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    {/* Mini Clock Badge */}
    <circle cx="18" cy="18.5" r="5" fill="#ffffff" />
    <path d="M18 16V18.5L20 20" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * 7. Education Tools: Graduation cap with academic book
 */
const EducationIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-edu-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#6d28d9" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="22" rx="5" fill="url(#cat-edu-g)" />
    {/* Mortarboard / Graduation Cap */}
    <path
      d="M16 9L8 13.5L16 18L24 13.5L16 9Z"
      fill="#ffffff"
    />
    <path
      d="M11 15.5V19.5C11 21.5 13.2 23 16 23C18.8 23 21 21.5 21 19.5V15.5"
      stroke="#ffffff"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <path d="M24 13.5V19" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * 8. Creator Tools: Media slate & digital creation wand
 */
const CreatorToolsIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-creator-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ec4899" />
        <stop offset="1" stopColor="#be185d" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="22" rx="5" fill="url(#cat-creator-g)" />
    {/* Content Quill / Pencil and Star Sparkle */}
    <path
      d="M18.5 9.5L22.5 13.5L13 23H9V19L18.5 9.5Z"
      stroke="#ffffff"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <circle cx="11.5" cy="11.5" r="1.5" fill="#fef08a" />
    <path d="M19 19L21 21M22 17L23 18" stroke="#fbcfe8" strokeWidth="1.25" strokeLinecap="round" />
  </svg>
)

/**
 * 9. SEO Tools: Search radar with keyword analytics
 */
const SEOToolsIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-seo-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#0f766e" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="22" rx="5" fill="url(#cat-seo-g)" />
    {/* Search Lens */}
    <circle cx="14" cy="14" r="5.5" stroke="#ffffff" strokeWidth="2" />
    <path d="M18 18L23 23" stroke="#ffffff" strokeWidth="2.25" strokeLinecap="round" />
    {/* Bar chart inside lens */}
    <path d="M11.5 15.5V14M14 15.5V12M16.5 15.5V10.5" stroke="#99f6e4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * 10. PDF Tools: PDF document badge with vector annotate pen
 */
const PDFToolsIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-pdf-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ef4444" />
        <stop offset="1" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    {/* Document sheet */}
    <path
      d="M7 6C7 4.89543 7.89543 4 9 4H18L25 11V26C25 27.1046 24.1046 28 23 28H9C7.89543 28 7 27.1046 7 26V6Z"
      fill="url(#cat-pdf-g)"
    />
    <path d="M18 4V11H25" fill="#fca5a5" opacity="0.6" />
    {/* "PDF" Text Badge */}
    <text
      x="16"
      y="21"
      textAnchor="middle"
      fontSize="7.5"
      fontWeight="900"
      fontFamily="system-ui, sans-serif"
      fill="#ffffff"
      letterSpacing="0.5"
    >
      PDF
    </text>
  </svg>
)

/**
 * 11. Games: Modern arcade controller / gamepad
 */
const GamesCategoryIconSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="cat-game-g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <rect x="5" y="5" width="22" height="22" rx="5" fill="url(#cat-game-g)" />
    {/* Gamepad shape */}
    <path
      d="M9 14C9 12.5 10.5 11 12.5 11H19.5C21.5 11 23 12.5 23 14V17C23 19.5 21 21 19 20L17 18H15L13 20C11 21 9 19.5 9 17V14Z"
      fill="#ffffff"
    />
    {/* D-Pad cross */}
    <path d="M12 14.5V16.5M11 15.5H13" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round" />
    {/* Action buttons */}
    <circle cx="19" cy="14.5" r="0.8" fill="#ec4899" />
    <circle cx="20.5" cy="16" r="0.8" fill="#3b82f6" />
  </svg>
)

/**
 * Universal CategoryIcon Component
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryId,
  className = '',
  size = 'md',
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md
  const combinedClass = `${sizeClass} ${className}`.trim()

  switch (categoryId) {
    case 'all':
    case 'all-tools':
      return <AllToolsIconSvg className={combinedClass} />
    case 'calculators':
      return <CalculatorsIconSvg className={combinedClass} />
    case 'finance':
      return <FinanceIconSvg className={combinedClass} />
    case 'math':
      return <MathIconSvg className={combinedClass} />
    case 'converters':
      return <ConvertersIconSvg className={combinedClass} />
    case 'date-time':
      return <DateTimeIconSvg className={combinedClass} />
    case 'education':
      return <EducationIconSvg className={combinedClass} />
    case 'creator-tools':
      return <CreatorToolsIconSvg className={combinedClass} />
    case 'seo-tools':
      return <SEOToolsIconSvg className={combinedClass} />
    case 'pdf-tools':
      return <PDFToolsIconSvg className={combinedClass} />
    case 'games':
      return <GamesCategoryIconSvg className={combinedClass} />
    default:
      return <AllToolsIconSvg className={combinedClass} />
  }
}
