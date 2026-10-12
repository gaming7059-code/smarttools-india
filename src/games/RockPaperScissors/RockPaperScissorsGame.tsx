import React, { useState } from 'react'
import { RotateCcw, Trophy, Flame, Volume2, VolumeX, Award } from 'lucide-react'
import { gameAudio } from '../gameAudio'
import { GestureIcon } from '../GameIcon'

type Choice = 'rock' | 'paper' | 'scissors'
type MatchMode = 'endless' | 'bo3' | 'bo5'
type Result = 'win' | 'lose' | 'draw'

interface RPSOption {
  id: Choice
  name: string
  emoji: string
  beats: Choice
  color: string
}

const CHOICES: RPSOption[] = [
  { id: 'rock', name: 'Rock', emoji: '✊', beats: 'scissors', color: 'from-amber-500 to-orange-600' },
  { id: 'paper', name: 'Paper', emoji: '✋', beats: 'rock', color: 'from-blue-500 to-indigo-600' },
  { id: 'scissors', name: 'Scissors', emoji: '✌️', beats: 'paper', color: 'from-emerald-500 to-teal-600' },
]

export const RockPaperScissorsGame: React.FC = () => {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null)
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null)
  const [roundResult, setRoundResult] = useState<Result | null>(null)
  const [isShaking, setIsShaking] = useState<boolean>(false)
  const [mode, setMode] = useState<MatchMode>('endless')
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())

  // Tournament / Match scores
  const [playerScore, setPlayerScore] = useState<number>(0)
  const [computerScore, setComputerScore] = useState<number>(0)
  const [draws, setDraws] = useState<number>(0)
  const [currentStreak, setCurrentStreak] = useState<number>(0)
  const [tournamentWinner, setTournamentWinner] = useState<'player' | 'computer' | null>(null)

  // Best streak from localStorage
  const [bestStreak, setBestStreak] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('smarttools_rps_best_streak')
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  })

  const targetWins = mode === 'bo3' ? 2 : mode === 'bo5' ? 3 : Infinity

  // Play a round
  const handlePlayerChoose = (choice: Choice) => {
    if (isShaking || tournamentWinner) return

    gameAudio.playClick()
    setIsShaking(true)
    setPlayerChoice(choice)
    setComputerChoice(null)
    setRoundResult(null)

    // Suspense countdown / shuffle animation (600ms)
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * CHOICES.length)
      const compPick = CHOICES[randomIdx].id
      setComputerChoice(compPick)
      setIsShaking(false)

      let res: Result = 'draw'
      if (choice === compPick) {
        res = 'draw'
        setDraws((d) => d + 1)
        setCurrentStreak(0)
        gameAudio.playMove()
      } else if (
        (choice === 'rock' && compPick === 'scissors') ||
        (choice === 'paper' && compPick === 'rock') ||
        (choice === 'scissors' && compPick === 'paper')
      ) {
        res = 'win'
        const nextScore = playerScore + 1
        const nextStreak = currentStreak + 1
        setPlayerScore(nextScore)
        setCurrentStreak(nextStreak)

        if (nextStreak > bestStreak) {
          setBestStreak(nextStreak)
          localStorage.setItem('smarttools_rps_best_streak', String(nextStreak))
        }

        if (mode !== 'endless' && nextScore >= targetWins) {
          setTournamentWinner('player')
          gameAudio.playWin()
        } else {
          gameAudio.playWin()
        }
      } else {
        res = 'lose'
        const nextComp = computerScore + 1
        setComputerScore(nextComp)
        setCurrentStreak(0)

        if (mode !== 'endless' && nextComp >= targetWins) {
          setTournamentWinner('computer')
          gameAudio.playGameOver()
        } else {
          gameAudio.playGameOver()
        }
      }

      setRoundResult(res)
    }, 600)
  }

  const resetMatch = () => {
    gameAudio.playClick()
    setPlayerChoice(null)
    setComputerChoice(null)
    setRoundResult(null)
    setPlayerScore(0)
    setComputerScore(0)
    setDraws(0)
    setCurrentStreak(0)
    setTournamentWinner(null)
    setIsShaking(false)
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        {/* Match Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('endless')
              resetMatch()
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'endless'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Endless
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('bo3')
              resetMatch()
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'bo3'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Best of 3
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('bo5')
              resetMatch()
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'bo5'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Best of 5
          </button>
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

      {/* Scoreboard */}
      <div className="grid grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-2.5 text-center">
          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">You</span>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">
            {playerScore}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-2.5 text-center">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Ties</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">{draws}</div>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 p-2.5 text-center">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">CPU</span>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-300">
            {computerScore}
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 p-2.5 text-center">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
            <Flame className="h-3 w-3" /> Streak
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">
            {currentStreak}
          </div>
        </div>
      </div>

      {/* Battle Arena Viewport */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 p-6 sm:p-8 shadow-md">
        {tournamentWinner ? (
          <div className="text-center py-6 space-y-4 animate-scale-in">
            <div className="inline-flex p-4 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-1">
              {tournamentWinner === 'player' ? <Trophy className="h-10 w-10 animate-bounce" /> : <Award className="h-10 w-10" />}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {tournamentWinner === 'player' ? 'Match Champion! 🏆' : 'Computer Wins the Match!'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Final score: You {playerScore} – {computerScore} Computer
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={resetMatch}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-4 w-4" />
                Play Next Tournament
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Duel Face-off Display */}
            <div className="flex items-center justify-around w-full max-w-sm my-4">
              {/* Player Side */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  You
                </span>
                <div
                  className={`h-24 w-24 sm:h-28 sm:w-28 rounded-2xl flex items-center justify-center p-3 border-2 transition-all duration-300 shadow-md ${
                    isShaking
                      ? 'animate-bounce border-blue-400 bg-blue-50 dark:bg-blue-950/50'
                      : roundResult === 'win'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 scale-105 shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {playerChoice ? (
                    <GestureIcon gesture={playerChoice} className="w-14 h-14" />
                  ) : (
                    <span className="text-3xl text-slate-300 dark:text-slate-600 font-bold">?</span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {playerChoice || 'Ready'}
                </span>
              </div>

              {/* VS Badge */}
              <div className="flex flex-col items-center px-2">
                <span className="text-xl font-black text-slate-400 dark:text-slate-600 italic">VS</span>
              </div>

              {/* Computer Side */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Computer
                </span>
                <div
                  className={`h-24 w-24 sm:h-28 sm:w-28 rounded-2xl flex items-center justify-center p-3 border-2 transition-all duration-300 shadow-md ${
                    isShaking
                      ? 'animate-bounce border-rose-400 bg-rose-50 dark:bg-rose-950/50'
                      : roundResult === 'lose'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 scale-105 shadow-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isShaking ? (
                    <span className="text-2xl animate-spin text-amber-500">⚡</span>
                  ) : computerChoice ? (
                    <GestureIcon gesture={computerChoice} className="w-14 h-14" />
                  ) : (
                    <span className="text-3xl text-slate-300 dark:text-slate-600 font-bold">?</span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {isShaking ? 'Choosing...' : computerChoice || 'Waiting'}
                </span>
              </div>
            </div>

            {/* Round Result Banner */}
            <div className="h-10 flex items-center justify-center mt-2">
              {isShaking ? (
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
                  Rock, Paper, Scissors, Shoot! 💥
                </span>
              ) : roundResult ? (
                <span
                  className={`text-base font-extrabold px-4 py-1 rounded-full shadow-2xs ${
                    roundResult === 'win'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : roundResult === 'lose'
                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {roundResult === 'win'
                    ? '🎉 You Win this round!'
                    : roundResult === 'lose'
                    ? '💥 Computer Wins this round!'
                    : '🤝 Both picked the same! It’s a Draw!'}
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Tap one of the gestures below to throw
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Choice Buttons */}
      <div className="grid grid-cols-3 gap-3">
        {CHOICES.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handlePlayerChoose(option.id)}
            disabled={isShaking || Boolean(tournamentWinner)}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all duration-200 active:scale-95 ${
              isShaking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="mb-2 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6 flex items-center justify-center">
              <GestureIcon gesture={option.id} className="w-12 h-12" />
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{option.name}</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Beats {option.beats}
            </span>
          </button>
        ))}
      </div>

      {/* Footer Info / Reset */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
        <div className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span>All-time Best Streak: <strong className="text-slate-700 dark:text-slate-200">{bestStreak}</strong></span>
        </div>
        <button
          type="button"
          onClick={resetMatch}
          className="hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="h-3 w-3" /> Reset Match
        </button>
      </div>
    </div>
  )
}
