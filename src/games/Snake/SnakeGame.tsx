import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2, VolumeX, Flame } from 'lucide-react'
import { gameAudio } from '../gameAudio'
import { GameIcon } from '../GameIcon'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
interface Point {
  x: number
  y: number
}
type SpeedMode = 'casual' | 'normal' | 'blitz'

const CELL_COUNT = 20 // 20x20 grid

const SPEED_MAP: Record<SpeedMode, number> = {
  casual: 160,
  normal: 120,
  blitz: 80,
}

export const SnakeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ])
  const [food, setFood] = useState<Point>({ x: 5, y: 5 })
  const [bonusFood, setBonusFood] = useState<Point | null>(null)
  const [bonusTimer, setBonusTimer] = useState<number>(0)
  const [direction, setDirection] = useState<Direction>('UP')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [score, setScore] = useState<number>(0)
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal')
  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('smarttools_snake_highscore')
      return saved ? parseInt(saved, 10) : 0
    } catch {
      return 0
    }
  })

  const nextDirectionRef = useRef<Direction>('UP')
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Generate random food not on snake
  const getRandomPosition = useCallback((currentSnake: Point[]): Point => {
    let newPos: Point
    let onSnake = true
    while (onSnake) {
      newPos = {
        x: Math.floor(Math.random() * CELL_COUNT),
        y: Math.floor(Math.random() * CELL_COUNT),
      }
      onSnake = currentSnake.some((seg) => seg.x === newPos.x && seg.y === newPos.y)
      if (!onSnake) return newPos
    }
    return { x: 5, y: 5 }
  }, [])

  // Change direction safely
  const changeDirection = useCallback((newDir: Direction) => {
    const current = nextDirectionRef.current
    if (
      (newDir === 'UP' && current !== 'DOWN') ||
      (newDir === 'DOWN' && current !== 'UP') ||
      (newDir === 'LEFT' && current !== 'RIGHT') ||
      (newDir === 'RIGHT' && current !== 'LEFT')
    ) {
      nextDirectionRef.current = newDir
      setDirection(newDir)
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault()
      }

      if (e.code === 'Space') {
        if (!isPlaying && !gameOver) {
          setIsPlaying(true)
        } else if (isPlaying) {
          setIsPaused((prev) => !prev)
        }
        return
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          changeDirection('UP')
          break
        case 'ArrowDown':
        case 'KeyS':
          changeDirection('DOWN')
          break
        case 'ArrowLeft':
        case 'KeyA':
          changeDirection('LEFT')
          break
        case 'ArrowRight':
        case 'KeyD':
          changeDirection('RIGHT')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [changeDirection, isPlaying, gameOver])

  // Reset / Start Game
  const startNewGame = useCallback(() => {
    gameAudio.playClick()
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]
    setSnake(initialSnake)
    const newFood = getRandomPosition(initialSnake)
    setFood(newFood)
    setBonusFood(null)
    setBonusTimer(0)
    setDirection('UP')
    nextDirectionRef.current = 'UP'
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setIsPlaying(true)
  }, [getRandomPosition])

  // Main game tick
  useEffect(() => {
    if (!isPlaying || isPaused || gameOver) return

    const tick = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] }
        const currentDir = nextDirectionRef.current

        switch (currentDir) {
          case 'UP':
            head.y -= 1
            break
          case 'DOWN':
            head.y += 1
            break
          case 'LEFT':
            head.x -= 1
            break
          case 'RIGHT':
            head.x += 1
            break
        }

        // Wall collisions
        if (head.x < 0 || head.x >= CELL_COUNT || head.y < 0 || head.y >= CELL_COUNT) {
          gameAudio.playGameOver()
          setGameOver(true)
          setIsPlaying(false)
          return prevSnake
        }

        // Self collisions
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          gameAudio.playGameOver()
          setGameOver(true)
          setIsPlaying(false)
          return prevSnake
        }

        const newSnake = [head, ...prevSnake]

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          gameAudio.playEatFood()
          const newScore = score + 10
          setScore(newScore)
          if (newScore > highScore) {
            setHighScore(newScore)
            localStorage.setItem('smarttools_snake_highscore', String(newScore))
          }
          setFood(getRandomPosition(newSnake))

          // Chance to spawn bonus star
          if (Math.random() < 0.25 && !bonusFood) {
            setBonusFood(getRandomPosition(newSnake))
            setBonusTimer(50) // 50 ticks
          }
        } else if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
          gameAudio.playWin()
          const newScore = score + 30
          setScore(newScore)
          if (newScore > highScore) {
            setHighScore(newScore)
            localStorage.setItem('smarttools_snake_highscore', String(newScore))
          }
          setBonusFood(null)
          setBonusTimer(0)
        } else {
          newSnake.pop()
        }

        return newSnake
      })

      // Bonus timer countdown
      setBonusTimer((prev) => {
        if (prev <= 1) {
          setBonusFood(null)
          return 0
        }
        return prev - 1
      })
    }, SPEED_MAP[speedMode])

    return () => clearInterval(tick)
  }, [isPlaying, isPaused, gameOver, food, bonusFood, score, highScore, speedMode, getRandomPosition])

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const cellSize = width / CELL_COUNT

    // Clear board background
    ctx.fillStyle = '#0f172a' // slate-900
    ctx.fillRect(0, 0, width, height)

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(width, i * cellSize)
      ctx.stroke()
    }

    // Draw normal food (Apple)
    ctx.font = `${cellSize * 0.85}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🍎', food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2 + 1)

    // Draw bonus food (Golden Star)
    if (bonusFood) {
      ctx.fillText('⭐', bonusFood.x * cellSize + cellSize / 2, bonusFood.y * cellSize + cellSize / 2 + 1)
    }

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0
      const x = segment.x * cellSize
      const y = segment.y * cellSize
      const pad = 1.5

      if (isHead) {
        ctx.fillStyle = '#10b981' // emerald-500
        ctx.beginPath()
        ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, 6)
        ctx.fill()

        // Eyes on snake head
        ctx.fillStyle = '#ffffff'
        const eyeSize = cellSize * 0.18
        if (direction === 'UP') {
          ctx.beginPath()
          ctx.arc(x + cellSize * 0.3, y + cellSize * 0.3, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + cellSize * 0.7, y + cellSize * 0.3, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        } else if (direction === 'DOWN') {
          ctx.beginPath()
          ctx.arc(x + cellSize * 0.3, y + cellSize * 0.7, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + cellSize * 0.7, y + cellSize * 0.7, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        } else if (direction === 'LEFT') {
          ctx.beginPath()
          ctx.arc(x + cellSize * 0.3, y + cellSize * 0.3, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + cellSize * 0.3, y + cellSize * 0.7, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(x + cellSize * 0.7, y + cellSize * 0.3, eyeSize, 0, Math.PI * 2)
          ctx.arc(x + cellSize * 0.7, y + cellSize * 0.7, eyeSize, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // Gradient / body segments
        ctx.fillStyle = index % 2 === 0 ? '#059669' : '#047857' // emerald-600 & 700
        ctx.beginPath()
        ctx.roundRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, 4)
        ctx.fill()
      }
    })
  }, [snake, food, bonusFood, direction])

  // Touch Swipe Handlers for Canvas
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 25) {
      if (deltaX > 0) changeDirection('RIGHT')
      else changeDirection('LEFT')
    } else if (Math.abs(deltaY) > 25) {
      if (deltaY > 0) changeDirection('DOWN')
      else changeDirection('UP')
    }
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* Top Header / Mode & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-xs">
        {/* Speed Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSpeedMode('casual')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              speedMode === 'casual'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Casual
          </button>
          <button
            type="button"
            onClick={() => setSpeedMode('normal')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              speedMode === 'normal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setSpeedMode('blitz')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              speedMode === 'blitz'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="h-3 w-3" />
            Blitz
          </button>
        </div>

        {/* Mute and Pause */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
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
      </div>

      {/* Scores & Status Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 text-center">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Score</span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{score}</div>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/40 p-3 text-center">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
            <Trophy className="h-3 w-3" /> Best
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{highScore}</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-3 text-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {bonusFood ? `⭐ Star (${bonusTimer})` : 'Length'}
          </span>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
            {bonusFood ? <span className="text-amber-500 text-lg animate-pulse">+30 pts</span> : snake.length}
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative mx-auto aspect-square max-w-[340px] sm:max-w-[400px] w-full rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-xl">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block cursor-pointer select-none"
        />

        {/* Game start or game over overlay */}
        {(!isPlaying || isPaused) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10 animate-fade-in">
            {gameOver ? (
              <div className="space-y-3">
                <span className="text-3xl">💥</span>
                <h3 className="text-2xl font-bold text-rose-400">Game Over!</h3>
                <p className="text-sm text-slate-300">
                  You scored <span className="font-bold text-white text-base">{score}</span> points.
                </p>
                {score >= highScore && score > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
                    <Trophy className="h-3.5 w-3.5" /> New High Score!
                  </div>
                )}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={startNewGame}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            ) : isPaused ? (
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-amber-400">Game Paused</h3>
                <p className="text-sm text-slate-300">Take a breath and continue anytime</p>
                <button
                  type="button"
                  onClick={() => setIsPaused(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="h-4 w-4" />
                  Resume Game
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <GameIcon gameId="snake" size="lg" withContainer />
                </div>
                <h3 className="text-2xl font-bold">Retro Snake</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  Eat apples to grow. Avoid crashing into walls or your own tail.
                </p>
                <button
                  type="button"
                  onClick={startNewGame}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="h-4 w-4" />
                  Start Playing
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* On-Screen Mobile Virtual D-Pad (Touch Controls) */}
      <div className="flex flex-col items-center justify-center select-none pt-1">
        <div className="grid grid-cols-3 gap-2 w-48 sm:w-52">
          <div />
          <button
            type="button"
            onClick={() => changeDirection('UP')}
            aria-label="Up"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-800 dark:text-white active:bg-blue-600 active:text-white active:scale-95 transition-transform"
          >
            <ArrowUp className="h-6 w-6" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => changeDirection('LEFT')}
            aria-label="Left"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-800 dark:text-white active:bg-blue-600 active:text-white active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPlaying) startNewGame()
              else setIsPaused((prev) => !prev)
            }}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-bold text-xs active:scale-95 transition-transform"
          >
            {!isPlaying ? 'START' : isPaused ? 'GO' : 'PAUSE'}
          </button>
          <button
            type="button"
            onClick={() => changeDirection('RIGHT')}
            aria-label="Right"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-800 dark:text-white active:bg-blue-600 active:text-white active:scale-95 transition-transform"
          >
            <ArrowRight className="h-6 w-6" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => changeDirection('DOWN')}
            aria-label="Down"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-slate-800 dark:text-white active:bg-blue-600 active:text-white active:scale-95 transition-transform"
          >
            <ArrowDown className="h-6 w-6" />
          </button>
          <div />
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          Tip: You can also use arrow keys, WASD, or swipe on screen.
        </p>
      </div>
    </div>
  )
}
