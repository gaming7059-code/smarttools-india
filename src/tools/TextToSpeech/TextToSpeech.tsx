import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  ClipboardPaste,
  Sliders,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  AudioLines,
  Download,
  Loader2,
  FileAudio,
  CheckCircle2,
  Info,
  ShieldAlert,
  Globe,
  Ear,
  Languages,
  CheckCheck,
  Wand2,
  Server,
  RefreshCw,
} from 'lucide-react'
import { WaveformVisualizer } from '../../components/common/WaveformVisualizer'
import { TTSManager } from './services/TTSManager'
import { CloudNeuralTTSProvider } from './providers/CloudNeuralTTSProvider'
import { EngineSelector } from './components/EngineSelector'
import { ModelDownloadManager } from './components/ModelDownloadManager'
import { CloudConfigModal } from './components/CloudConfigModal'
import type {
  TTSProviderId,
  TTSVoice,
  TTSProgressInfo,
  GeneratedAudioOutput,
  CompanionServerStatus,
} from './types'
import {
  detectLanguageFromText,
  estimateSpeechDurationSeconds,
  formatSpeechDuration,
  type DetectedLanguage,
} from './services/VoiceDiscovery'
import { revokeSpeechAudioUrl } from '../../utils/wavAudioGenerator'

export const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>(
    'Welcome to SmartTools India! This advanced text-to-speech studio turns your typed or pasted text into clear, natural spoken audio directly inside your web browser. Try adjusting the voice, playback speed, pitch, and volume controls below.'
  )

  const isBrowserTtsSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  // TTS Manager singleton instance
  const ttsManager = useMemo(() => new TTSManager(), [])

  // Engine & Provider state
  const [activeEngine, setActiveEngine] = useState<TTSProviderId>('browser')
  const [companionStatus, setCompanionStatus] = useState<CompanionServerStatus | undefined>()
  const [isCheckingCompanion, setIsCheckingCompanion] = useState<boolean>(false)
  const [isModelManagerOpen, setIsModelManagerOpen] = useState<boolean>(false)
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState<boolean>(false)
  const [isCloudConfigured, setIsCloudConfigured] = useState<boolean>(() => {
    const config = CloudNeuralTTSProvider.getConfig()
    return !!(config && config.apiKey.trim())
  })

  // Voice & Language state
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [volume, setVolume] = useState<number>(1.0)
  const [selectedStyle, setSelectedStyle] = useState<'normal' | 'business' | 'promo' | 'explainer' | 'calm'>('normal')
  const [isUrduRtl, setIsUrduRtl] = useState<boolean>(false)

  // Playback state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false)
  const [progressInfo, setProgressInfo] = useState<TTSProgressInfo | null>(null)

  // Feedback & Audio generation state
  const [copied, setCopied] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pasteSuccess, setPasteSuccess] = useState<boolean>(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioOutput | null>(null)
  const [neuralProgress, setNeuralProgress] = useState<{ stage: string; percent: number; detail?: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const MAX_CHARACTERS = 5000

  // Detect language and script from input text
  const detectedLang: DetectedLanguage | null = useMemo(() => {
    return detectLanguageFromText(text)
  }, [text])

  // Probe companion server
  const checkCompanion = useCallback(async () => {
    setIsCheckingCompanion(true)
    try {
      const status = await ttsManager.checkCompanionStatus()
      setCompanionStatus(status)
      if (status.isAvailable && activeEngine === 'browser') {
        setActiveEngine('companion')
        ttsManager.setActiveProvider('companion')
      }
    } finally {
      setIsCheckingCompanion(false)
    }
  }, [ttsManager, activeEngine])

  useEffect(() => {
    const timer = setTimeout(() => {
      checkCompanion()
    }, 0)
    return () => clearTimeout(timer)
  }, [checkCompanion])

  // Load voices whenever active engine or browser voices change
  const refreshVoices = useCallback(() => {
    ttsManager.getAllVoices(selectedLanguage).then((available) => {
      setVoices(available)
    }).catch((err) => {
      console.warn('Failed to load TTS voices', err)
    })
  }, [ttsManager, selectedLanguage])

  useEffect(() => {
    let mounted = true
    const update = () => {
      ttsManager.getAllVoices(selectedLanguage).then((available) => {
        if (mounted) setVoices(available)
      }).catch((err) => {
        console.warn('Failed to load TTS voices', err)
      })
    }

    const timer = setTimeout(update, 0)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', update)
      const delayedTimer = setTimeout(update, 350)
      return () => {
        mounted = false
        clearTimeout(timer)
        clearTimeout(delayedTimer)
        window.speechSynthesis.removeEventListener('voiceschanged', update)
      }
    }
    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [ttsManager, selectedLanguage, activeEngine])

  // Handle engine switch
  const handleSelectEngine = (engineId: TTSProviderId) => {
    handleStop()
    setActiveEngine(engineId)
    ttsManager.setActiveProvider(engineId)
    // If switching to local-neural, reset language filter if current language is not supported
    if (engineId === 'local-neural') {
      if (selectedLanguage !== 'all' && !selectedLanguage.startsWith('en') && !selectedLanguage.startsWith('hi')) {
        setSelectedLanguage('all')
      }
    }
    refreshVoices()
  }

  // Language options for filter dropdown
  const languageOptions = useMemo(() => {
    const langs = new Map<string, { code: string; label: string; count: number; isRegional: boolean }>()

    voices.forEach((v) => {
      const code = v.lang
      const normalized = code.split('-')[0].toLowerCase()

      let label = code
      let isRegional = false

      if (code.toLowerCase() === 'en-in') {
        label = 'English (India)'
        isRegional = true
      } else if (code.toLowerCase() === 'en-us') {
        label = 'English (US)'
      } else if (code.toLowerCase() === 'en-gb') {
        label = 'English (UK)'
      } else if (normalized === 'hi') {
        label = 'Hindi (हिंदी)'
        isRegional = true
      } else if (normalized === 'bn') {
        label = 'Bengali (বাংলা)'
        isRegional = true
      } else if (normalized === 'ur') {
        label = 'Urdu (اردو)'
        isRegional = true
      } else if (normalized === 'ta') {
        label = 'Tamil (தமிழ்)'
        isRegional = true
      } else if (normalized === 'te') {
        label = 'Telugu (తెలుగు)'
        isRegional = true
      } else if (normalized === 'mr') {
        label = 'Marathi (मराठी)'
        isRegional = true
      } else if (normalized === 'gu') {
        label = 'Gujarati (ગુજરાતી)'
        isRegional = true
      } else if (normalized === 'kn') {
        label = 'Kannada (ಕನ್ನಡ)'
        isRegional = true
      } else if (normalized === 'ml') {
        label = 'Malayalam (മലയാളം)'
        isRegional = true
      } else if (normalized === 'pa') {
        label = 'Punjabi (ਪੰਜਾਬੀ)'
        isRegional = true
      } else if (normalized === 'en') {
        label = `English (${code})`
      }

      const key = label
      if (langs.has(key)) {
        langs.get(key)!.count += 1
      } else {
        langs.set(key, { code, label, count: 1, isRegional })
      }
    })

    return Array.from(langs.values()).sort((a, b) => {
      if (a.isRegional && !b.isRegional) return -1
      if (!a.isRegional && b.isRegional) return 1
      return a.label.localeCompare(b.label)
    })
  }, [voices])

  // Filter voices according to chosen language
  const filteredVoices = useMemo(() => {
    if (selectedLanguage === 'all') return voices
    return voices.filter((v) => {
      const vLang = v.lang.toLowerCase()
      const sLang = selectedLanguage.toLowerCase()
      if (sLang.startsWith('en') && vLang.startsWith('en')) {
        if (sLang === 'en-in' && vLang === 'en-in') return true
        if (sLang === 'en-us' && vLang === 'en-us') return true
        if (sLang === 'en-gb' && vLang === 'en-gb') return true
        return sLang === 'en' || vLang.startsWith(sLang) || vLang === 'en'
      }
      if (sLang.startsWith('hi') && vLang.startsWith('hi')) return true
      if (sLang.startsWith('bn') && vLang.startsWith('bn')) return true
      if (sLang.startsWith('ur') && vLang.startsWith('ur')) return true
      return vLang.startsWith(sLang) || sLang.startsWith(vLang)
    })
  }, [voices, selectedLanguage])

  // Compute effective voice URI without cascading effects
  const effectiveVoiceId = useMemo(() => {
    if (selectedVoiceId && filteredVoices.some((v) => v.id === selectedVoiceId)) {
      return selectedVoiceId
    }
    if (filteredVoices.length > 0) {
      const preferred =
        filteredVoices.find((v) => v.lang.toLowerCase().startsWith('en-in')) ||
        filteredVoices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
        filteredVoices[0]
      return preferred ? preferred.id : filteredVoices[0].id
    }
    return ''
  }, [filteredVoices, selectedVoiceId])

  const selectedVoice = useMemo(() => {
    return voices.find((v) => v.id === effectiveVoiceId) || null
  }, [voices, effectiveVoiceId])

  // Check if detected text language differs from selected voice language
  const isLanguageMismatch = useMemo(() => {
    if (!detectedLang || !selectedVoice) return false
    const vLang = selectedVoice.lang.toLowerCase()
    if (detectedLang.code === 'hi' && !vLang.startsWith('hi')) return true
    if (detectedLang.code === 'bn' && !vLang.startsWith('bn')) return true
    if (detectedLang.code === 'ur' && !vLang.startsWith('ur')) return true
    if (detectedLang.code === 'en' && !vLang.startsWith('en')) return true
    return false
  }, [detectedLang, selectedVoice])

  // Handle switching to detected language voice
  const handleSwitchToDetectedVoice = () => {
    if (!detectedLang) return
    const match = voices.find((v) => {
      const l = v.lang.toLowerCase()
      if (detectedLang.code === 'en') return l.startsWith('en')
      return l.startsWith(detectedLang.code.toLowerCase())
    })
    if (match) {
      setSelectedLanguage(detectedLang.code)
      setSelectedVoiceId(match.id)
      if (detectedLang.isRtl) setIsUrduRtl(true)
    } else {
      setSelectedLanguage(detectedLang.code)
    }
  }

  // Play handler
  const handlePlay = async () => {
    setErrorMessage(null)
    const trimmed = text.trim()
    if (!trimmed) {
      setErrorMessage('Please type or paste some text to speak.')
      textareaRef.current?.focus()
      return
    }

    try {
      setIsSpeaking(true)
      setIsPaused(false)
      setIsPreviewing(false)

      await ttsManager.speak(
        trimmed,
        {
          voiceId: effectiveVoiceId,
          rate,
          pitch,
          volume,
        },
        {
          onStart: () => {
            setIsSpeaking(true)
            setIsPaused(false)
          },
          onProgress: (prog) => {
            setProgressInfo(prog)
          },
          onPause: () => {
            setIsPaused(true)
          },
          onResume: () => {
            setIsPaused(false)
          },
          onEnd: () => {
            setIsSpeaking(false)
            setIsPaused(false)
            setProgressInfo(null)
          },
          onError: (err) => {
            setIsSpeaking(false)
            setIsPaused(false)
            setProgressInfo(null)
            setErrorMessage(err.message || 'Speech playback encountered an error.')
          },
        }
      )
    } catch (err: unknown) {
      setIsSpeaking(false)
      setIsPaused(false)
      setProgressInfo(null)
      const msg = err instanceof Error ? err.message : 'Unable to play speech.'
      setErrorMessage(msg)
    }
  }

  // Voice sample preview handler
  const handlePreviewVoice = async () => {
    if (!selectedVoice) return
    handleStop()
    setIsPreviewing(true)
    setErrorMessage(null)

    try {
      await ttsManager.preview(selectedVoice.id, { rate, pitch, volume })
      setIsPreviewing(false)
    } catch {
      setIsPreviewing(false)
    }
  }

  const handlePause = () => {
    if (!isSpeaking || isPaused) return
    ttsManager.pause()
    setIsPaused(true)
  }

  const handleResume = () => {
    if (!isSpeaking || !isPaused) return
    ttsManager.resume()
    setIsPaused(false)
  }

  const handleStop = () => {
    ttsManager.stop()
    setIsSpeaking(false)
    setIsPaused(false)
    setIsPreviewing(false)
    setProgressInfo(null)
  }

  // Text management handlers
  const handleCopy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText()
      if (clipText) {
        setText(clipText.slice(0, MAX_CHARACTERS))
        setPasteSuccess(true)
        setTimeout(() => setPasteSuccess(false), 2000)
      }
    } catch {
      setErrorMessage('Clipboard access was blocked by your browser. You can paste using Ctrl+V or right-click.')
    }
  }

  const handleClear = () => {
    handleStop()
    if (generatedAudio?.url) {
      revokeSpeechAudioUrl(generatedAudio.url)
    }
    setGeneratedAudio(null)
    setText('')
    setErrorMessage(null)
    textareaRef.current?.focus()
  }

  // Load verified test sentences from prompt Section 10
  const handleInsertSample = (type: 'bn' | 'hi' | 'en' | 'ur' | 'story') => {
    handleStop()
    if (generatedAudio?.url) {
      revokeSpeechAudioUrl(generatedAudio.url)
    }
    setGeneratedAudio(null)

    if (type === 'bn') {
      setText('আজকের দিনটা খুব সুন্দর। আমি তোমার সঙ্গে কথা বলতে পেরে আনন্দিত।')
      setIsUrduRtl(false)
      if (activeEngine === 'local-neural') {
        const nextEngine = companionStatus?.isAvailable ? 'companion' : 'browser'
        setActiveEngine(nextEngine)
        ttsManager.setActiveProvider(nextEngine)
      }
      setSelectedLanguage('bn')
      const match = voices.find((v) => v.lang.toLowerCase().startsWith('bn'))
      if (match) setSelectedVoiceId(match.id)
    } else if (type === 'hi') {
      setText('आज का दिन बहुत सुंदर है। मुझे आपसे बात करके खुशी हुई।')
      setIsUrduRtl(false)
      setSelectedLanguage('hi')
      const match = voices.find((v) => v.lang.toLowerCase().startsWith('hi'))
      if (match) setSelectedVoiceId(match.id)
    } else if (type === 'en') {
      setText('Hello! Welcome to SmartTools India. I hope you are having a wonderful day.')
      setIsUrduRtl(false)
      setSelectedLanguage('en')
      const match = voices.find((v) => v.lang.toLowerCase().startsWith('en'))
      if (match) setSelectedVoiceId(match.id)
    } else if (type === 'ur') {
      setText('آج کا دن بہت خوبصورت ہے۔ آپ سے بات کرکے مجھے خوشی ہوئی۔')
      setIsUrduRtl(true)
      if (activeEngine === 'local-neural') {
        const nextEngine = companionStatus?.isAvailable ? 'companion' : 'browser'
        setActiveEngine(nextEngine)
        ttsManager.setActiveProvider(nextEngine)
      }
      setSelectedLanguage('ur')
      const match = voices.find((v) => v.lang.toLowerCase().startsWith('ur'))
      if (match) setSelectedVoiceId(match.id)
    } else {
      setText(
        'Once upon a time in ancient India, scholars invented the decimal numbering system and the concept of zero. Today, digital technology allows us to calculate, create, and communicate faster than ever before. Enjoy learning and exploring everyday tools on SmartTools India!'
      )
      setIsUrduRtl(false)
    }
    setErrorMessage(null)
  }

  // Handle Delivery Style selection (rate, pitch, volume preset)
  const handleSelectDeliveryStyle = (styleId: 'normal' | 'business' | 'promo' | 'explainer' | 'calm') => {
    setSelectedStyle(styleId)
    if (styleId === 'normal') {
      setRate(1.0)
      setPitch(1.0)
      setVolume(1.0)
    } else if (styleId === 'business') {
      setRate(1.05)
      setPitch(1.02)
      setVolume(1.0)
    } else if (styleId === 'promo') {
      setRate(1.18)
      setPitch(1.12)
      setVolume(1.0)
    } else if (styleId === 'explainer') {
      setRate(0.92)
      setPitch(1.0)
      setVolume(1.0)
    } else if (styleId === 'calm') {
      setRate(0.84)
      setPitch(0.94)
      setVolume(0.95)
    }
  }

  // Handle audio generation and download
  const handleDownloadAudio = async () => {
    setErrorMessage(null)
    const trimmed = text.trim()
    if (!trimmed) {
      setErrorMessage('Please type or paste some text before downloading audio.')
      textareaRef.current?.focus()
      return
    }

    try {
      setIsGeneratingAudio(true)
      setNeuralProgress({ stage: 'Initializing audio synthesis...', percent: 5 })

      if (generatedAudio?.url) {
        revokeSpeechAudioUrl(generatedAudio.url)
        setGeneratedAudio(null)
      }

      const result = await ttsManager.downloadAudio(
        trimmed,
        {
          voiceId: effectiveVoiceId,
          rate,
          pitch,
          volume,
        },
        (prog) => setNeuralProgress(prog)
      )

      setGeneratedAudio(result)

      // Automatically trigger client-side download of genuine audio file
      const anchor = document.createElement('a')
      anchor.href = result.url
      anchor.download = result.filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate audio file.'
      setErrorMessage(msg)
    } finally {
      setIsGeneratingAudio(false)
      setNeuralProgress(null)
    }
  }

  const charCount = text.length
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const estimatedDurationSecs = estimateSpeechDurationSeconds(text, rate, detectedLang?.code || 'en')
  const estimatedDurationFormatted = formatSpeechDuration(estimatedDurationSecs)

  return (
    <div className="space-y-8">
      {/* Unsupported Browser Alert */}
      {!isBrowserTtsSupported && activeEngine === 'browser' && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-5 flex items-start gap-3.5 text-rose-800 dark:text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h3 className="font-semibold text-rose-900 dark:text-rose-100">Speech Synthesis Not Supported</h3>
            <p className="mt-1 text-rose-700 dark:text-rose-300">
              Your web browser does not support the Web Speech API. For the best natural voices, please open SmartTools India in Google Chrome, Microsoft Edge, Apple Safari, or Mozilla Firefox.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Hybrid Neural Text-to-Speech Studio 2.0
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                    <AudioLines className="h-3 w-3" />
                    {isPaused ? 'Paused' : 'Speaking...'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multilingual AI Voice Engine • Bengali • Hindi • English • Urdu
              </p>
            </div>
          </div>

          {/* Benchmark Test Sample Buttons (Mandatory Section 10) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">Benchmark Tests:</span>
            <button
              type="button"
              onClick={() => handleInsertSample('bn')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-slate-700 dark:text-slate-300 font-medium"
              title="Bengali benchmark test sentence"
            >
              🇧🇩 বাংলা
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('hi')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-slate-700 dark:text-slate-300 font-medium"
              title="Hindi benchmark test sentence"
            >
              🇮🇳 हिंदी
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('en')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300 font-medium"
              title="English benchmark test sentence"
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('ur')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 transition-colors text-slate-700 dark:text-slate-300 font-medium"
              title="Urdu benchmark test sentence"
            >
              🇵🇰 اردو
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('story')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium hidden sm:inline-block"
            >
              Story
            </button>
          </div>
        </div>

        {/* Engine Selection Bar */}
        <EngineSelector
          activeEngine={activeEngine}
          onSelectEngine={handleSelectEngine}
          onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
          isCloudConfigured={isCloudConfigured}
          companionStatus={companionStatus}
          onToggleModelManager={() => setIsModelManagerOpen(!isModelManagerOpen)}
          isModelManagerOpen={isModelManagerOpen}
        />

        {/* Optional Model Download Storage Manager */}
        {isModelManagerOpen && (
          <ModelDownloadManager onClose={() => setIsModelManagerOpen(false)} />
        )}

        {/* Companion Server Standby Instruction Card */}
        {activeEngine === 'companion' && !companionStatus?.isAvailable && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 space-y-2.5 text-xs text-amber-900 dark:text-amber-200 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Server className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Companion Neural Engine (Localhost 127.0.0.1:8000) Standby</span>
              </div>
              <button
                type="button"
                onClick={checkCompanion}
                disabled={isCheckingCompanion}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shadow-2xs"
              >
                <RefreshCw className={`h-3 w-3 ${isCheckingCompanion ? 'animate-spin' : ''}`} />
                <span>{isCheckingCompanion ? 'Checking...' : 'Check Connection'}</span>
              </button>
            </div>
            <p className="leading-relaxed">
              To unlock authentic 24kHz studio-quality neural voices in <strong>Bengali, Hindi, English, and Urdu</strong> on your PC:
            </p>
            <div className="bg-amber-100/80 dark:bg-amber-900/50 p-2.5 rounded-lg font-mono text-[11px] text-amber-950 dark:text-amber-100">
              Double-click: <code>server/run_tts.bat</code> (or run <code>python server/tts_server.py</code>)
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300">
              Tip: While the companion engine is in standby, you can also use <strong>In-Browser Neural</strong> (for English &amp; Hindi) or <strong>Free Browser Voice</strong> (all languages).
            </p>
          </div>
        )}

        {/* In-Browser Neural Language Compatibility Notice */}
        {activeEngine === 'local-neural' && (selectedLanguage === 'bn' || selectedLanguage === 'ur' || detectedLang?.code === 'bn' || detectedLang?.code === 'ur') && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 flex items-start gap-2.5 text-xs text-indigo-900 dark:text-indigo-200 animate-fade-in">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Language Availability Notice for In-Browser Neural</p>
              <p className="mt-0.5 text-indigo-800 dark:text-indigo-300 leading-relaxed">
                In-browser WebAssembly ONNX currently supports <strong>English</strong> and <strong>Hindi</strong> (~38 MB models). For authentic 24kHz <strong>Bengali</strong> and <strong>Urdu</strong> neural speech, switch to the <strong>Companion Neural Engine</strong> or <strong>Free Browser Voice</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Text Area Card with Live Counter and Actions */}
        <div className="space-y-2">
          {/* Smart Language Detection Banner */}
          {detectedLang && isLanguageMismatch && activeEngine === 'browser' && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in text-xs">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                <Languages className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Detected script: <strong>{detectedLang.name} ({detectedLang.nativeName})</strong>. Selected voice is <em>{selectedVoice?.name}</em>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSwitchToDetectedVoice}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-2xs transition-colors shrink-0"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Switch to {detectedLang.name} Voice</span>
              </button>
            </div>
          )}

          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
            {/* Top Toolbar inside Text Area */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/60 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  Enter text to read aloud
                </span>
                {detectedLang && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Globe className="h-2.5 w-2.5" />
                    {detectedLang.name} ({detectedLang.confidence}%)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsUrduRtl(!isUrduRtl)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    isUrduRtl
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                  title="Toggle Right-to-Left (RTL) script for Urdu"
                >
                  <span>{isUrduRtl ? 'RTL: On' : 'اردو / RTL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePaste}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!text}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                  title="Copy text to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!text}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
                  title="Clear text area"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Main Text Input */}
            <textarea
              ref={textareaRef}
              dir={isUrduRtl ? 'rtl' : 'ltr'}
              style={{
                fontFamily: isUrduRtl ? "'Noto Nastaliq Urdu', 'Urdu Typesetting', Arial, sans-serif" : undefined,
              }}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_CHARACTERS))
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="Type or paste your text here (Bengali, Hindi, English, Urdu, or any language)..."
              rows={7}
              className="w-full bg-transparent p-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none leading-relaxed"
              aria-label="Text to speech input"
            />

            {/* Bottom Character, Word Counter & Duration */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className={charCount >= MAX_CHARACTERS ? 'text-rose-600 font-semibold' : ''}>
                  {charCount.toLocaleString('en-IN')} / {MAX_CHARACTERS.toLocaleString('en-IN')} chars
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span title="Estimated speech duration at current speed">
                  Est. Duration: <strong className="text-slate-700 dark:text-slate-300">{estimatedDurationFormatted}</strong>
                </span>
              </div>

              {progressInfo && isSpeaking && (
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                  <span>Sentence {progressInfo.activeSentenceIndex + 1} of {progressInfo.totalSentences}</span>
                </div>
              )}
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium animate-fade-in">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>

        {/* Live Spoken Sentence Highlighter (Active when speaking) */}
        {isSpeaking && progressInfo?.currentSentenceText && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3.5 space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <AudioLines className="h-3.5 w-3.5 animate-pulse" />
                Speaking Sentence {progressInfo.activeSentenceIndex + 1} of {progressInfo.totalSentences}:
              </span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                {progressInfo.percent}%
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed line-clamp-2">
              &ldquo;{progressInfo.currentSentenceText}&rdquo;
            </p>
            {/* Smooth sentence progress bar */}
            <div className="w-full bg-blue-200/70 dark:bg-blue-900/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressInfo.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Voice and Audio Controls Grid */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-4 sm:p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <Sliders className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Voice &amp; Audio Settings</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setRate(1.0)
                setPitch(1.0)
                setVolume(1.0)
                setSelectedStyle('normal')
              }}
              className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 font-medium"
              title="Reset speed, pitch, and volume to default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Settings</span>
            </button>
          </div>

          {/* Vocal Delivery Tone (Studio Presets) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                Vocal Cadence Presets
              </span>
              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                Pacing, pitch &amp; tone presets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'normal' as const, label: 'Natural', desc: 'Balanced Narration' },
                { id: 'business' as const, label: 'Crisp', desc: 'Corporate & Clear' },
                { id: 'promo' as const, label: 'Brisk', desc: 'Energetic & Fast' },
                { id: 'explainer' as const, label: 'Explainer', desc: 'Friendly & Articulate' },
                { id: 'calm' as const, label: 'Soothing', desc: 'Relaxed & Deliberate' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleSelectDeliveryStyle(style.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedStyle === style.id
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`text-xs font-bold ${selectedStyle === style.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {style.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {style.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice & Language Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language Filter */}
            <div>
              <label htmlFor="tts-language-filter" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Filter by Language
              </label>
              <select
                id="tts-language-filter"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="all">All Available Languages ({voices.length} voices)</option>
                {languageOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Dropdown with Preview Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="tts-voice-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Voice
                </label>
                <div className="flex items-center gap-2">
                  {selectedVoice && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedVoice.tier === 'neural-hq'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : selectedVoice.tier === 'local-neural'
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : selectedVoice.tier === 'natural'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : selectedVoice.tier === 'cloud'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {selectedVoice.tierLabel}
                    </span>
                  )}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    {filteredVoices.length} available
                  </span>
                  <button
                    type="button"
                    onClick={refreshVoices}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Refresh available voices"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="tts-voice-select"
                  value={effectiveVoiceId}
                  onChange={(e) => setSelectedVoiceId(e.target.value)}
                  disabled={filteredVoices.length === 0}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 truncate"
                >
                  {filteredVoices.length === 0 ? (
                    <option value="">No voices available for selected filter</option>
                  ) : (
                    filteredVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName} ({v.lang}) — [{v.tierLabel}]
                      </option>
                    ))
                  )}
                </select>

                {/* Voice Preview Button */}
                <button
                  type="button"
                  onClick={handlePreviewVoice}
                  disabled={!selectedVoice}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 ${
                    isPreviewing
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                  title="Listen to a quick sample of this voice"
                >
                  <Ear className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isPreviewing ? 'Listening...' : 'Preview'}</span>
                </button>
              </div>

              {filteredVoices.length === 0 && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>No voices match the current language &amp; engine filter</span>
                  </div>
                  {activeEngine === 'local-neural' ? (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      In-Browser Neural ONNX engine currently supports English and Hindi on-device.
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage('all')}
                        className="ml-1 underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        Show All Neural Voices
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={() => handleSelectEngine('browser')}
                        className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        Switch to Free Browser Voice
                      </button>.
                    </p>
                  ) : activeEngine === 'companion' && !companionStatus?.isAvailable ? (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      Companion server is offline. Run <code>server/run_tts.bat</code> locally on your PC, or
                      <button
                        type="button"
                        onClick={() => handleSelectEngine('local-neural')}
                        className="ml-1 underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        Switch to In-Browser Neural
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={() => handleSelectEngine('browser')}
                        className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        Free Browser Voice
                      </button>.
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      Try resetting the filter to
                      <button
                        type="button"
                        onClick={() => setSelectedLanguage('all')}
                        className="ml-1 underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        All Available Languages
                      </button>
                      {' or '}
                      <button
                        type="button"
                        onClick={refreshVoices}
                        className="underline font-bold hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        Reload System Voices
                      </button>.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Speed, Pitch, Volume Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Speed (Rate) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Speed</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Speech speed"
              />
              <div className="flex justify-between gap-1">
                {[0.8, 1.0, 1.2, 1.5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRate(val)}
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      rate === val
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {val.toFixed(1)}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Pitch (Tone)</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Speech pitch"
              />
              <div className="flex justify-between gap-1">
                {[
                  { label: 'Deep', val: 0.8 },
                  { label: 'Natural', val: 1.0 },
                  { label: 'High', val: 1.2 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPitch(item.val)}
                    className={`text-[10px] px-2 py-0.5 rounded flex-1 ${
                      pitch === item.val
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  {volume === 0 ? <VolumeX className="h-3.5 w-3.5 text-rose-500" /> : <Volume2 className="h-3.5 w-3.5" />}
                  Volume
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Speech volume"
              />
              <div className="flex justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setVolume(volume === 0 ? 1.0 : 0)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-1"
                >
                  {volume === 0 ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={() => setVolume(0.5)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-1"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setVolume(1.0)}
                  className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-1"
                >
                  100%
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Waveform Visualizer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <AudioLines className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              Real-Time Vocal Activity Visualizer
            </span>
            <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
              {isSpeaking ? (isPaused ? 'Paused' : 'Playing live audio...') : isPreviewing ? 'Voice Preview' : 'Ready'}
            </span>
          </div>
          <WaveformVisualizer isPlaying={isSpeaking || isPreviewing || isGeneratingAudio} height={48} />
        </div>

        {/* Primary Playback Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Main Big Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isSpeaking ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-blue-500/20 transition-all duration-200 cursor-pointer"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Play Speech</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-emerald-500/20 transition-all duration-200 animate-pulse cursor-pointer"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-amber-500/20 transition-all duration-200 cursor-pointer"
              >
                <Pause className="h-5 w-5 fill-white" />
                <span>Pause</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleStop}
              disabled={!isSpeaking}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 px-5 py-3 text-sm sm:text-base font-semibold disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadAudio}
              disabled={isGeneratingAudio || !text.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 active:scale-95 px-5 py-3 text-sm sm:text-base font-bold shadow-md transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              title="Download audio file"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white dark:text-slate-900" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Audio</span>
                </>
              )}
            </button>
          </div>

          {/* Sound Waves & Playback Feedback */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {isSpeaking && !isPaused ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300">
                <span className="inline-block w-1.5 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="inline-block w-1.5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="inline-block w-1.5 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="inline-block w-1.5 h-4 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                <span className="ml-1 font-medium">Reading aloud</span>
              </div>
            ) : isPaused ? (
              <div className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                Paused • Click Resume to continue
              </div>
            ) : isPreviewing ? (
              <div className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium animate-pulse">
                Previewing voice sample...
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>Ready to synthesize</span>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Generation Progress Bar */}
        {isGeneratingAudio && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-100">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span>{neuralProgress?.stage || 'Synthesizing audio...'}</span>
              </div>
              <span>{neuralProgress?.percent ?? 5}%</span>
            </div>

            <div className="w-full bg-blue-200 dark:bg-blue-900 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, neuralProgress?.percent ?? 5)}%` }}
              />
            </div>

            {neuralProgress?.detail && (
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-mono">
                {neuralProgress.detail}
              </p>
            )}
          </div>
        )}

        {/* Generated Audio Download & Player Section */}
        {generatedAudio && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                  <FileAudio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Audio Generated Successfully
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {generatedAudio.format.toUpperCase()} • {Math.round(generatedAudio.sizeBytes / 1024)} KB • {generatedAudio.durationSeconds > 0 ? `${generatedAudio.durationSeconds.toFixed(1)}s • ` : ''}{generatedAudio.sampleRate / 1000} kHz
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={generatedAudio.url}
                  download={generatedAudio.filename}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Save {generatedAudio.format.toUpperCase()} File</span>
                </a>
              </div>
            </div>

            {/* Embedded Audio Preview Player */}
            <div className="pt-1">
              <audio controls src={generatedAudio.url} className="w-full h-10 rounded-lg">
                Your browser does not support HTML5 audio playback.
              </audio>
            </div>
          </div>
        )}
      </div>

      {/* Voice Engine & Quality Transparency Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm sm:text-base">
          <Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3>Understanding Voice Engines &amp; Speech Quality</h3>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          SmartTools India maintains full transparency about audio generation technologies. We never falsely label standard browser speech as AI Neural speech. Here is how each engine operates:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Companion Neural Engine */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
              <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Companion 24kHz Studio Engine</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Provides authentic 24kHz natural voices for <strong>Bengali</strong>, <strong>Hindi</strong>, <strong>English</strong>, and <strong>Urdu</strong>. Runs locally on your machine via FastAPI (<code>run_tts.bat</code>) with zero external API keys and studio-quality intonation.
            </p>
          </div>

          {/* In-Browser Neural AI */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs sm:text-sm">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>In-Browser WebAssembly ONNX</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Runs <strong>Meta MMS-TTS</strong> client-side on WebAssembly. Downloaded on-demand (~38 MB per language for English and Hindi) and cached in browser storage for 100% private, offline WAV generation.
            </p>
          </div>

          {/* Free Browser Voice */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs sm:text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Free Browser Voice (0 MB)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Leverages your operating system and browser&apos;s native Web Speech synthesis. Zero downloads, instant response, and wide language coverage with honest labeling.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Setup Guidance Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              100% Client-Side Privacy
            </p>
            <p className="leading-relaxed">
              All speech playback and neural waveform rendering execute locally on your device. Your typed or pasted text is never transmitted to external servers or logged.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Windows Setup (127.0.0.1)
            </p>
            <p className="leading-relaxed">
              For studio neural voices, open a terminal in <code>server/</code> and run <code>run_tts.bat</code>. It starts a lightweight, secure FastAPI companion service binding only to localhost.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Zero Paid Subscriptions
            </p>
            <p className="leading-relaxed">
              No mandatory API keys, logins, or hidden paywalls. Built using open web standards, edge-tts neural synthesis, and Meta MMS-TTS.
            </p>
          </div>
        </div>
      </div>

      {/* Cloud BYOK Settings Modal */}
      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
        onSaved={() => {
          const config = CloudNeuralTTSProvider.getConfig()
          setIsCloudConfigured(!!(config && config.apiKey.trim()))
          refreshVoices()
        }}
      />
    </div>
  )
}
