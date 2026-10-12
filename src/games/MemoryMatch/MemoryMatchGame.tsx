import React, { useState, useEffect, useRef } from 'react'
import { RotateCcw, Trophy, Clock, Sparkles, Volume2, VolumeX, Star } from 'lucide-react'
import { gameAudio } from '../gameAudio'

type Difficulty = 'easy' | 'medium' | 'hard'

interface CardItem {
  id: number
  icon: string
  isFlipped: boolean
  isMatched: boolean
}

const ICONS_POOL = ['🦁', '🦚', '🏏', '🪷', '🍛', '🚀', '💎', '🎨', '⚡', '🌟', '🐘', '🥭']

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; gridCols: string; label: string }> = {
  easy: { pairs: 6, gridCols: 'grid-cols-3 sm:grid-cols-4', label: 'Easy (12 Cards)' },
  medium: { pairs: 8, gridCols: 'grid-cols-4', label: 'Medium (16 Cards)' },
  hard: { pairs: 10, gridCols: 'grid-cols-4 sm:grid-cols-5', label: 'Hard (20 Cards)' },
}

function createDeck(diff: Difficulty): CardItem[] {
  const config = DIFFICULTY_CONFIG[diff]
  const selectedIcons = ICONS_POOL.slice(0, config.pairs)
  const deckIcons = [...selectedIcons, ...selectedIcons]

  // Fisher-Yates shuffle
  for (let i = deckIcons.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deckIcons[i], deckIcons[j]] = [deckIcons[j], deckIcons[i]]
  }

  return deckIcons.map((icon, idx) => ({
    id: idx,
    icon,
    isFlipped: false,
    isMatched: false,
  }))
}

export const MemoryMatchGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [cards, setCards] = useState<CardItem[]>(() => createDeck('medium'))
  const [flippedIndices, setFlippedIndices] = useState<number[]>([])
  const [moves, setMoves] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())
  const [bestMoves, setBestMoves] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('smarttools_memory_best_moves')
      return saved ? parseInt(saved, 10) : null
    } catch {
      return null
    }
  })

  const isLockRef = useRef<boolean>(false)

  const handleDifficultyChange = (newDiff: Difficulty) => {
    gameAudio.playClick()
    setDifficulty(newDiff)
    setCards(createDeck(newDiff))
    setFlippedIndices([])
    setMoves(0)
    setTimerSeconds(0)
    setTimerActive(false)
    setIsCompleted(false)
    isLockRef.current = false
  }

  const restartCurrentGame = () => {
    gameAudio.playClick()
    setCards(createDeck(difficulty))
    setFlippedIndices([])
    setMoves(0)
    setTimerSeconds(0)
    setTimerActive(false)
    setIsCompleted(false)
    isLockRef.current = false
  }

  // Stopwatch timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (timerActive && !isCompleted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerActive, isCompleted])

  // Card click handler
  const handleCardClick = (index: number) => {
    if (isLockRef.current) return
    const clickedCard = cards[index]
    if (clickedCard.isFlipped || clickedCard.isMatched) return

    // Start timer on first move
    if (!timerActive) {
      setTimerActive(true)
    }

    gameAudio.playCardFlip()

    // Flip card
    const nextCards = cards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c))
    setCards(nextCards)

    const nextFlipped = [...flippedIndices, index]
    setFlippedIndices(nextFlipped)

    if (nextFlipped.length === 2) {
      setMoves((prev) => prev + 1)
      isLockRef.current = true

      const [firstIdx, secondIdx] = nextFlipped
      const firstCard = nextCards[firstIdx]
      const secondCard = nextCards[secondIdx]

      if (firstCard.icon === secondCard.icon) {
        // Match!
        setTimeout(() => {
          gameAudio.playEatFood()
          const matchedCards = nextCards.map((c, i) =>
            i === firstIdx || i === secondIdx ? { ...c, isMatched: true, isFlipped: true } : c
          )
          setCards(matchedCards)
          setFlippedIndices([])
          isLockRef.current = false

          // Check if all matched
          const allMatched = matchedCards.every((c) => c.isMatched)
          if (allMatched) {
            setIsCompleted(true)
            setTimerActive(false)
            gameAudio.playWin()

            setBestMoves((prev) => {
              const currentMoveCount = moves + 1
              if (prev === null || currentMoveCount < prev) {
                localStorage.setItem('smarttools_memory_best_moves', String(currentMoveCount))
                return currentMoveCount
              }
              return prev
            })
          }
        }, 400)
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          )
          setFlippedIndices([])
          isLockRef.current = false
        }, 900)
      }
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Calculate star rating
  const getStarRating = () => {
    const pairs = DIFFICULTY_CONFIG[difficulty].pairs
    if (moves <= pairs + 2) return 3
    if (moves <= pairs + 7) return 2
    return 1
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  const matchedCount = cards.filter((c) => c.isMatched).length / 2
  const totalPairs = DIFFICULTY_CONFIG[difficulty].pairs

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        {/* Difficulty Pill Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => handleDifficultyChange(diff)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                difficulty === diff
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40 p-3 text-center">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Moves</span>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{moves}</div>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3 text-center">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
            <Clock className="h-3 w-3" /> Time
          </span>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono">
            {formatTime(timerSeconds)}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 text-center">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pairs</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {matchedCount}/{totalPairs}
          </div>
        </div>
      </div>

      {/* Cards Arena */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-4 sm:p-6 shadow-md min-h-[340px] flex items-center justify-center">
        {isCompleted ? (
          <div className="w-full text-center py-6 space-y-4 animate-fade-in">
            <div className="flex justify-center gap-1">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 ${
                    star <= getStarRating()
                      ? 'text-amber-400 fill-amber-400 animate-bounce'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Outstanding Memory! 🎉
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
              Completed in <span className="font-bold text-purple-600 dark:text-purple-400">{moves} moves</span> and{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">{formatTime(timerSeconds)}</span>.
            </p>

            {bestMoves !== null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                <Trophy className="h-3.5 w-3.5" /> Best: {bestMoves} moves
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={restartCurrentGame}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-2.5 sm:gap-3 w-full max-w-lg ${DIFFICULTY_CONFIG[difficulty].gridCols}`}>
            {cards.map((card, idx) => {
              const isShowing = card.isFlipped || card.isMatched
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardClick(idx)}
                  disabled={card.isMatched || card.isFlipped}
                  aria-label={isShowing ? `Card ${card.icon}` : `Card ${idx + 1}`}
                  className={`relative aspect-square rounded-2xl flex items-center justify-center text-3xl sm:text-4xl select-none transition-all duration-300 shadow-2xs active:scale-95 ${
                    card.isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-400 dark:border-emerald-600 scale-[0.98] opacity-80'
                      : isShowing
                      ? 'bg-white dark:bg-slate-800 border-2 border-purple-400 dark:border-purple-500 shadow-md rotate-y-180'
                      : 'bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 cursor-pointer text-transparent border border-white/20 hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {isShowing ? (
                    <span className="animate-scale-in">{card.icon}</span>
                  ) : (
                    <span className="text-white/60 text-xl font-bold">?</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={restartCurrentGame}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restart Game
        </button>
        {bestMoves !== null && (
          <button
            type="button"
            onClick={() => {
              gameAudio.playClick()
              setBestMoves(null)
              localStorage.removeItem('smarttools_memory_best_moves')
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Reset Best
          </button>
        )}
      </div>
    </div>
  )
}
