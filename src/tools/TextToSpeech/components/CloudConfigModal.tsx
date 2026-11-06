import React, { useState } from 'react'
import { X, Key, ShieldCheck, Check, Trash2 } from 'lucide-react'
import {
  CloudNeuralTTSProvider,
  type StoredCloudConfig,
} from '../providers/CloudNeuralTTSProvider'

interface CloudConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const existingConfig = CloudNeuralTTSProvider.getConfig()
  const [provider, setProvider] = useState<'openai' | 'elevenlabs'>(() => existingConfig?.provider || 'openai')
  const [apiKey, setApiKey] = useState(() => existingConfig?.apiKey || '')
  const [isSaved, setIsSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return

    const config: StoredCloudConfig = {
      provider,
      apiKey: apiKey.trim(),
    }
    CloudNeuralTTSProvider.setConfig(config)
    setIsSaved(true)
    setTimeout(() => {
      onSaved()
      onClose()
    }, 600)
  }

  const handleClear = () => {
    CloudNeuralTTSProvider.setConfig(null)
    setApiKey('')
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-settings-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 id="cloud-settings-title" className="text-base font-bold text-slate-900 dark:text-white">
                Cloud Studio Settings (BYOK)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bring Your Own Key • 100% Private Client-Side
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Cloud Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  provider === 'openai'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                OpenAI (tts-1)
              </button>
              <button
                type="button"
                disabled
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-400 opacity-60 text-center"
                title="Coming soon"
              >
                ElevenLabs (Soon)
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="cloud-api-key-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              API Key
            </label>
            <input
              id="cloud-api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              autoComplete="off"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Your key is saved <strong>only in this browser&apos;s localStorage</strong>. It is never transmitted to or stored on SmartTools India servers.
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-3 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <span>
              Calls are dispatched directly from your browser to the OpenAI API endpoint. You pay only for standard API usage on your own account.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {apiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove Key</span>
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!apiKey.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSaved ? <Check className="h-4 w-4" /> : null}
                <span>{isSaved ? 'Saved!' : 'Save Key'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
