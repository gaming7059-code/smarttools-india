import React from 'react'
import type { GameId } from './types'

export interface GameIconProps {
  gameId: GameId
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  withContainer?: boolean
  containerClassName?: string
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
}

const CONTAINER_SIZE_MAP = {
  xs: 'w-6 h-6 rounded-md',
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-12 h-12 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
  xl: 'w-20 h-20 rounded-3xl',
}

const CONTAINER_BG_MAP: Record<GameId, string> = {
  'tic-tac-toe': 'bg-gradient-to-tr from-blue-500/15 via-indigo-500/15 to-blue-600/25 border-blue-200/80 dark:border-blue-800/80 text-blue-600 dark:text-blue-400',
  snake: 'bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-emerald-600/25 border-emerald-200/80 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400',
  'memory-match': 'bg-gradient-to-tr from-purple-500/15 via-pink-500/15 to-purple-600/25 border-purple-200/80 dark:border-purple-800/80 text-purple-600 dark:text-purple-400',
  'rock-paper-scissors': 'bg-gradient-to-tr from-amber-500/15 via-orange-500/15 to-amber-600/25 border-amber-200/80 dark:border-amber-800/80 text-amber-600 dark:text-amber-400',
  'number-guess': 'bg-gradient-to-tr from-rose-500/15 via-red-500/15 to-rose-600/25 border-rose-200/80 dark:border-rose-800/80 text-rose-600 dark:text-rose-400',
}

/**
 * 1. Tic-Tac-Toe: Elegant Grid with glowing X and O symbols
 */
const TicTacToeIconSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="ttt-grid-grad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="ttt-x-grad" x1="10" y1="10" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#60a5fa" />
        <stop offset="1" stopColor="#3b82f6" />
      </linearGradient>
      <linearGradient id="ttt-o-grad" x1="26" y1="26" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#4f46e5" />
      </linearGradient>
      <filter id="ttt-glow" x="6" y="6" width="36" height="36" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Background Grid Lines with rounded caps */}
    <g stroke="url(#ttt-grid-grad)" strokeWidth="2.75" strokeLinecap="round" opacity="0.6">
      {/* Vertical Grid Lines */}
      <line x1="20" y1="9" x2="20" y2="39" />
      <line x1="28" y1="9" x2="28" y2="39" />
      {/* Horizontal Grid Lines */}
      <line x1="9" y1="20" x2="39" y2="20" />
      <line x1="9" y1="28" x2="39" y2="28" />
    </g>

    {/* Top-Left X Symbol */}
    <g stroke="url(#ttt-x-grad)" strokeWidth="3" strokeLinecap="round" filter="url(#ttt-glow)">
      <line x1="12" y1="12" x2="17" y2="17" />
      <line x1="17" y1="12" x2="12" y2="17" />
    </g>

    {/* Center O Symbol */}
    <circle
      cx="24"
      cy="24"
      r="2.5"
      stroke="url(#ttt-o-grad)"
      strokeWidth="2.5"
      fill="none"
      opacity="0.9"
    />

    {/* Bottom-Right O Symbol */}
    <circle
      cx="33.5"
      cy="33.5"
      r="3.5"
      stroke="url(#ttt-o-grad)"
      strokeWidth="2.75"
      fill="none"
      filter="url(#ttt-glow)"
    />

    {/* Top-Right Mini X Accent */}
    <g stroke="url(#ttt-x-grad)" strokeWidth="2.25" strokeLinecap="round" opacity="0.8">
      <line x1="31" y1="13" x2="35" y2="17" />
      <line x1="35" y1="13" x2="31" y2="17" />
    </g>
  </svg>
)

/**
 * 2. Snake: Sleek retro-arcade vector snake with glowing apple pellet
 */
const SnakeIconSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="snake-body-grad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="0.5" stopColor="#14b8a6" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="snake-food-grad" x1="32" y1="10" x2="40" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
      <filter id="snake-glow" x="6" y="6" width="36" height="36" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Sleek S-Coil Snake Body Path */}
    <path
      d="M12 34C12 36.2091 13.7909 38 16 38H20C24.4183 38 28 34.4183 28 30V24C28 20.6863 25.3137 18 22 18H18C14.6863 18 12 15.3137 12 12C12 8.68629 14.6863 6 18 6H28C32.4183 6 36 9.58172 36 14V22"
      stroke="url(#snake-body-grad)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#snake-glow)"
    />

    {/* Snake Head Crown */}
    <circle cx="36" cy="22" r="3.25" fill="#10b981" />
    <circle cx="37" cy="21" r="1" fill="#ffffff" />

    {/* Arcade Food Pellet (Apple) with Stem */}
    <circle cx="36" cy="34" r="3.75" fill="url(#snake-food-grad)" />
    <path d="M36 30.5C36 29 37.5 28 38.5 28.5" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="35" cy="33" r="1" fill="#ffffff" opacity="0.75" />

    {/* Tail accent dot */}
    <circle cx="12" cy="34" r="1.5" fill="#047857" />
  </svg>
)

/**
 * 3. Memory Match: Overlapping cards with glowing star emblem
 */
const MemoryMatchIconSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="card-back-grad" x1="10" y1="10" x2="30" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" />
        <stop offset="1" stopColor="#7e22ce" />
      </linearGradient>
      <linearGradient id="card-front-grad" x1="18" y1="14" x2="38" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ec4899" />
        <stop offset="1" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id="star-glow-grad" x1="26" y1="24" x2="32" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
      <filter id="card-shadow" x="6" y="8" width="36" height="36" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Back Card (Tilted Left -12deg) */}
    <g transform="rotate(-12 19 22)">
      <rect
        x="9"
        y="10"
        width="20"
        height="26"
        rx="4.5"
        fill="url(#card-back-grad)"
        stroke="#c084fc"
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Back Pattern lines */}
      <circle cx="19" cy="23" r="4.5" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    </g>

    {/* Front Card (Tilted Right +8deg with crisp drop shadow) */}
    <g transform="rotate(8 29 27)" filter="url(#card-shadow)">
      <rect
        x="19"
        y="13"
        width="21"
        height="27"
        rx="4.5"
        fill="url(#card-front-grad)"
        stroke="#f472b6"
        strokeWidth="1.75"
      />

      {/* Radiant Diamond / 4-Point Star Emblem */}
      <path
        d="M29.5 19.5C29.5 23.5 27 26 23.5 26.5C27 27 29.5 29.5 29.5 33.5C29.5 29.5 32 27 35.5 26.5C32 26 29.5 23.5 29.5 19.5Z"
        fill="url(#star-glow-grad)"
      />
      <circle cx="29.5" cy="26.5" r="1.2" fill="#ffffff" />
    </g>
  </svg>
)

/**
 * 4. Rock Paper Scissors: Clean hand-gesture & duel showdown crest
 */
const RockPaperScissorsIconSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="rps-left-grad" x1="8" y1="12" x2="24" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="rps-right-grad" x1="24" y1="12" x2="40" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f97316" />
        <stop offset="1" stopColor="#ef4444" />
      </linearGradient>
      <linearGradient id="rps-spark-grad" x1="22" y1="20" x2="26" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="1" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Left Side: Modern Vector Fist (Rock) */}
    <g fill="url(#rps-left-grad)" stroke="#d97706" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M10 26C10 21.5817 13.5817 18 18 18H20C21.1046 18 22 18.8954 22 20V26C22 29.3137 19.3137 32 16 32H14C11.7909 32 10 30.2091 10 28V26Z" />
      {/* Knuckle definition segments */}
      <path d="M14 18V22M17 18V23M20 18V23" stroke="#fef3c7" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Right Side: Modern Vector Shears / V-Sign (Scissors) */}
    <g stroke="url(#rps-right-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Blade 1 */}
      <line x1="38" y1="14" x2="27" y2="25" />
      {/* Blade 2 */}
      <line x1="38" y1="28" x2="27" y2="23" />
      {/* Scissors Pivot & Handle Loops */}
      <circle cx="27" cy="24" r="1.5" fill="#f97316" stroke="none" />
      <circle cx="39" cy="14" r="2.75" strokeWidth="1.75" />
      <circle cx="39" cy="29" r="2.75" strokeWidth="1.75" />
    </g>

    {/* Center Clash Star Burst */}
    <path
      d="M24 19L25.2 22.8L29 24L25.2 25.2L24 29L22.8 25.2L19 24L22.8 22.8L24 19Z"
      fill="url(#rps-spark-grad)"
    />
  </svg>
)

/**
 * 5. Number Guessing: Cascading number tiles with mystery symbol
 */
const NumberGuessIconSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="num-tile-back" x1="8" y1="12" x2="26" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fb7185" />
        <stop offset="1" stopColor="#e11d48" />
      </linearGradient>
      <linearGradient id="num-tile-front" x1="16" y1="14" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#be123c" />
      </linearGradient>
      <filter id="num-glow" x="6" y="8" width="36" height="36" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Back-Left Tile (Number 3) */}
    <rect
      x="8"
      y="11"
      width="18"
      height="20"
      rx="4"
      fill="url(#num-tile-back)"
      stroke="#fda4af"
      strokeWidth="1.25"
      opacity="0.75"
    />
    <text
      x="17"
      y="25"
      textAnchor="middle"
      fontSize="12"
      fontWeight="800"
      fontFamily="system-ui, sans-serif"
      fill="#ffffff"
      opacity="0.85"
    >
      3
    </text>

    {/* Back-Right Tile (Number 8) */}
    <rect
      x="22"
      y="9"
      width="18"
      height="20"
      rx="4"
      fill="url(#num-tile-back)"
      stroke="#fda4af"
      strokeWidth="1.25"
      opacity="0.6"
    />
    <text
      x="31"
      y="23"
      textAnchor="middle"
      fontSize="12"
      fontWeight="800"
      fontFamily="system-ui, sans-serif"
      fill="#ffffff"
      opacity="0.7"
    >
      8
    </text>

    {/* Prominent Center-Front Tile (Mystery ?) */}
    <g filter="url(#num-glow)">
      <rect
        x="15"
        y="17"
        width="21"
        height="23"
        rx="5"
        fill="url(#num-tile-front)"
        stroke="#ffe4e6"
        strokeWidth="1.75"
      />

      {/* High/Low Indicator Chevrons */}
      <path d="M25.5 13L27.5 15H23.5L25.5 13Z" fill="#f43f5e" />
      <path d="M25.5 44L23.5 42H27.5L25.5 44Z" fill="#f43f5e" />

      {/* Crisp Question Mark Symbol */}
      <text
        x="25.5"
        y="34"
        textAnchor="middle"
        fontSize="17"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
        fill="#ffffff"
      >
        ?
      </text>
    </g>
  </svg>
)

/**
 * Universal GameIcon component
 */
export const GameIcon: React.FC<GameIconProps> = ({
  gameId,
  size = 'md',
  className = '',
  withContainer = false,
  containerClassName = '',
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md

  const renderSvg = () => {
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToeIconSvg className={`${sizeClass} ${className}`} />
      case 'snake':
        return <SnakeIconSvg className={`${sizeClass} ${className}`} />
      case 'memory-match':
        return <MemoryMatchIconSvg className={`${sizeClass} ${className}`} />
      case 'rock-paper-scissors':
        return <RockPaperScissorsIconSvg className={`${sizeClass} ${className}`} />
      case 'number-guess':
        return <NumberGuessIconSvg className={`${sizeClass} ${className}`} />
      default:
        return null
    }
  }

  if (withContainer) {
    const containerSize = CONTAINER_SIZE_MAP[size] || CONTAINER_SIZE_MAP.md
    const containerBg = CONTAINER_BG_MAP[gameId] || ''
    return (
      <div
        className={`flex items-center justify-center shrink-0 border shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm ${containerSize} ${containerBg} ${containerClassName}`}
      >
        {renderSvg()}
      </div>
    )
  }

  return renderSvg()
}

export type GestureId = 'rock' | 'paper' | 'scissors'

export const GestureIcon: React.FC<{ gesture: GestureId; className?: string }> = ({
  gesture,
  className = 'w-10 h-10',
}) => {
  if (gesture === 'rock') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="gest-rock-g" x1="6" y1="8" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path
          d="M8 18C8 13.5 11.5 10 16 10H20C21.5 10 23 11 23 12.5C23 13 24 13.5 24.5 14C25.5 14.8 26 16 26 17.5V22C26 26.5 22.5 30 18 30H15C11 30 8 27 8 23V18Z"
          fill="url(#gest-rock-g)"
          stroke="#b45309"
          strokeWidth="1.5"
        />
        <path d="M13 10V16M17 10V17M21 11V17" stroke="#fef3c7" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M12 21H21" stroke="#9a3412" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    )
  }

  if (gesture === 'paper') {
    return (
      <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
        <defs>
          <linearGradient id="gest-paper-g" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <path
          d="M10 14V21C10 26 13.5 29 18 29H19C23.5 29 27 26 27 21V11C27 9.8 25.8 8.8 24.5 9.5C24 9.8 23.5 10.5 23.5 11.2V9.5C23.5 8.2 22.2 7.2 21 8C20.5 8.3 20 9 20 9.8V8.5C20 7.2 18.8 6.2 17.5 7C17 7.3 16.5 8 16.5 8.8V12C16.5 12 15 11 14 11.5C12.5 12.2 12 13.5 12.5 15L10 14Z"
          fill="url(#gest-paper-g)"
          stroke="#1e40af"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M16.5 14V22M20 15V22M23.5 16V22" stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gest-scis-g" x1="6" y1="4" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path
        d="M12 7C12 5.5 13.5 4.5 14.8 5.2C15.3 5.5 15.6 6.2 15.6 7V17.5M15.6 7C15.6 5.5 17 4.5 18.3 5.2C18.8 5.5 19.2 6.2 19.2 7V14M12 17C10 17 8 18.5 8 21C8 25.5 11.5 29 16 29H18C22.5 29 25 25.5 25 21V16C25 15 24 14 23 14C22 14 21 15 21 16V18"
        stroke="url(#gest-scis-g)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="22" r="1.5" fill="#059669" />
    </svg>
  )
}
