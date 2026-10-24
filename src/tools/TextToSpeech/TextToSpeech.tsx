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
  ShieldAlert
} from 'lucide-react'
import { chunkText } from '../../utils/speechChunker'
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
    'Welcome to SmartTools India! This free text to speech converter turns your typed or pasted text into clear spoken audio directly inside your web browser. Try adjusting the voice, playback speed, pitch, and volume controls below.'
  )
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

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

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [currentChunk, setCurrentChunk] = useState<number>(0)
  const [totalChunks, setTotalChunks] = useState<number>(0)
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

  // Language script detection for text
  const hasDevanagari = useMemo(() => /[\u0900-\u097F]/.test(text), [text])
  const hasBengali = useMemo(() => /[\u0980-\u09FF]/.test(text), [text])

  // Clean up any generated blob URL on unmount
  useEffect(() => {
    return () => {
      if (generatedAudioRef.current?.url) {
        revokeSpeechAudioUrl(generatedAudioRef.current.url)
      }
    }
  }, [])

  // Refs for tracking playback across async chunk calls without closure staleness
  const chunksRef = useRef<string[]>([])
  const chunkIndexRef = useRef<number>(0)
  const isCancelledRef = useRef<boolean>(false)
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const speakNextChunkRef = useRef<() => void>(() => {})

  const MAX_CHARACTERS = 5000

  // Listen to browser voices event
  useEffect(() => {
    if (!isSupported) return

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices()
      if (!available || available.length === 0) return

      // Sort voices prioritizing Indian and English regional voices
      const sorted = [...available].sort((a, b) => {
        const getPriority = (v: SpeechSynthesisVoice) => {
          const lang = v.lang.toLowerCase()
          if (lang.startsWith('en-in')) return 1
          if (lang.startsWith('hi')) return 2
          if (lang.startsWith('bn')) return 3
          if (lang.includes('in')) return 4
          if (lang.startsWith('en-us')) return 5
          if (lang.startsWith('en-gb')) return 6
          if (lang.startsWith('en')) return 7
          return 10
        }
        return getPriority(a) - getPriority(b)
      })

      setVoices(sorted)
    }

    updateVoices()
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    const timer = setTimeout(updateVoices, 300)

    return () => {
      clearTimeout(timer)
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
      window.speechSynthesis.cancel()
    }
  }, [isSupported])

  // Group languages for dropdown filter
  const languageOptions = useMemo(() => {
    const langs = new Map<string, { code: string; label: string; count: number }>()

    voices.forEach((v) => {
      const code = v.lang
      const normalized = code.split('-')[0].toLowerCase()

      let label = code
      if (code.toLowerCase() === 'en-in') label = 'English (India)'
      else if (code.toLowerCase() === 'en-us') label = 'English (US)'
      else if (code.toLowerCase() === 'en-gb') label = 'English (UK)'
      else if (normalized === 'hi') label = 'Hindi'
      else if (normalized === 'bn') label = 'Bengali'
      else if (normalized === 'ta') label = 'Tamil'
      else if (normalized === 'te') label = 'Telugu'
      else if (normalized === 'mr') label = 'Marathi'
      else if (normalized === 'gu') label = 'Gujarati'
      else if (normalized === 'kn') label = 'Kannada'
      else if (normalized === 'ml') label = 'Malayalam'
      else if (normalized === 'pa') label = 'Punjabi'
      else if (normalized === 'ur') label = 'Urdu'
      else if (normalized === 'en') label = `English (${code})`

      const key = label
      if (langs.has(key)) {
        langs.get(key)!.count += 1
      } else {
        langs.set(key, { code, label, count: 1 })
      }
    })

    return Array.from(langs.values()).sort((a, b) => {
      if (a.label.includes('India') || a.label === 'Hindi' || a.label === 'Bengali') return -1
      if (b.label.includes('India') || b.label === 'Hindi' || b.label === 'Bengali') return 1
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

  // Core speech engine with natural chunking
  const speakCurrentChunk = useCallback(() => {
    if (!isSupported) return
    if (isCancelledRef.current) return

    const chunks = chunksRef.current
    const index = chunkIndexRef.current

    if (index >= chunks.length) {
      setIsSpeaking(false)
      setIsPaused(false)
      setCurrentChunk(0)
      activeUtteranceRef.current = null
      return
    }

    const chunkTextToSpeak = chunks[index]
    const utterance = new SpeechSynthesisUtterance(chunkTextToSpeak)

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
        setCurrentChunk(index + 1)
      }
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    utterance.onend = () => {
      if (isCancelledRef.current) return

      chunkIndexRef.current += 1
      if (chunkIndexRef.current < chunks.length) {
        // Small pause between sentence chunks for natural prosody
        setTimeout(() => {
          speakNextChunkRef.current()
        }, 80)
      } else {
        setIsSpeaking(false)
        setIsPaused(false)
        setCurrentChunk(0)
        activeUtteranceRef.current = null
      }
    }

    utterance.onerror = (event) => {
      // Ignore user-induced cancel errors
      if (event.error === 'canceled' || event.error === 'interrupted') {
        return
      }
      setErrorMessage(`Speech synthesis issue: ${event.error || 'Playback stopped'}`)
      setIsSpeaking(false)
      setIsPaused(false)
      activeUtteranceRef.current = null
    }

    // Keep reference alive to avoid garbage collection bug in Chrome
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

    // Stop ongoing speech
    window.speechSynthesis.cancel()
    isCancelledRef.current = false

    // Chunk text (~200 chars per sentence boundary)
    const chunks = chunkText(trimmed, 200)
    chunksRef.current = chunks
    chunkIndexRef.current = 0
    setTotalChunks(chunks.length)
    setCurrentChunk(1)

    speakCurrentChunk()
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
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setCurrentChunk(0)
    setTotalChunks(0)
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
      setErrorMessage('Clipboard access was blocked by your browser. You can still paste text using Ctrl+V or right-click.')
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

  const handleInsertSample = (type: 'en' | 'hi' | 'story') => {
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
    } else if (type === 'hi') {
      setText(
        'नमस्ते! स्मार्टटूल्स इंडिया में आपका स्वागत है। यह टूल आपके लिखे हुए टेक्स्ट को स्पष्ट आवाज में बदलकर सुनाता है। आप स्पीड और पिच भी बदल सकते हैं।'
      )
      setNeuralLanguage('hi')
    } else {
      setText(
        'Once upon a time in ancient India, scholars invented the decimal numbering system and the concept of zero. Today, digital technology allows us to calculate, create, and communicate faster than ever before. Enjoy learning and exploring everyday tools on SmartTools India!'
      )
      setNeuralLanguage('en')
    }
    setErrorMessage(null)
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

  return (
    <div className="space-y-8">
      {/* Unsupported Browser Alert */}
      {!isSupported && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-5 flex items-start gap-3.5 text-rose-800 dark:text-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h3 className="font-semibold text-rose-900 dark:text-rose-100">Speech Synthesis Not Supported</h3>
            <p className="mt-1 text-rose-700 dark:text-rose-300">
              Your current web browser does not support the HTML5 Web Speech API. For the best experience, please open SmartTools India in Google Chrome, Microsoft Edge, Apple Safari, or Mozilla Firefox.
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
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
                    <AudioLines className="h-3 w-3" />
                    {isPaused ? 'Paused' : 'Speaking...'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Client-Side • Powered by your device&apos;s speech engine
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
              onClick={() => handleInsertSample('story')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-600 dark:text-slate-300 font-medium hidden sm:inline-block"
            >
              Story
            </button>
          </div>
        </div>

        {/* Text Area Card with Live Counter and Actions */}
        <div className="space-y-2">
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
            {/* Top Toolbar inside Text Area */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/60 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">
                Enter text to read aloud
              </span>

              <div className="flex items-center gap-1.5">
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
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_CHARACTERS))
                if (errorMessage) setErrorMessage(null)
              }}
              placeholder="Type or paste your text here (English, Hindi, Bengali, or any language)..."
              rows={7}
              className="w-full bg-transparent p-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none leading-relaxed"
              aria-label="Text to speech input"
            />

            {/* Bottom Character & Word Counter */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className={charCount >= MAX_CHARACTERS ? 'text-rose-600 font-semibold' : ''}>
                  {charCount.toLocaleString('en-IN')} / {MAX_CHARACTERS.toLocaleString('en-IN')} chars
                </span>
              </div>

              {totalChunks > 1 && isSpeaking && (
                <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>Part {currentChunk} of {totalChunks}</span>
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
              }}
              className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 font-medium"
              title="Reset speed, pitch, and volume to default"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Settings</span>
            </button>
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
                <option value="all">All Languages ({voices.length} voices)</option>
                {languageOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Dropdown */}
            <div>
              <label htmlFor="tts-voice-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Select Voice</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {filteredVoices.length} available
                </span>
              </label>
              <select
                id="tts-voice-select"
                value={effectiveVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                disabled={filteredVoices.length === 0}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              >
                {filteredVoices.length === 0 ? (
                  <option value="">No voices available for selected filter</option>
                ) : (
                  filteredVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}){v.default ? ' — System Default' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Speed, Pitch, Volume Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            {/* Speed (Rate) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Speed</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{rate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Speech speed"
              />
              <div className="flex justify-between gap-1">
                {[0.75, 1.0, 1.25, 1.5].map((val) => (
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
                    {val}x
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Pitch</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Speech pitch"
              />
              <div className="flex justify-between gap-1">
                {[
                  { label: 'Low', val: 0.8 },
                  { label: 'Normal', val: 1.0 },
                  { label: 'High', val: 1.3 },
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

        {/* Audio Download Engine & Language Configuration */}
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-indigo-900/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Audio Download Quality &amp; Engine
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
                Neural AI (Natural)
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
                Fast (Lightweight)
              </button>
            </div>
          </div>

          {downloadEngine === 'neural' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Target Voice Language:</span>
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
                    English (US/Global)
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
                    हिंदी (Hindi)
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Meta MMS-TTS Neural Model • ~38 MB one-time browser cache • 100% Client-Side
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acoustic formant synthesizer running directly on Web Audio. Instant 0 MB generation, works 100% offline on all devices.
            </p>
          )}

          {/* Bengali Language Clarity Callout */}
          {hasBengali && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Bengali Language Notice:</strong> Meta has not released browser-compatible ONNX tokenizers for Bengali yet. Bengali text is fully supported for natural listening via the <strong>&quot;Play Speech&quot;</strong> button using your device&apos;s native voice. For downloadable WAV audio, English and Hindi neural models are available.
              </span>
            </div>
          )}
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
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300">
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

      {/* Privacy & Engine Transparency Notice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/30 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              100% Client-Side Privacy
            </p>
            <p className="leading-relaxed">
              All speech playback and neural waveform rendering execute locally on your device. Your typed or pasted text is never sent across the internet or stored on external servers.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Browser Voice vs. Audio Download
            </p>
            <p className="leading-relaxed">
              Operating system voices are routed directly to device speakers by browser security and cannot be exported to files. For downloads, SmartTools India synthesizes your text locally into genuine 16-bit PCM WAV files via Meta MMS-TTS.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              Neural Model Licensing
            </p>
            <p className="leading-relaxed">
              The neural audio engine utilizes Meta MMS-TTS weights licensed under <strong>CC-BY-NC 4.0</strong> (Non-Commercial). It is completely free for personal, study, evaluation, and community use.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
