import React, { useState, useRef } from 'react'
import { RotateCcw, Trophy, ArrowUp, ArrowDown, Volume2, VolumeX, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { gameAudio } from '../gameAudio'

type RangeMode = '1-50' | '1-100' | '1-200'

interface RangeConfig {
  min: number
  max: number
  maxAttempts: number
  label: string
}

const CONFIGS: Record<RangeMode, RangeConfig> = {
  '1-50': { min: 1, max: 50, maxAttempts: 8, label: '1 – 50 (8 Tries)' },
  '1-100': { min: 1, max: 100, maxAttempts: 7, label: '1 – 100 (7 Tries)' },
  '1-200': { min: 1, max: 200, maxAttempts: 7, label: '1 – 200 (7 Tries)' },
}

interface GuessRecord {
  guess: number
  feedback: 'too-high' | 'too-low' | 'correct'
  proximity: 'boiling' | 'warm' | 'cold' | 'freezing'
  diff: number
}

interface GuessStats {
  wins: number
  losses: number
  bestAttempts: number | null
}

function getRandomSecret(mode: RangeMode): number {
  const config = CONFIGS[mode]
  return Math.floor(Math.random() * (config.max - config.min + 1)) + config.min
}

export const NumberGuessGame: React.FC = () => {
  const [rangeMode, setRangeMode] = useState<RangeMode>('1-100')
  const [targetNumber, setTargetNumber] = useState<number>(() => getRandomSecret('1-100'))
  const [inputValue, setInputValue] = useState<string>('')
  const [history, setHistory] = useState<GuessRecord[]>([])
  const [minBound, setMinBound] = useState<number>(1)
  const [maxBound, setMaxBound] = useState<number>(100)
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [hasWon, setHasWon] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())
  const [errorMessage, setErrorMessage] = useState<string>('')

  const inputRef = useRef<HTMLInputElement | null>(null)

  const [stats, setStats] = useState<GuessStats>(() => {
    try {
      const saved = localStorage.getItem('smarttools_guess_stats')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return { wins: 0, losses: 0, bestAttempts: null }
  })

  const currentConfig = CONFIGS[rangeMode]

  const startNewRound = (mode: RangeMode = rangeMode) => {
    gameAudio.playClick()
    const config = CONFIGS[mode]
    setTargetNumber(getRandomSecret(mode))
    setInputValue('')
    setHistory([])
    setMinBound(config.min)
    setMaxBound(config.max)
    setIsGameOver(false)
    setHasWon(false)
    setErrorMessage('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleRangeChange = (mode: RangeMode) => {
    setRangeMode(mode)
    startNewRound(mode)
  }

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isGameOver) return

    const guessNum = parseInt(inputValue, 10)
    if (isNaN(guessNum)) {
      setErrorMessage(`Please enter a valid number between ${currentConfig.min} and ${currentConfig.max}.`)
      return
    }

    if (guessNum < currentConfig.min || guessNum > currentConfig.max) {
      setErrorMessage(`Number must be between ${currentConfig.min} and ${currentConfig.max}.`)
      return
    }

    setErrorMessage('')
    gameAudio.playClick()

    const diff = Math.abs(guessNum - targetNumber)
    let proximity: GuessRecord['proximity'] = 'freezing'
    if (diff <= 3) proximity = 'boiling'
    else if (diff <= 10) proximity = 'warm'
    else if (diff <= 25) proximity = 'cold'

    let feedback: GuessRecord['feedback'] = 'correct'
    if (guessNum > targetNumber) feedback = 'too-high'
    else if (guessNum < targetNumber) feedback = 'too-low'

    const newRecord: GuessRecord = {
      guess: guessNum,
      feedback,
      proximity,
      diff,
    }

    const updatedHistory = [newRecord, ...history]
    setHistory(updatedHistory)
    setInputValue('')

    // Update narrowing bounds
    if (guessNum < targetNumber && guessNum >= minBound) {
      setMinBound(guessNum + 1)
    } else if (guessNum > targetNumber && guessNum <= maxBound) {
      setMaxBound(guessNum - 1)
    }

    // Check Win
    if (feedback === 'correct') {
      setHasWon(true)
      setIsGameOver(true)
      gameAudio.playWin()

      setStats((prev) => {
        const attemptCount = updatedHistory.length
        const best = prev.bestAttempts === null ? attemptCount : Math.min(prev.bestAttempts, attemptCount)
        const next = { wins: prev.wins + 1, losses: prev.losses, bestAttempts: best }
        localStorage.setItem('smarttools_guess_stats', JSON.stringify(next))
        return next
      })
    } else if (updatedHistory.length >= currentConfig.maxAttempts) {
      // Out of attempts - Loss
      setIsGameOver(true)
      setHasWon(false)
      gameAudio.playGameOver()

      setStats((prev) => {
        const next = { ...prev, losses: prev.losses + 1 }
        localStorage.setItem('smarttools_guess_stats', JSON.stringify(next))
        return next
      })
    } else {
      gameAudio.playMove()
    }
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  const attemptsLeft = currentConfig.maxAttempts - history.length

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        {/* Range Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(Object.keys(CONFIGS) as RangeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleRangeChange(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                rangeMode === mode
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {mode}
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
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 p-3 text-center">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">Attempts Left</span>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {Math.max(0, attemptsLeft)} / {currentConfig.maxAttempts}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 text-center">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Wins</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.wins}</div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 p-3 text-center">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
            <Trophy className="h-3 w-3" /> Best Score
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.bestAttempts ? `${stats.bestAttempts} tries` : '—'}
          </div>
        </div>
      </div>

      {/* Main Interactive Arena */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-6 sm:p-8 shadow-md space-y-6">
        {/* Range Bounds Visualizer Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Range Boundary:</span>
            <span className="text-rose-600 dark:text-rose-400 font-mono text-sm">
              [{minBound} ─── {maxBound}]
            </span>
          </div>

          <div className="relative h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
              style={{
                left: `${((minBound - currentConfig.min) / (currentConfig.max - currentConfig.min)) * 100}%`,
                right: `${((currentConfig.max - maxBound) / (currentConfig.max - currentConfig.min)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Game Active Input or Game Result */}
        {isGameOver ? (
          <div className="text-center py-4 space-y-3 animate-fade-in">
            {hasWon ? (
              <>
                <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Bingo! You Guessed It! 🎉
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  The secret number was <strong className="text-emerald-600 dark:text-emerald-400 text-lg">{targetNumber}</strong>. Solved in{' '}
                  <strong>{history.length}</strong> attempts!
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex p-3 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  Out of Attempts!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  The mystery number was <strong className="text-slate-900 dark:text-white text-lg">{targetNumber}</strong>.
                </p>
              </>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => startNewRound(rangeMode)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuessSubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="number"
                min={currentConfig.min}
                max={currentConfig.max}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
                placeholder={`Guess between ${minBound} and ${maxBound}...`}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-lg font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <button
                type="submit"
                className="rounded-2xl bg-rose-600 hover:bg-rose-700 px-6 sm:px-8 py-3 font-bold text-white shadow-md shadow-rose-600/20 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                Submit
              </button>
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMessage}
              </p>
            )}

            {/* Quick Adjustment Shortcuts */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <span className="text-xs text-slate-400 mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => setInputValue(String(Math.floor((minBound + maxBound) / 2)))}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors"
              >
                Midpoint ({Math.floor((minBound + maxBound) / 2)})
              </button>
            </div>
          </form>
        )}

        {/* Latest Clue Indicator */}
        {history.length > 0 && !isGameOver && (
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Latest Clue:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {history[0].guess}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {history[0].feedback === 'too-high' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                  <ArrowDown className="h-3.5 w-3.5" /> Go Lower
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                  <ArrowUp className="h-3.5 w-3.5" /> Go Higher
                </span>
              )}

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  history[0].proximity === 'boiling'
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 animate-pulse'
                    : history[0].proximity === 'warm'
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {history[0].proximity === 'boiling'
                  ? '🌋 Boiling Hot!'
                  : history[0].proximity === 'warm'
                  ? '🔥 Warm'
                  : '❄️ Cold'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* History Feed */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Guess History ({history.length} {history.length === 1 ? 'try' : 'tries'})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {history.map((record, index) => {
              const attemptNum = history.length - index
              return (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <span className="font-medium text-slate-400">#{attemptNum}</span>
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {record.guess}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {record.feedback === 'too-high' && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center">
                        <ArrowDown className="h-3 w-3" /> Too High
                      </span>
                    )}
                    {record.feedback === 'too-low' && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center">
                        <ArrowUp className="h-3 w-3" /> Too Low
                      </span>
                    )}
                    {record.feedback === 'correct' && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Correct!
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reset Game & Stats */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => startNewRound(rangeMode)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Round
        </button>
        <button
          type="button"
          onClick={() => {
            gameAudio.playClick()
            const fresh = { wins: 0, losses: 0, bestAttempts: null }
            setStats(fresh)
            localStorage.setItem('smarttools_guess_stats', JSON.stringify(fresh))
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          Reset Score
        </button>
      </div>
    </div>
  )
}
