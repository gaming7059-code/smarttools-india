import React from 'react'
import { Sparkles, Cpu, Cloud, Settings2, Server, HardDrive } from 'lucide-react'
import type { TTSProviderId, CompanionServerStatus } from '../types'

interface EngineSelectorProps {
  activeEngine: TTSProviderId
  onSelectEngine: (id: TTSProviderId) => void
  onOpenCloudConfig: () => void
  isCloudConfigured: boolean
  companionStatus?: CompanionServerStatus
  onToggleModelManager?: () => void
  isModelManagerOpen?: boolean
}

export const EngineSelector: React.FC<EngineSelectorProps> = ({
  activeEngine,
  onSelectEngine,
  onOpenCloudConfig,
  isCloudConfigured,
  companionStatus,
  onToggleModelManager,
  isModelManagerOpen,
}) => {
  const isCompanionUp = companionStatus?.isAvailable ?? false

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Speech Synthesis Engine
          </span>
          {isCompanionUp && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Companion Online (127.0.0.1:8000)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onToggleModelManager && (
            <button
              type="button"
              onClick={onToggleModelManager}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                isModelManagerOpen
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              <HardDrive className="h-3 w-3" />
              <span>Model Storage</span>
            </button>
          )}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Engine 1: Companion Neural Engine (Localhost 127.0.0.1) */}
        <button
          type="button"
          onClick={() => onSelectEngine('companion')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeEngine === 'companion'
              ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-xs ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className={`text-xs font-bold ${activeEngine === 'companion' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                Companion Neural
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isCompanionUp
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
            }`}>
              {isCompanionUp ? '24kHz Studio' : 'Optional (Local)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            High-fidelity natural voices for Bengali, Hindi, English, and Urdu via local companion service (`run_tts.bat`).
          </p>
        </button>

        {/* Engine 2: Local Neural AI (In-Browser ONNX) */}
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
                In-Browser Neural
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              VITS ONNX
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            100% Client-side WebAssembly execution (Meta MMS-TTS). Generates uncompressed 16-bit PCM WAV.
          </p>
        </button>

        {/* Engine 3: Free Browser Voice */}
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              0 MB • Instant
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Standard Web Speech API voices. Instant playback for all system languages with zero download.
          </p>
        </button>

        {/* Engine 4: Cloud Studio (BYOK) */}
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
            Direct client calls with your private OpenAI or ElevenLabs key. 100% private in browser.
          </p>
        </button>
      </div>
    </div>
  )
}
