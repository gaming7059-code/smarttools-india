import React from 'react'
import { Play, Sparkles } from 'lucide-react'
import type { GameInfo } from './types'
import { GameIcon } from './GameIcon'

interface GameCardProps {
  game: GameInfo
  isActive?: boolean
  onSelect?: (game: GameInfo) => void
}

export const GameCard: React.FC<GameCardProps> = ({ game, isActive = false, onSelect }) => {
  return (
    <div
      onClick={() => onSelect?.(game)}
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 ease-out cursor-pointer ${
        isActive
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-lg'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <GameIcon gameId={game.id} size="md" withContainer />
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/60 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <Sparkles className="h-2.5 w-2.5" /> {game.tag}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {game.category}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {game.title}
          </h3>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Instant Browser Play
        </span>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
          <span>{isActive ? 'Playing' : 'Play Now'}</span>
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      </div>
    </div>
  )
}
