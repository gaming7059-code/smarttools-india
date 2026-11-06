import React from 'react'
import { Sparkles, Cpu, Cloud, Settings2 } from 'lucide-react'
import type { TTSProviderId } from '../types'

interface EngineSelectorProps {
  activeEngine: TTSProviderId
  onSelectEngine: (id: TTSProviderId) => void
  onOpenCloudConfig: () => void
  isCloudConfigured: boolean
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  activeEngine,
  onSelectEngine,
  onOpenCloudConfig,
  isCloudConfigured,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Speech Synthesis Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Active: <strong className="text-blue-600 dark:text-blue-400">{
              activeEngine === 'browser'
                ? 'Free Browser Voice (0 MB)'
                : activeEngine === 'local-neural'
                ? 'Local Neural ONNX (Meta MMS)'
                : 'Cloud Studio (BYOK)'
            }</strong>
          </span>

          {activeEngine === 'cloud-neural' && (
            <button
              type="button"
              onClick={onOpenCloudConfig}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
              title="Configure API key"
            >
              <Settings2 className="h-3 w-3" />
              <span>{isCloudConfigured ? 'Configured' : 'Setup Key'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Engine 1: Free Browser */}
        <button
          type="button"
          onClick={() => onSelectEngine('browser')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeEngine === 'browser'
              ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold ${activeEngine === 'browser' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
              Free Browser Voice
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              0 MB • Free
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Instant native voices (Microsoft Natural, Google Cloud, Apple Enhanced). Works 100% offline with system voices.
          </p>
        </button>

        {/* Engine 2: Local Neural AI */}
        <button
          type="button"
          onClick={() => onSelectEngine('local-neural')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeEngine === 'local-neural'
              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 shadow-xs ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className={`text-xs font-bold ${activeEngine === 'local-neural' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-100'}`}>
                Local Neural AI
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              VITS ONNX
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Client-side WebAssembly neural model (Meta MMS-TTS). Generates uncompressed 16-bit PCM WAV audio.
          </p>
        </button>

        {/* Engine 3: Cloud Studio (BYOK) */}
        <button
          type="button"
          onClick={() => onSelectEngine('cloud-neural')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeEngine === 'cloud-neural'
              ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/60 shadow-xs ring-2 ring-purple-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className={`text-xs font-bold ${activeEngine === 'cloud-neural' ? 'text-purple-700 dark:text-purple-400' : 'text-slate-900 dark:text-slate-100'}`}>
                Cloud Studio (BYOK)
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isCloudConfigured
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {isCloudConfigured ? 'Ready' : 'Optional'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Optional studio voices via your private OpenAI or ElevenLabs key. 100% direct browser calls, zero server storage.
          </p>
        </button>
      </div>
    </div>
  )
}
