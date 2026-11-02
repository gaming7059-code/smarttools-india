import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Copy,
  Check,
  Trash2,
  FileText,
  Clock,
  Upload,
  Sparkles,
  Volume2,
  AlertCircle,
  FileCode,
  ArrowRight
} from 'lucide-react'

// Browser Web Speech Recognition interface
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: {
    resultIndex: number
    results: {
      length: number
      [index: number]: {
        isFinal: boolean
        [index: number]: { transcript: string; confidence: number }
      }
    }
  }) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => IWindowSpeechRecognition
    webkitSpeechRecognition?: new () => IWindowSpeechRecognition
  }
}

export const AudioTranscriber: React.FC = () => {
  const navigate = useNavigate()
  const [transcript, setTranscript] = useState<string>('')
  const [isListening, setIsListening] = useState<boolean>(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-IN')
  const [copied, setCopied] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Audio file reference player
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioFileName, setAudioFileName] = useState<string>('')
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1.0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null)
  const isSpeechRecSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [audioUrl])

  // Initialize Speech Recognition
  const startListening = () => {
    setErrorMessage(null)
    if (!isSpeechRecSupported) {
      setErrorMessage('Speech Recognition is not supported by your current browser. Please try Google Chrome or Microsoft Edge.')
      return
    }

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionClass) return

      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = selectedLanguage

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = (e) => {
        setIsListening(false)
        if (e.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser address bar.')
        } else if (e.error !== 'aborted') {
          setErrorMessage(`Speech recognition error: ${e.error}`)
        }
      }

      recognition.onresult = (event) => {
        let finalTrans = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          if (res.isFinal) {
            finalTrans += `${res[0].transcript} `
          }
        }
        if (finalTrans) {
          setTranscript((prev) => `${prev ? `${prev.trim()} ` : ''}${finalTrans.trim()}`)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setErrorMessage('Unable to start speech recognition.')
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // Handle Audio File Upload for manual transcription aid
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }

    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    setAudioFileName(file.name)
  }

  // Insert current timestamp into transcript
  const handleInsertTimestamp = () => {
    if (!audioRef.current) return
    const cur = audioRef.current.currentTime || 0
    const mins = Math.floor(cur / 60)
    const secs = Math.floor(cur % 60)
    const stamp = `[${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}] `
    setTranscript((prev) => `${prev ? `${prev}\n` : ''}${stamp}`)
  }

  const handleCopy = () => {
    if (!transcript) return
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setTranscript('')
    setErrorMessage(null)
  }

  // Export as .txt
  const handleDownloadTxt = () => {
    if (!transcript.trim()) return
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Transcript_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export as basic .srt subtitle
  const handleDownloadSrt = () => {
    if (!transcript.trim()) return
    const lines = transcript.split('\n').filter((l) => l.trim())
    let srtContent = ''
    let counter = 1

    lines.forEach((line, idx) => {
      const startSec = idx * 4
      const endSec = (idx + 1) * 4
      const fmt = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = Math.floor(s % 60)
        return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec},000`
      }
      srtContent += `${counter}\n${fmt(startSec)} --> ${fmt(endSec)}\n${line.replace(/\[\d+:\d+\]\s*/, '')}\n\n`
      counter++
    })

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Subtitles_${new Date().toISOString().slice(0, 10)}.srt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Send to Text-to-Speech tool
  const handleSendToTTS = () => {
    if (!transcript.trim()) return
    // Navigate to Text to Speech tool with state
    navigate('/tools/text-to-speech', { state: { text: transcript } })
  }

  // Metrics
  const charCount = transcript.length
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  return (
    <div className="space-y-8">
      {/* Workspace Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Audio &amp; Speech Transcriber
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  <Sparkles className="h-3 w-3" />
                  Live Voice &amp; Dictation
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live speech-to-text dictation, timestamped transcription, and export to TXT &amp; SRT subtitles
              </p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="stt-lang-select" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dictation Language:
            </label>
            <select
              id="stt-lang-select"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isListening}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="bn-IN">বাংলা (Bengali)</option>
              <option value="ur-PK">اردو (Urdu)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </div>
        </div>

        {/* Live Mic Action Card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleListening}
              className={`flex items-center justify-center h-14 w-14 rounded-full transition-all shadow-md active:scale-95 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/25'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
              title={isListening ? 'Stop live dictation' : 'Start live dictation'}
            >
              {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isListening ? (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping" />
                    Listening to your voice... Speak clearly
                  </span>
                ) : (
                  <span>Click to Start Live Speech Dictation</span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Powered by your browser&apos;s Web Speech Recognition engine • 100% private
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isListening && (
              <button
                type="button"
                onClick={stopListening}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold"
              >
                Stop Dictating
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Audio File Transcription Aid (Slow-down player) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Upload className="h-4 w-4 text-blue-600" />
              <span>Transcribe an Existing Audio File (Slow-down player)</span>
            </span>

            <label className="text-xs px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:border-blue-400 text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
              <span>{audioFileName ? 'Change Audio File' : 'Upload Audio File'}</span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            </label>
          </div>

          {audioUrl && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{audioFileName}</span>
                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-semibold inline-flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  <span>Insert Timestamp</span>
                </button>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full h-8"
              />

              {/* Speed controls */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Playback Speed:</span>
                {[0.5, 0.75, 1.0, 1.25].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setAudioPlaybackRate(spd)
                      if (audioRef.current) audioRef.current.playbackRate = spd
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      audioPlaybackRate === spd
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Transcript Textarea */}
        <div className="space-y-2">
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/15 transition-all">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-200/60 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Transcription Output
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!transcript}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!transcript}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your live dictation and transcription will appear here. You can also edit and format text manually..."
              rows={8}
              className="w-full bg-transparent p-4 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none leading-relaxed"
            />

            {/* Bottom Counts */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 rounded-b-2xl">
              <div className="flex items-center gap-3">
                <span>{wordCount} words</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span>{charCount} characters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Export Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={!transcript.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Download .TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSrt}
              disabled={!transcript.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition-all"
            >
              <FileCode className="h-3.5 w-3.5 text-teal-600" />
              <span>Download .SRT Subtitles</span>
            </button>
          </div>

          {/* Send to Text to Speech */}
          <button
            type="button"
            onClick={handleSendToTTS}
            disabled={!transcript.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-40 transition-all"
          >
            <Volume2 className="h-4 w-4" />
            <span>Send to Text to Speech Tool</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
