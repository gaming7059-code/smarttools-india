import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gamepad2, Volume2, VolumeX, Sparkles, Shield, Zap, Smartphone, HelpCircle, CheckCircle2 } from 'lucide-react'
import { GAMES_LIST, type GameId, type GameInfo } from '../games/types'
import { GameIcon } from '../games/GameIcon'
import { GameCard } from '../games/GameCard'
import { TicTacToeGame } from '../games/TicTacToe/TicTacToeGame'
import { SnakeGame } from '../games/Snake/SnakeGame'
import { MemoryMatchGame } from '../games/MemoryMatch/MemoryMatchGame'
import { RockPaperScissorsGame } from '../games/RockPaperScissors/RockPaperScissorsGame'
import { NumberGuessGame } from '../games/NumberGuess/NumberGuessGame'
import { gameAudio } from '../games/gameAudio'
import { ScrollReveal } from '../components/common/ScrollReveal'
import { usePageSEO, createWebApplicationSchema, createFAQSchema } from '../utils/seo'

export const GamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const playParam = searchParams.get('play') as GameId
  const activeGameId: GameId =
    playParam && GAMES_LIST.some((g) => g.id === playParam)
      ? playParam
      : 'tic-tac-toe'

  const [isMuted, setIsMuted] = useState<boolean>(gameAudio.getMuted())

  const selectGame = (game: GameInfo) => {
    gameAudio.playClick()
    setSearchParams({ play: game.id })
    // Smooth scroll to game arena
    const arena = document.getElementById('game-arena')
    if (arena) {
      arena.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const toggleMute = () => {
    const next = gameAudio.toggleMute()
    setIsMuted(next)
  }

  const activeGame = GAMES_LIST.find((g) => g.id === activeGameId) || GAMES_LIST[0]

  const faqs = [
    {
      question: 'Are all games on SmartTools India 100% free?',
      answer: 'Yes! Every game in this section is completely free to play directly in your web browser with no subscriptions, in-app purchases, or hidden fees.',
    },
    {
      question: 'Do I need to install an app or create an account?',
      answer: 'No installation, signup, or login is required. You can start playing immediately on any desktop, laptop, tablet, or smartphone.',
    },
    {
      question: 'Are my high scores and game records saved?',
      answer: 'Yes, your scores and records (such as Snake high scores and Tic-Tac-Toe records) are saved locally in your browser storage so they persist between visits.',
    },
    {
      question: 'Can I play these games offline?',
      answer: 'Once loaded, all game logic and synthesized sounds run client-side in your browser without contacting an external server.',
    },
  ]

  usePageSEO({
    title: `${activeGame.title} — Free Online Browser Games | SmartTools India`,
    description: `Play free online browser games on SmartTools India. Enjoy ${activeGame.title}, Snake, Tic-Tac-Toe, Memory Match, Rock Paper Scissors, and Number Guessing with zero ads, downloads or login.`,
    canonicalPath: '/games',
    schema: [
      createWebApplicationSchema(
        'Free Online Games',
        'Free online browser games including Tic-Tac-Toe, Snake, Memory Match, Rock Paper Scissors, and Number Guessing on SmartTools India.',
        '/games'
      ),
      createFAQSchema(faqs) || {},
    ],
  })

  return (
    <div className="space-y-14 sm:space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950 pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-slate-200/60 dark:border-slate-800">
        {/* Subtle Ambient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
          <div className="absolute -top-20 -left-16 w-72 sm:w-88 h-72 sm:h-88 rounded-full bg-gradient-to-tr from-purple-400/20 to-blue-400/20 dark:from-purple-600/10 dark:to-blue-600/10 blur-3xl animate-blob-1" />
          <div className="absolute top-10 -right-20 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-gradient-to-br from-emerald-300/20 to-teal-300/20 dark:from-emerald-600/10 dark:to-teal-700/10 blur-3xl animate-blob-2" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-5 shadow-2xs">
            <Gamepad2 className="h-3.5 w-3.5" />
            100% Free • Instant Play • No Downloads
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Free Online Games
          </h1>

          <p className="mt-3.5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Relax and sharpen your mind with fun, responsive mini-games. Playable instantly on desktop, tablet, and mobile.
          </p>

          {/* Quick Sound Toggle in Hero */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs transition-colors"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-500" />}
              <span>{isMuted ? 'Sound Muted' : 'Sound Enabled'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. GAME ARENA WITH SEAMLESS SELECTOR TABS */}
      <section id="game-arena" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Game Tab Strip */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {GAMES_LIST.map((game) => {
            const isSelected = game.id === activeGameId
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => selectGame(game)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <GameIcon gameId={game.id} size="sm" className="shrink-0" />
                <span>{game.title}</span>
              </button>
            )
          })}
        </div>

        {/* Active Game Container Card */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-8 shadow-sm">
          {/* Active Game Title and Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <GameIcon gameId={activeGame.id} size="lg" withContainer />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {activeGame.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {activeGame.subtitle} • {activeGame.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="h-3 w-3" /> Ready to Play
              </span>
            </div>
          </div>

          {/* Active Game Component Viewport */}
          <div className="min-h-[420px] flex flex-col justify-center">
            {activeGameId === 'tic-tac-toe' && <TicTacToeGame />}
            {activeGameId === 'snake' && <SnakeGame />}
            {activeGameId === 'memory-match' && <MemoryMatchGame />}
            {activeGameId === 'rock-paper-scissors' && <RockPaperScissorsGame />}
            {activeGameId === 'number-guess' && <NumberGuessGame />}
          </div>

          {/* Game Rules & Instructions Accordion */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-blue-500" />
              How to Play {activeGame.title}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeGame.instructions.map((inst, index) => (
                <li
                  key={index}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 flex items-start gap-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    {index + 1}
                  </span>
                  <span>{inst}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. ALL GAMES SHOWCASE GRID */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Browse Games Collection
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                All 5 Free Browser Games
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Pick another classic game anytime without losing your active scores.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES_LIST.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isActive={game.id === activeGameId}
              onSelect={selectGame}
            />
          ))}
        </div>
      </section>

      {/* 4. WHY PLAY ON SMARTTOOLS INDIA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Why Play on SmartTools India?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Instant Launch</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Zero loading screens, no heavy downloads, and no waiting. Every game runs directly in your browser.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">100% Private & Ad-Free</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No popup spam, no tracking cookies, and no account requirements. Safe for children and students.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Touch & Mobile Optimized</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Responsive design with custom virtual touch pads and gesture controls built for smartphones.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Offline Audio Synth</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Client-side Web Audio synthesis powers all sound effects without loading external audio media.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xs space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-5 space-y-2"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400">Q:</span> {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-5">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
