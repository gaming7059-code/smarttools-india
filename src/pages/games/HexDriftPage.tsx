import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  Volume2,
  Keyboard,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  Coins,
  Rocket,
  Wrench,
  Award,
  Flame,
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
      iframeRef.current.src = `${import.meta.env.BASE_URL}games/hex-drift/game.html`
    }
  }

  const otherGames = GAMES_LIST.filter((g) => g.id !== 'hex-drift')

  const faqs = [
    {
      question: 'How does the Boss Fight system work in HEX DRIFT?',
      answer:
        'As you defeat enemies and fill your level progress bar, Level 5 unleashes a massive Dreadnought Boss! The boss has a visible multi-phase health bar, targeted plasma volleys, radial geometric rings, and drone escorts. Defeating the boss awards bonus score, a large crystal coin drop, and unlocks the next difficulty tier.',
    },
    {
      question: 'How do I earn and spend in-game energy coins?',
      answer:
        'Destroying enemies and bosses drops glowing energy crystals (coins). Coins are saved automatically in your browser localStorage. You can spend them in the Star Hangar to unlock 5 unique spaceships (Viper, Phantom, Titan, Pulsar, and Reaver) and upgrade 4 weapon systems.',
    },
    {
      question: 'How do Daily Missions and Achievements work?',
      answer:
        'Every day at midnight, 4 fresh date-based missions are generated with coin rewards. Additionally, 10 permanent achievements (such as First Blood, Void Hunter, Boss Slayer, and Overclocked) grant instant coin bounties upon completion.',
    },
    {
      question: 'Can I play HEX DRIFT on mobile touchscreens without lag?',
      answer:
        'Yes! HEX DRIFT features fluid 1:1 capacitive touch drag controls with scroll-lock protection. Simply drag your finger anywhere on the canvas to steer your ship. Auto-fire is continuously engaged.',
    },
  ]

  usePageSEO({
    title: 'HEX DRIFT — Neon Void Runner Online | Boss Fights, Upgrades & Ships | SmartTools India',
    description:
      'Play HEX DRIFT: Neon Void Runner with Boss Battles, Level Progression, Star Hangar Spaceships, Weapon Upgrades, and Daily Missions. 100% free client-side browser arcade game.',
    canonicalPath: '/games/hex-drift',
    keywords:
      'hex drift, neon void runner, boss fight arcade game, spaceship shop game, browser shooter, space runner game, smarttools india games',
    schema: [
      createWebApplicationSchema(
        'HEX DRIFT — Neon Void Runner',
        'Enhanced futuristic arcade void runner featuring Dreadnought Boss fights, Level Progression, 5 unlockable spaceships, weapon upgrade trees, daily missions, and local high score tracking.',
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
                <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 px-2.5 py-0.5 text-[11px] font-bold text-fuchsia-700 dark:text-fuchsia-300">
                  <Flame className="h-2.5 w-2.5" /> BOSS FIGHTS
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  <Coins className="h-2.5 w-2.5" /> STAR HANGAR &amp; UPGRADES
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                  <Volume2 className="h-2.5 w-2.5" /> SYNTH AUDIO
                </span>
              </div>

              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <span>HEX DRIFT</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 text-lg sm:text-2xl font-bold uppercase tracking-widest">
                  NEON VOID RUNNER
                </span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Survive level waves, take down massive Dreadnought Bosses, earn energy coins, and customize your starships.
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
              src={`${import.meta.env.BASE_URL}games/hex-drift/game.html`}
              title="HEX DRIFT — Neon Void Runner"
              allow="fullscreen; autoplay"
              loading="eager"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 select-none bg-[#060310]"
            />

            {/* Floating In-Arena Fullscreen Button */}
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

            {/* Floating Exit Fullscreen Button */}
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
                  Master void runner dynamics, dreadnought boss fights, and hangar ship loadouts.
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
                      P or ESC
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

            {/* BOSS FIGHT & LEVEL PROGRESSION */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-500" />
                Boss Battles &amp; Level Progression
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
                    <Flame className="h-4 w-4" />
                    <span>DREADNOUGHT VEX-9</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Spawns at Level 5 with a visible multi-segment health bar. Fires targeted plasma volleys, 12-point bullet rings, and launches escort drones.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Coins className="h-4 w-4" />
                    <span>ENERGY COINS &amp; BOUNTIES</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Destroying enemies and bosses drops glowing energy crystals (coins). Defeating a boss awards a massive +100 coin bounty!
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="h-4 w-4" />
                    <span>INFINITE LEVEL SYSTEM</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Level 1 (Beginner), Level 2 (Splitters), Level 3 (Chasers), Level 4 (Orbitals), Level 5 (Boss). Progress seamlessly to higher tier sectors.
                  </p>
                </div>
              </div>
            </div>

            {/* STAR HANGAR & UPGRADE LAB */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Rocket className="h-4 w-4 text-cyan-500" />
                Star Hangar Ships &amp; Upgrade Lab
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    <Rocket className="h-4 w-4" />
                    <span>5 UNLOCKABLE SPACESHIPS</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li><strong className="text-slate-900 dark:text-white">Viper Alpha:</strong> Balanced interceptor with standard plasma cannons (Default).</li>
                    <li><strong className="text-slate-900 dark:text-white">Neon Phantom:</strong> +20% movement speed and extended rapid-fire duration (150 ◈).</li>
                    <li><strong className="text-slate-900 dark:text-white">Aegis Titan:</strong> Starts with +1 extra hull point and prolonged kinetic shields (300 ◈).</li>
                    <li><strong className="text-slate-900 dark:text-white">Vortex Pulsar:</strong> +25% cannon rate of fire and high-velocity projectiles (500 ◈).</li>
                    <li><strong className="text-slate-900 dark:text-white">Void Reaver:</strong> Permanent dual plasma cannons and built-in magnetic pull (1000 ◈).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Wrench className="h-4 w-4" />
                    <span>4 SYSTEM UPGRADE TIERS (LVL 1-5)</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                    <li><strong className="text-slate-900 dark:text-white">Laser Capacitor:</strong> Reduces cannon firing interval for rapid bursts.</li>
                    <li><strong className="text-slate-900 dark:text-white">Plasma Overcharge:</strong> Boosts projectile velocity and destructive hit damage.</li>
                    <li><strong className="text-slate-900 dark:text-white">Kinetic Barrier Matrix:</strong> Increases shield duration up to 14 seconds.</li>
                    <li><strong className="text-slate-900 dark:text-white">Flux Grav-Magnet:</strong> Expands coin suction radius across the canvas corridor.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* DAILY MISSIONS & ACHIEVEMENTS */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Daily Missions &amp; 10 Achievements</span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      Daily Reset
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Complete 4 fresh date-based missions every day and unlock 10 permanent trophies for bonus coin rewards.
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Storage</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Auto-Saved Locally</span>
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
