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
  Wand2
} from 'lucide-react'
import { WaveformVisualizer } from '../../components/common/WaveformVisualizer'
import {
  createIntelligentSpeechChunks,
  type SpeechChunk
} from '../../utils/speechChunker'
import {
  detectLanguageFromText,
  categorizeVoice,
  findBestVoiceForLanguage,
  estimateSpeechDurationSeconds,
  formatSpeechDuration,
  NATIVE_PREVIEWS,
  type DetectedLanguage,
  type EnhancedVoiceInfo
} from '../../utils/languageDetector'
import {
  generateSpeechWav,
  revokeSpeechAudioUrl,
  type GeneratedAudioResult
} from '../../utils/wavAudioGenerator'
import {
  generateNeuralSpeech,
  type NeuralLanguage,
  type NeuralProgressInfo
} from '../../utils/neuralSpeechService'

export const TextToSpeech: React.FC = () => {
  const [text, setText] = useState<string>(
    'Welcome to SmartTools India! This advanced text-to-speech studio turns your typed or pasted text into clear, natural spoken audio directly inside your web browser. Try adjusting the voice, playback speed, pitch, and volume controls below.'
  )
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices()
    }
    return []
  })
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')
  const [rate, setRate] = useState<number>(1.0)
  const [pitch, setPitch] = useState<number>(1.0)
  const [volume, setVolume] = useState<number>(1.0)
  const [selectedStyle, setSelectedStyle] = useState<'normal' | 'business' | 'promo' | 'explainer' | 'calm'>('normal')
  const [isUrduRtl, setIsUrduRtl] = useState<boolean>(false)

  // Playback state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [activeChunkIndex, setActiveChunkIndex] = useState<number>(0)
  const [totalChunks, setTotalChunks] = useState<number>(0)
  const [currentChunkText, setCurrentChunkText] = useState<string>('')
  const [isPreviewingVoice, setIsPreviewingVoice] = useState<boolean>(false)

  // Utility feedback state
  const [copied, setCopied] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pasteSuccess, setPasteSuccess] = useState<boolean>(false)

  // Client-side audio generation & download state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false)
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioResult | null>(null)
  const [downloadEngine, setDownloadEngine] = useState<'neural' | 'fast'>('neural')
  const [neuralLanguage, setNeuralLanguage] = useState<NeuralLanguage>('en')
  const [neuralProgress, setNeuralProgress] = useState<NeuralProgressInfo | null>(null)
  const [audioModelUsed, setAudioModelUsed] = useState<string>('')
  const generatedAudioRef = useRef<GeneratedAudioResult | null>(null)

  // Refs for tracking playback without closure staleness
  const intelligentChunksRef = useRef<SpeechChunk[]>([])
  const chunkIndexRef = useRef<number>(0)
  const isCancelledRef = useRef<boolean>(false)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const previewUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const keepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const speakNextChunkRef = useRef<() => void>(() => {})

  const MAX_CHARACTERS = 5000

  // Detect language and script from input text
  const detectedLang: DetectedLanguage | null = useMemo(() => {
    return detectLanguageFromText(text)
  }, [text])

  const hasDevanagari = useMemo(() => /[\u0900-\u097F]/.test(text), [text])
  const hasBengali = useMemo(() => /[\u0980-\u09FF]/.test(text), [text])
  const hasUrdu = useMemo(() => /[\u0600-\u06FF]/.test(text), [text])

  // Clean up keep-alive timers and audio URLs
  useEffect(() => {
    return () => {
      if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current)
      if (generatedAudioRef.current?.url) {
        revokeSpeechAudioUrl(generatedAudioRef.current.url)
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Listen to browser voices event & sort by quality
  useEffect(() => {
    if (!isSupported) return

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices()
      if (!available || available.length === 0) return

      // Categorize and sort voices: Natural Online & Cloud first, then regional Indian voices
      const categorized = available.map((v) => categorizeVoice(v))
      categorized.sort((a, b) => {
        // First sort by quality score
        if (b.score !== a.score) return b.score - a.score
        // Then sort by language name
        return a.voice.lang.localeCompare(b.voice.lang)
      })

      setVoices(categorized.map((c) => c.voice))
    }

    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    const timer = setTimeout(updateVoices, 350)

    return () => {
      clearTimeout(timer)
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
      window.speechSynthesis.cancel()
    }
  }, [isSupported])

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
      if (selectedLanguage.startsWith('en-in') && v.lang.toLowerCase() === 'en-in') return true
      if (selectedLanguage.startsWith('en-us') && v.lang.toLowerCase() === 'en-us') return true
      if (selectedLanguage.startsWith('en-gb') && v.lang.toLowerCase() === 'en-gb') return true
      return v.lang.toLowerCase().startsWith(selectedLanguage.toLowerCase())
    })
  }, [voices, selectedLanguage])

  // Enhanced voice representations with quality tiers
  const enhancedVoices: EnhancedVoiceInfo[] = useMemo(() => {
    return filteredVoices.map((v) => categorizeVoice(v))
  }, [filteredVoices])

  // Compute effective voice URI without cascading effects
  const effectiveVoiceURI = useMemo(() => {
    if (selectedVoiceURI && filteredVoices.some((v) => v.voiceURI === selectedVoiceURI)) {
      return selectedVoiceURI
    }
    if (filteredVoices.length > 0) {
      const preferred =
        filteredVoices.find((v) => v.lang.toLowerCase().startsWith('en-in')) ||
        filteredVoices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
        filteredVoices.find((v) => v.default) ||
        filteredVoices[0]
      return preferred ? preferred.voiceURI : filteredVoices[0].voiceURI
    }
    return ''
  }, [filteredVoices, selectedVoiceURI])

  const selectedVoice = useMemo(() => {
    return voices.find((v) => v.voiceURI === effectiveVoiceURI) || null
  }, [voices, effectiveVoiceURI])

  const selectedVoiceInfo = useMemo(() => {
    return selectedVoice ? categorizeVoice(selectedVoice) : null
  }, [selectedVoice])

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
    const match = findBestVoiceForLanguage(voices, detectedLang.code)
    if (match) {
      setSelectedLanguage(detectedLang.code)
      setSelectedVoiceURI(match.voiceURI)
      if (detectedLang.isRtl) setIsUrduRtl(true)
    } else {
      setSelectedLanguage(detectedLang.code)
    }
  }

  // Clear keep-alive heartbeat interval
  const clearKeepAlive = () => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current)
      keepAliveTimerRef.current = null
    }
  }

  // Core speech engine with intelligent sentence chunking & natural pauses
  const speakCurrentChunk = useCallback(() => {
    if (!isSupported) return
    if (isCancelledRef.current) return

    const chunks = intelligentChunksRef.current
    const index = chunkIndexRef.current

    if (index >= chunks.length) {
      clearKeepAlive()
      setIsSpeaking(false)
      setIsPaused(false)
      setActiveChunkIndex(0)
      setCurrentChunkText('')
      activeUtteranceRef.current = null
      return
    }

    const chunk = chunks[index]
    const utterance = new SpeechSynthesisUtterance(chunk.cleanText)

    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    }

    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => {
      if (!isCancelledRef.current) {
        setIsSpeaking(true)
        setIsPaused(false)
        setActiveChunkIndex(index)
        setCurrentChunkText(chunk.text)

        // Heartbeat to prevent Chromium / Safari 15-second speech queue freeze
        clearKeepAlive()
        keepAliveTimerRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause()
            window.speechSynthesis.resume()
          }
        }, 9000)
      }
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    utterance.onend = () => {
      clearKeepAlive()
      if (isCancelledRef.current) return

      chunkIndexRef.current += 1
      if (chunkIndexRef.current < chunks.length) {
        // Natural human breathing pause determined by punctuation structure
        const pauseDuration = chunk.pauseAfterMs || 100
        setTimeout(() => {
          speakNextChunkRef.current()
        }, pauseDuration)
      } else {
        setIsSpeaking(false)
        setIsPaused(false)
        setActiveChunkIndex(0)
        setCurrentChunkText('')
        activeUtteranceRef.current = null
      }
    }

    utterance.onerror = (event) => {
      clearKeepAlive()
      // Ignore user-induced cancel errors
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return
      }
      setErrorMessage(`Speech playback interrupted: ${event.error || 'Playback stopped'}`)
      setIsSpeaking(false)
      setIsPaused(false)
      activeUtteranceRef.current = null
    }

    // Keep reference alive to avoid browser garbage collection bug
    activeUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported, selectedVoice, rate, pitch, volume])

  useEffect(() => {
    speakNextChunkRef.current = speakCurrentChunk
  }, [speakCurrentChunk])

  // Play handler
  const handlePlay = () => {
    setErrorMessage(null)
    const trimmed = text.trim()
    if (!trimmed) {
      setErrorMessage('Please type or paste some text to speak.')
      textareaRef.current?.focus()
      return
    }

    if (!isSupported) {
      setErrorMessage('Speech Synthesis is not supported in this browser. Please try Chrome, Edge, Safari, or Firefox.')
      return
    }

    // Stop ongoing speech and voice preview
    clearKeepAlive()
    window.speechSynthesis.cancel()
    isCancelledRef.current = false
    setIsPreviewingVoice(false)

    // Generate intelligent speech chunks (~160 chars per sentence boundary)
    const chunks = createIntelligentSpeechChunks(trimmed, 160)
    intelligentChunksRef.current = chunks
    chunkIndexRef.current = 0
    setTotalChunks(chunks.length)
    setActiveChunkIndex(0)
    setCurrentChunkText(chunks[0]?.text || '')

    speakCurrentChunk()
  }

  // Voice Preview Handler
  const handlePreviewVoice = () => {
    if (!isSupported || !selectedVoice) return

    if (isPreviewingVoice) {
      window.speechSynthesis.cancel()
      setIsPreviewingVoice(false)
      return
    }

    // Stop any main speech
    handleStop()

    const previewPhrase =
      selectedVoiceInfo?.nativePreviewText ||
      NATIVE_PREVIEWS[selectedVoice.lang.toLowerCase()] ||
      NATIVE_PREVIEWS.en

    const previewUtterance = new SpeechSynthesisUtterance(previewPhrase)
    previewUtterance.voice = selectedVoice
    previewUtterance.lang = selectedVoice.lang
    previewUtterance.rate = rate
    previewUtterance.pitch = pitch
    previewUtterance.volume = volume

    previewUtterance.onstart = () => {
      setIsPreviewingVoice(true)
    }

    previewUtterance.onend = () => {
      setIsPreviewingVoice(false)
      previewUtteranceRef.current = null
    }

    previewUtterance.onerror = () => {
      setIsPreviewingVoice(false)
      previewUtteranceRef.current = null
    }

    previewUtteranceRef.current = previewUtterance
    window.speechSynthesis.speak(previewUtterance)
  }

  // Pause handler
  const handlePause = () => {
    if (!isSpeaking || isPaused) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }

  // Resume handler
  const handleResume = () => {
    if (!isSpeaking || !isPaused) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }

  // Stop handler
  const handleStop = () => {
    isCancelledRef.current = true
    clearKeepAlive()
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setIsPreviewingVoice(false)
    setActiveChunkIndex(0)
    setTotalChunks(0)
    setCurrentChunkText('')
    activeUtteranceRef.current = null
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
    if (generatedAudioRef.current?.url) {
      revokeSpeechAudioUrl(generatedAudioRef.current.url)
      generatedAudioRef.current = null
    }
    setGeneratedAudio(null)
    setText('')
    setErrorMessage(null)
    textareaRef.current?.focus()
  }

  const handleInsertSample = (type: 'en' | 'hi' | 'bn' | 'ur' | 'story') => {
    handleStop()
    if (generatedAudioRef.current?.url) {
      revokeSpeechAudioUrl(generatedAudioRef.current.url)
      generatedAudioRef.current = null
    }
    setGeneratedAudio(null)

    if (type === 'en') {
      setText(
        'SmartTools India provides lightning-fast, privacy-first online tools for everyday calculations. All computation happens right here on your computer or phone.'
      )
      setNeuralLanguage('en')
      setIsUrduRtl(false)
      const enVoice = findBestVoiceForLanguage(voices, 'en-in') || findBestVoiceForLanguage(voices, 'en')
      if (enVoice) {
        setSelectedLanguage('en-in')
        setSelectedVoiceURI(enVoice.voiceURI)
      }
    } else if (type === 'hi') {
      setText(
        'नमस्ते! स्मार्टटूल्स इंडिया में आपका स्वागत है। यह टूल आपके लिखे हुए टेक्स्ट को प्राकृतिक और स्पष्ट आवाज में बदलकर सुनाता है।'
      )
      setNeuralLanguage('hi')
      setIsUrduRtl(false)
      const hiVoice = findBestVoiceForLanguage(voices, 'hi')
      if (hiVoice) {
        setSelectedLanguage('hi')
        setSelectedVoiceURI(hiVoice.voiceURI)
      }
    } else if (type === 'bn') {
      setText(
        'স্মার্টটুলস ইন্ডিয়াতে আপনাকে স্বাগতম! এই টুলটি আপনার লিখিত টেক্সটকে অত্যন্ত নির্ভুল এবং প্রাকৃতিক কণ্ঠস্বরে রূপান্তর করতে পারে।'
      )
      setIsUrduRtl(false)
      const bnVoice = findBestVoiceForLanguage(voices, 'bn')
      if (bnVoice) {
        setSelectedLanguage('bn')
        setSelectedVoiceURI(bnVoice.voiceURI)
      }
    } else if (type === 'ur') {
      setText(
        'اسمارٹ ٹولز انڈیا میں خوش آمدید! یہ مفت اسٹوڈیو ٹول آپ کے تحریری الفاظ کو قدرتی اور معیاری آواز میں تبدیل کرتا ہے۔'
      )
      setIsUrduRtl(true)
      const urVoice = findBestVoiceForLanguage(voices, 'ur')
      if (urVoice) {
        setSelectedLanguage('ur')
        setSelectedVoiceURI(urVoice.voiceURI)
      }
    } else {
      setText(
        'Once upon a time in ancient India, scholars invented the decimal numbering system and the concept of zero. Today, digital technology allows us to calculate, create, and communicate faster than ever before. Enjoy learning and exploring everyday tools on SmartTools India!'
      )
      setNeuralLanguage('en')
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

  // Handle client-side audio generation and download
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

      // Clean up previous generated audio URL to prevent memory leaks
      if (generatedAudioRef.current?.url) {
        revokeSpeechAudioUrl(generatedAudioRef.current.url)
        generatedAudioRef.current = null
      }

      let result: GeneratedAudioResult

      if (downloadEngine === 'neural') {
        const targetLang: NeuralLanguage = hasDevanagari ? 'hi' : neuralLanguage
        const neuralResult = await generateNeuralSpeech(
          trimmed,
          targetLang,
          (prog) => setNeuralProgress(prog)
        )
        result = {
          blob: neuralResult.blob,
          url: neuralResult.url,
          filename: neuralResult.filename,
          durationSeconds: neuralResult.durationSeconds,
          sizeBytes: neuralResult.sizeBytes,
          sampleRate: neuralResult.sampleRate,
        }
        setAudioModelUsed(`Meta MMS-TTS Neural (${targetLang === 'hi' ? 'Hindi' : 'English'})`)
      } else {
        result = await generateSpeechWav(trimmed, {
          rate,
          pitch,
          volume,
        })
        setAudioModelUsed('Fast Lightweight Synthesizer')
      }

      setGeneratedAudio(result)
      generatedAudioRef.current = result

      // Automatically trigger client-side download of genuine .wav file
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
      {!isSupported && (
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
                Text to Speech Studio
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                    <AudioLines className="h-3 w-3" />
                    {isPaused ? 'Paused' : 'Speaking...'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Client-Side • Smart Sentence Chunks &amp; Natural Pauses
              </p>
            </div>
          </div>

          {/* Sample Snippet Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">Samples:</span>
            <button
              type="button"
              onClick={() => handleInsertSample('en')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('hi')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              हिंदी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('bn')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              বাংলা (Bengali)
            </button>
            <button
              type="button"
              onClick={() => handleInsertSample('ur')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              اردو (Urdu)
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

        {/* Text Area Card with Live Counter and Actions */}
        <div className="space-y-2">
          {/* Smart Language Detection Banner */}
          {detectedLang && isLanguageMismatch && (
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
              placeholder="Type or paste your text here (English, Hindi, Bengali, Urdu, or any language)..."
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

              {totalChunks > 0 && isSpeaking && (
                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping" />
                  <span>Sentence {activeChunkIndex + 1} of {totalChunks}</span>
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
        {isSpeaking && currentChunkText && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-3.5 space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <AudioLines className="h-3.5 w-3.5 animate-pulse" />
                Speaking Sentence {activeChunkIndex + 1} of {totalChunks}:
              </span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                {Math.round(((activeChunkIndex + 1) / totalChunks) * 100)}%
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 italic leading-relaxed line-clamp-2">
              &ldquo;{currentChunkText}&rdquo;
            </p>
            {/* Smooth sentence progress bar */}
            <div className="w-full bg-blue-200/70 dark:bg-blue-900/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(((activeChunkIndex + 1) / totalChunks) * 100)}%` }}
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
                  {selectedVoiceInfo && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedVoiceInfo.tier === 'natural'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : selectedVoiceInfo.tier === 'cloud'
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : selectedVoiceInfo.tier === 'enhanced'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {selectedVoiceInfo.tierLabel}
                    </span>
                  )}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    {filteredVoices.length} available
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  id="tts-voice-select"
                  value={effectiveVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  disabled={filteredVoices.length === 0}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 truncate"
                >
                  {filteredVoices.length === 0 ? (
                    <option value="">No voices available for selected filter</option>
                  ) : (
                    enhancedVoices.map((ev) => (
                      <option key={ev.voice.voiceURI} value={ev.voice.voiceURI}>
                        {ev.displayName} ({ev.voice.lang}) — [{ev.tierLabel}]
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
                    isPreviewingVoice
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                  title="Listen to a quick sample of this voice"
                >
                  <Ear className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{isPreviewingVoice ? 'Listening...' : 'Preview'}</span>
                </button>
              </div>
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
              {isSpeaking ? (isPaused ? 'Paused' : 'Playing live audio...') : isPreviewingVoice ? 'Voice Preview' : 'Ready'}
            </span>
          </div>
          <WaveformVisualizer isPlaying={isSpeaking || isPreviewingVoice || isGeneratingAudio} height={48} />
        </div>

        {/* Primary Playback Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Main Big Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isSpeaking ? (
              <button
                type="button"
                onClick={handlePlay}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-blue-500/20 transition-all duration-200"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Play Speech</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-emerald-500/20 transition-all duration-200 animate-pulse"
              >
                <Play className="h-5 w-5 fill-white" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePause}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-7 py-3 text-sm sm:text-base font-bold shadow-md shadow-amber-500/20 transition-all duration-200"
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
              title={downloadEngine === 'neural' ? 'Synthesize natural neural speech and download .wav' : 'Generate lightweight audio file (.wav)'}
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
                <span className="ml-1 font-medium">Reading aloud with natural pauses</span>
              </div>
            ) : isPaused ? (
              <div className="px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium">
                Paused • Click Resume to continue
              </div>
            ) : isPreviewingVoice ? (
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

        {/* Audio Download Engine & Language Configuration */}
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                WAV Audio Download Engine
              </span>
            </div>

            <div className="inline-flex rounded-lg p-0.5 bg-slate-200/70 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDownloadEngine('neural')}
                className={`px-3 py-1 rounded-md transition-all ${
                  downloadEngine === 'neural'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Neural VITS (Natural)
              </button>
              <button
                type="button"
                onClick={() => setDownloadEngine('fast')}
                className={`px-3 py-1 rounded-md transition-all ${
                  downloadEngine === 'fast'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Fast (Lightweight Formant)
              </button>
            </div>
          </div>

          {downloadEngine === 'neural' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Neural Model Language:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNeuralLanguage('en')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      neuralLanguage === 'en' && !hasDevanagari
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    English (Global MMS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeuralLanguage('hi')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                      neuralLanguage === 'hi' || hasDevanagari
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    हिंदी (Hindi MMS)
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Meta MMS-TTS Neural Model • ~38 MB cached offline • 100% Client-Side
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instant acoustic formant synthesizer running directly via Web Audio. Zero MB download, works 100% offline on any phone or computer.
            </p>
          )}

          {/* Bengali Language Clarity Callout */}
          {hasBengali && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bengali Language Notice:</strong> Bengali speech is natively supported for real-time listening via the <strong>&quot;Play Speech&quot;</strong> button using your device&apos;s speech engine (Google বাংলা / Microsoft). For downloadable WAV audio, English and Hindi ONNX models are available.
              </span>
            </div>
          )}

          {/* Urdu Language Clarity Callout */}
          {hasUrdu && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Urdu Language Notice:</strong> Urdu speech is natively supported for real-time listening via the <strong>&quot;Play Speech&quot;</strong> button using your device&apos;s speech engine (Google اردو / Microsoft Gul). For downloadable WAV audio, English and Hindi ONNX models are available.
              </span>
            </div>
          )}
        </div>

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
                    {audioModelUsed || 'Natural Neural WAV'} • {Math.round(generatedAudio.sizeBytes / 1024)} KB • {generatedAudio.durationSeconds.toFixed(1)}s duration • {generatedAudio.sampleRate / 1000} kHz
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
                  <span>Save Audio File (.wav)</span>
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
          SmartTools India maintains full transparency about audio generation technologies. We never falsely label standard browser speech as custom AI Neural speech. Here is how our speech engine works across different browsers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Natural Online Voices */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Natural Online Voices</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Available in <strong>Microsoft Edge</strong> and <strong>Google Chrome</strong> (e.g. <em>Microsoft Neerja Online (Natural)</em>, <em>Google हिन्दी</em>). These use cloud neural synthesis streamed directly to your browser for human-like inflection and breathing pauses.
            </p>
          </div>

          {/* Device System Voices */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs sm:text-sm">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Device System Voices</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Installed locally on Windows, macOS, Android, and iOS (such as SAPI5 voices or Apple Enhanced Siri voices). Operates 100% offline with zero data consumption and instant response.
            </p>
          </div>

          {/* Client-Side Neural Model */}
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs sm:text-sm">
              <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Downloadable Neural WAV</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              For audio file downloads, we run <strong>Meta MMS-TTS</strong> via Transformers.js in WebAssembly directly on your device. Once downloaded (~38 MB), it generates real 16-bit PCM WAV files 100% offline.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy & Missing Voice Guidance Notice Cards */}
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
              Installing Regional Voices
            </p>
            <p className="leading-relaxed">
              If your operating system lacks Bengali, Hindi, or Urdu voices, you can install them free in <strong>Windows Settings → Time &amp; Language → Speech</strong>, or open this page in Google Chrome / Microsoft Edge.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Free &amp; Open Source Tech
            </p>
            <p className="leading-relaxed">
              No paid API keys, logins, or hidden subscriptions are required. We rely purely on open web standards (W3C Web Speech, Web Audio) and open-source models (Meta MMS-TTS).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
