import React, { useState, useEffect } from 'react'
import { HardDrive, Trash2, CheckCircle2, RefreshCw } from 'lucide-react'
import {
  inspectModelCache,
  clearBrowserModelCache,
  type ModelCacheStatus,
} from '../../../utils/neuralSpeechService'

interface ModelDownloadManagerProps {
  onClose?: () => void
}

export const ModelDownloadManager: React.FC<ModelDownloadManagerProps> = () => {
  const [models, setModels] = useState<ModelCacheStatus[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isClearing, setIsClearing] = useState<boolean>(false)
  const [msg, setMsg] = useState<string | null>(null)

  const refreshCache = async () => {
    setIsLoading(true)
    try {
      const list = await inspectModelCache()
      setModels(list)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshCache()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleClearCache = async () => {
    setIsClearing(true)
    setMsg(null)
    try {
      await clearBrowserModelCache()
      await refreshCache()
      setMsg('Model cache cleared successfully. Memory released.')
    } catch {
      setMsg('Failed to clear cache.')
    } finally {
      setIsClearing(false)
    }
  }

  const totalCachedMb = models
    .filter((m) => m.isCached)
    .reduce((acc, cur) => acc + cur.sizeMb, 0)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            Browser Neural Model Storage Manager
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Cached: <strong className="text-indigo-600 dark:text-indigo-400">{totalCachedMb.toFixed(1)} MB</strong>
          </span>
          <button
            type="button"
            onClick={refreshCache}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh cache status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        On-device neural models are downloaded once and stored privately in your browser cache.
        They run 100% offline via WebAssembly on your CPU.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {models.map((m) => (
          <div
            key={m.modelId}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {m.label}
                </span>
                {m.isCached && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Offline Ready
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Size: ~{m.sizeMb} MB • Quantized ONNX
              </div>
            </div>

            <div className="text-right">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                m.isCached
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {m.isCached ? 'Downloaded' : 'On-Demand'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {totalCachedMb > 0 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-[10px] text-slate-400">
            Clear cache to free up disk space or reload fresh model weights.
          </p>
          <button
            type="button"
            onClick={handleClearCache}
            disabled={isClearing}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            <span>{isClearing ? 'Clearing...' : 'Clear Cached Weights'}</span>
          </button>
        </div>
      )}

      {msg && (
        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg">
          {msg}
        </div>
      )}
    </div>
  )
}
