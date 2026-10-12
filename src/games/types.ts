export type GameId = 'tic-tac-toe' | 'snake' | 'memory-match' | 'rock-paper-scissors' | 'number-guess'

export interface GameInfo {
  id: GameId
  title: string
  subtitle: string
  description: string
  category: 'Classic' | 'Arcade' | 'Puzzle' | 'Strategy' | 'Casual'
  emoji: string
  accentColor: string
  tag: string
  instructions: string[]
}

export const GAMES_LIST: GameInfo[] = [
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    subtitle: 'Classic X and O Strategy',
    description: 'Play the timeless grid game against smart AI or pass-and-play with a friend.',
    category: 'Classic',
    emoji: '❌⭕',
    accentColor: 'from-blue-500 to-indigo-600',
    tag: 'Popular',
    instructions: [
      'Take turns placing your mark (X or O) on an empty cell.',
      'Align three of your marks horizontally, vertically, or diagonally to win.',
      'Choose between single player (vs AI) or 2-player local mode.',
    ],
  },
  {
    id: 'snake',
    title: 'Snake Game',
    subtitle: 'Retro Arcade Classic',
    description: 'Control the hungry snake, eat apples and bonus stars, and grow without crashing.',
    category: 'Arcade',
    emoji: '🐍',
    accentColor: 'from-emerald-500 to-teal-600',
    tag: 'Arcade',
    instructions: [
      'Use Arrow keys, WASD, or on-screen D-Pad to change direction.',
      'Eat red apples to grow and score points. Catch bonus golden stars for extra score.',
      'Avoid running into the boundaries or biting your own tail.',
    ],
  },
  {
    id: 'memory-match',
    title: 'Memory Card Match',
    subtitle: 'Brain Training & Memory',
    description: 'Flip matching cards in pairs. Test your cognitive memory and beat your best time.',
    category: 'Puzzle',
    emoji: '🧠🃏',
    accentColor: 'from-purple-500 to-pink-600',
    tag: 'Brain',
    instructions: [
      'Tap any card to flip it over and reveal its icon.',
      'Tap a second card to find its matching twin.',
      'Matched pairs stay face-up. Match all cards in the fewest moves possible!',
    ],
  },
  {
    id: 'rock-paper-scissors',
    title: 'Rock Paper Scissors',
    subtitle: 'Hand Gestures Showdown',
    description: 'Play the fast-paced hand game against the computer. Best of 3 or endless mode.',
    category: 'Casual',
    emoji: '✊✋✌️',
    accentColor: 'from-amber-500 to-orange-600',
    tag: 'Fast',
    instructions: [
      'Choose Rock, Paper, or Scissors.',
      'Rock beats Scissors, Scissors beats Paper, and Paper beats Rock.',
      'Build your win streak or compete in Best-of-3 / Best-of-5 tournament matches.',
    ],
  },
  {
    id: 'number-guess',
    title: 'Number Guessing',
    subtitle: 'High-Low Mystery Game',
    description: 'Can you deduce the secret number? Use hot & cold feedback to solve it in limited attempts.',
    category: 'Strategy',
    emoji: '🔢🎯',
    accentColor: 'from-rose-500 to-red-600',
    tag: 'Logic',
    instructions: [
      'The computer picks a secret random number within your chosen range.',
      'Type your guess. You will receive hints: Too High, Too Low, or Boiling Hot!',
      'Deduce the secret number before running out of attempts.',
    ],
  },
]
