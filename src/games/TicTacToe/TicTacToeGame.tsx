import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Trophy, Users, Bot, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { gameAudio } from '../gameAudio'

type Player = 'X' | 'O'
type BoardState = (Player | null)[]
type GameMode = 'ai' | 'pvp'
type AIDifficulty = 'easy' | 'unbeatable'

interface TTTStats {
  xWins: number
  oWins: number
  draws: number
}

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function checkWinnerFn(currentBoard: BoardState): { winner: Player | 'draw'; combo: number[] | null } | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return { winner: currentBoard[a] as Player, combo }
    }
  }
  if (currentBoard.every((cell) => cell !== null)) {
    return { winner: 'draw', combo: null }
  }
  return null
}

function minimaxFn(newBoard: BoardState, depth: number, isMaximizing: boolean): number {
  const res = checkWinnerFn(newBoard)
  if (res) {
    if (res.winner === 'O') return 10 - depth
    if (res.winner === 'X') return depth - 10
    return 0
  }

  if (isMaximizing) {
    let maxScore = -Infinity
    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = 'O'
        const score = minimaxFn(newBoard, depth + 1, false)
        newBoard[i] = null
        maxScore = Math.max(score, maxScore)
      }
    }
    return maxScore
  } else {
    let minScore = Infinity
    for (let i = 0; i < 9; i++) {
      if (!newBoard[i]) {
        newBoard[i] = 'X'
        const score = minimaxFn(newBoard, depth + 1, true)
        newBoard[i] = null
        minScore = Math.min(score, minScore)
      }
    }
    return minScore
  }
}

function getAIMoveFn(currentBoard: BoardState, diff: AIDifficulty): number {
  const availableMoves: number[] = []
  currentBoard.forEach((cell, idx) => {
    if (cell === null) availableMoves.push(idx)
  })

  if (availableMoves.length === 0) return -1

  if (diff === 'easy') {
    const randomIdx = Math.floor(Math.random() * availableMoves.length)
    return availableMoves[randomIdx]
  }

  let bestScore = -Infinity
  let bestMove = availableMoves[0]

  for (const move of availableMoves) {
    currentBoard[move] = 'O'
    const score = minimaxFn(currentBoard, 0, false)
    currentBoard[move] = null
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}

export const TicTacToeGame: React.FC = () => {
  const [board, setBoard] = useState<BoardState>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState<boolean>(true)
  const [mode, setMode] = useState<GameMode>('ai')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('unbeatable')
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null)
  const [winner, setWinner] = useState<Player | 'draw' | null>(null)
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())
  const [stats, setStats] = useState<TTTStats>(() => {
    try {
      const saved = localStorage.getItem('smarttools_ttt_stats')
      if (saved) return JSON.parse(saved)
    } catch {
      // fallback
    }
    return { xWins: 0, oWins: 0, draws: 0 }
  })

  const handleCellClick = useCallback((index: number, isAITurn: boolean = false) => {
    if (board[index] || winner) return
    if (mode === 'ai' && !isXNext && !isAITurn) return

    const newBoard = [...board]
    const currentMark: Player = isXNext ? 'X' : 'O'
    newBoard[index] = currentMark
    setBoard(newBoard)

    gameAudio.playMove()

    const result = checkWinnerFn(newBoard)
    if (result) {
      setWinner(result.winner)
      setWinningCombo(result.combo)
      
      setStats((prev) => {
        const next = {
          xWins: result.winner === 'X' ? prev.xWins + 1 : prev.xWins,
          oWins: result.winner === 'O' ? prev.oWins + 1 : prev.oWins,
          draws: result.winner === 'draw' ? prev.draws + 1 : prev.draws,
        }
        localStorage.setItem('smarttools_ttt_stats', JSON.stringify(next))
        return next
      })

      if (result.winner === 'X' || (mode === 'pvp' && result.winner === 'O')) {
        gameAudio.playWin()
      } else {
        gameAudio.playGameOver()
      }
    } else {
      setIsXNext((prev) => !prev)
    }
  }, [board, winner, mode, isXNext])

  // AI turn trigger
  useEffect(() => {
    if (mode === 'ai' && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const aiMove = getAIMoveFn([...board], difficulty)
        if (aiMove !== -1) {
          handleCellClick(aiMove, true)
        }
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [board, isXNext, mode, winner, difficulty, handleCellClick])

  const resetGame = () => {
    gameAudio.playClick()
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setWinner(null)
    setWinningCombo(null)
  }

  const resetStats = () => {
    gameAudio.playClick()
    const fresh = { xWins: 0, oWins: 0, draws: 0 }
    setStats(fresh)
    localStorage.setItem('smarttools_ttt_stats', JSON.stringify(fresh))
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Mode and Sound Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('ai')
              resetGame()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === 'ai'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            vs Computer
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('pvp')
              resetGame()
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              mode === 'pvp'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            2 Players
          </button>
        </div>

        {mode === 'ai' && (
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setDifficulty('easy')
                resetGame()
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                difficulty === 'easy'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Easy
            </button>
            <button
              type="button"
              onClick={() => {
                setDifficulty('unbeatable')
                resetGame()
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                difficulty === 'unbeatable'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Smart AI
            </button>
          </div>
        )}

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
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3 text-center">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Player X {mode === 'ai' && '(You)'}
          </span>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {stats.xWins}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 text-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ties</span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            {stats.draws}
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 p-3 text-center">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            Player O {mode === 'ai' && '(AI)'}
          </span>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {stats.oWins}
          </div>
        </div>
      </div>

      {/* Turn or Winner Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center shadow-xs">
        {winner ? (
          <div className="flex items-center justify-center gap-2 font-semibold">
            {winner === 'draw' ? (
              <span className="text-amber-600 dark:text-amber-400 text-lg">
                🤝 Game Draw! Well played.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-lg text-emerald-600 dark:text-emerald-400">
                <Trophy className="h-5 w-5" />
                Player {winner} {mode === 'ai' && winner === 'X' ? 'Wins! 🎉' : mode === 'ai' ? 'Takes the Round!' : 'Wins! 🎉'}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>Turn:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                isXNext
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
              }`}
            >
              Player {isXNext ? 'X' : 'O'} {mode === 'ai' && !isXNext ? '(Thinking...)' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Game Board Grid */}
      <div className="relative mx-auto aspect-square max-w-[340px] sm:max-w-[380px] p-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-md">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 h-full w-full">
          {board.map((cell, index) => {
            const isWinningCell = winningCombo?.includes(index)
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleCellClick(index)}
                disabled={cell !== null || Boolean(winner) || (mode === 'ai' && !isXNext)}
                aria-label={`Cell ${index + 1}: ${cell || 'Empty'}`}
                className={`relative flex items-center justify-center rounded-2xl text-4xl sm:text-5xl font-black transition-all duration-200 select-none shadow-2xs active:scale-95 ${
                  cell === null && !winner
                    ? 'hover:bg-white dark:hover:bg-slate-800 hover:shadow-md cursor-pointer'
                    : 'cursor-default'
                } ${
                  isWinningCell
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 scale-[1.03] z-10 animate-bounce'
                    : cell
                    ? 'bg-white dark:bg-slate-800'
                    : 'bg-white/70 dark:bg-slate-800/60'
                }`}
              >
                {cell === 'X' && (
                  <span className={isWinningCell ? 'text-white' : 'text-blue-600 dark:text-blue-400'}>
                    ✕
                  </span>
                )}
                {cell === 'O' && (
                  <span className={isWinningCell ? 'text-white' : 'text-rose-600 dark:text-rose-400'}>
                    ◯
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={resetGame}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-98"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </button>
        <button
          type="button"
          onClick={resetStats}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Reset Score
        </button>
      </div>
    </div>
  )
}
