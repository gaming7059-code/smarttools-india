import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  Shield,
  Zap,
  Crosshair,
  Volume2,
  Keyboard,
  Smartphone,
  Trophy,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { GAMES_LIST } from '../../games/types'
import { GameCard } from '../../games/GameCard'
import { ScrollReveal } from '../../components/common/ScrollReveal'
import { usePageSEO, createWebApplicationSchema, createBreadcrumbSchema, createFAQSchema } from '../../utils/seo'

export const HexDriftPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Listen for fullscreen change events (native escape or button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      )
      setIsFullscreen(isFs)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const target = containerRef.current
        if (target) {
          if (target.requestFullscreen) {
            await target.requestFullscreen()
          } else if ((target as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
            await (target as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen()
        }
      }
    } catch {
      // Browser blocked or unsupported
    }
  }

  const reloadGame = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = '/games/hex-drift/game.html'
    }
  }

  const otherGames = GAMES_LIST.filter((g) => g.id !== 'hex-drift')

  const faqs = [
    {
      question: 'How do I steer my spacecraft in HEX DRIFT?',
      answer:
        'On desktop computers and laptops, use WASD or the Arrow keys. On touchscreens, smartphones, and tablets, simply touch and drag anywhere on the canvas to steer smoothly.',
    },
    {
      question: 'Do I need to press a key to shoot?',
      answer:
        'No, your ship has auto-fire continuously engaged! Your primary objective is evasive steering, weaving through asteroids, blasting enemies, and grabbing glowing power-up orbs.',
    },
    {
      question: 'What do the glowing power-ups do?',
      answer:
        'The Cyan Shield absorbs one asteroid collision safely. The Amber Rapid-Fire increases your firing rate by 2.5x for 8 seconds. The Magenta Multi-Shot equips a triple-spread plasma cannon.',
    },
    {
      question: 'Is my high score saved?',
      answer:
        'Yes! Your high score is stored automatically in your browser localStorage, allowing you to return anytime and beat your personal record.',
    },
  ]

  usePageSEO({
    title: 'HEX DRIFT — Neon Void Runner Online | Free Arcade Game | SmartTools India',
    description:
      'Play HEX DRIFT: Neon Void Runner free online. Dodge geometric asteroids, collect Shield, Rapid, and Multi-Shot power-ups, defeat enemy waves, and set new high scores. 100% free with zero downloads.',
    canonicalPath: '/games/hex-drift',
    keywords:
      'hex drift, neon void runner, free online arcade game, space runner game, browser shooting game, dodge game, smarttools india games',
    schema: [
      createWebApplicationSchema(
        'HEX DRIFT — Neon Void Runner',
        'Free online neon arcade dodger and shooter game with procedural audio, smooth touch drag, and local high score tracking.',
        '/games/hex-drift'
      ),
      createBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Games', path: '/games' },
        { name: 'HEX DRIFT', path: '/games/hex-drift' },
      ]),
      createFAQSchema(faqs) || {},
    ],
  })

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. BREADCRUMBS & TOP BAR */}
      <section className="border-b border-slate-200/70 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/games" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Games
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-white">HEX DRIFT</span>
          </nav>

          <Link
            to="/games"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-2xs transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>All Browser Games</span>
          </Link>
        </div>
      </section>

      {/* 2. MAIN GAME ARENA SECTION */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header Strip with Title, Badges, and Fullscreen Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-2.5 py-0.5 text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5" /> ARCADE / ACTION
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  ⚡ 60 FPS PROCEDURAL
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-700 dark:text-fuchsia-300">
                  <Volume2 className="h-2.5 w-2.5" /> LIVE SYNTH AUDIO
                </span>
              </div>

              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <span>HEX DRIFT</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-lg sm:text-2xl font-bold uppercase tracking-widest">
                  NEON VOID RUNNER
                </span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Dodge geometric enemies, collect power-ups, survive endless waves, and beat your high score.
              </p>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={reloadGame}
                title="Restart Game Frame"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-fuchsia-500 text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 active:scale-95"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    <span>Enter Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GAME CANVAS IFRAME CONTAINER */}
          <div
            ref={containerRef}
            className={`relative w-full rounded-2xl sm:rounded-3xl border border-cyan-500/30 dark:border-cyan-500/40 bg-[#060310] shadow-2xl shadow-cyan-500/10 overflow-hidden transition-all duration-300 ${
              isFullscreen
                ? 'fixed inset-0 z-50 rounded-none border-0 h-screen w-screen'
                : 'h-[580px] sm:h-[680px] lg:h-[740px]'
            }`}
          >
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#060310] text-cyan-400 space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <Gamepad2 className="h-7 w-7 text-cyan-400 absolute" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-bold tracking-widest uppercase">INITIALIZING NEON VOID RUNNER</div>
                  <div className="text-xs text-slate-500">Synthesizing audio nodes &amp; canvas engine...</div>
                </div>
              </div>
            )}

            {/* Embedded Isolated Game Frame */}
            <iframe
              ref={iframeRef}
              src="/games/hex-drift/game.html"
              title="HEX DRIFT — Neon Void Runner"
              allow="fullscreen; autoplay"
              loading="eager"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 select-none bg-[#060310]"
            />

            {/* Floating In-Arena Fullscreen Button (Visible in normal mode) */}
            {!isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Expand Fullscreen"
                className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 px-3 py-1.5 text-xs font-semibold shadow-md transition-all duration-200 hover:scale-105"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Fullscreen</span>
              </button>
            )}

            {/* Floating Exit Fullscreen Button (Visible in fullscreen mode) */}
            {isFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label="Exit Fullscreen"
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-lg bg-black/80 hover:bg-black/95 backdrop-blur-md border border-fuchsia-500/60 text-fuchsia-300 px-3.5 py-1.5 text-xs font-bold shadow-lg transition-all duration-200"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Fullscreen (Esc)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. FLIGHT MANUAL & CONTROLS GUIDE */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  PILOT BRIEFING
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                  Flight Manual &amp; Control Guide
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Master the void runner dynamics to survive high-speed asteroid fields and achieve top rank.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Touch &amp; Keyboard Ready
                </span>
              </div>
            </div>

            {/* Controls Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Controls */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                    <Keyboard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Desktop &amp; Laptop Controls</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Precision keyboard steering</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Steer Ship (Up / Down / Left / Right)</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      W A S D or ↑ ↓ ← →
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Plasma Cannons</span>
                    <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                      AUTO-FIRE ALWAYS ON
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Pause / Resume Game</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      P or Top-Right Button
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Toggle Audio Mute</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                      M or Sound Icon
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Touch Controls */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Mobile &amp; Tablet Controls</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fluid capacitive touch dragging</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Touch &amp; Drag Anywhere</span>
                    <span className="px-2 py-1 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold text-[11px]">
                      1:1 Finger Tracking
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Scroll Lock Protection</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-[11px]">
                      Zero Jitter / No Overscroll
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Device Rotation</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-[11px]">
                      Portrait or Landscape
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Tap to Pause</span>
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-[11px]">
                      Top-Right Pause Icon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* POWER-UPS EXPLANATION */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Orb Pickups &amp; Tactical Upgrades
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Shield className="h-4 w-4" />
                    <span>CYAN SHIELD</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Surrounds your ship with a glowing kinetic barrier. Absorbs 1 asteroid or enemy collision completely unharmed.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Zap className="h-4 w-4" />
                    <span>RAPID FIRE</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Overclocks your plasma cannons by 2.5x firing speed for 8 seconds. Melts through dense asteroid clusters.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-50/50 dark:bg-fuchsia-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 font-bold text-xs uppercase tracking-wider">
                    <Crosshair className="h-4 w-4" />
                    <span>MULTI-SHOT</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Deploys a 3-way divergent plasma arc. Covers the entire screen corridor and clears multiple incoming threats simultaneously.
                  </p>
                </div>
              </div>
            </div>

            {/* SCORING & WAVE MULTIPLIERS */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Continuous Scoring &amp; Wave Progression</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Score increases every second your ship stays intact plus bonus points for asteroid demolitions. Wave difficulty accelerates every 15 seconds.
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Storage</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Local High Score Auto-Saved</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/30 p-5 space-y-2"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 5. EXPLORE MORE BROWSER GAMES */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                More Free Games
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Play Other Mini Games
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Explore our full collection of responsive, free browser games.
              </p>
            </div>
            <Link
              to="/games"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <span>View All Games</span>
              <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
