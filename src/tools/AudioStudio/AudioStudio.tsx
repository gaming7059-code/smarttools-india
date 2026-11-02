import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  SlidersHorizontal,
  Play,
  Pause,
  Square,
  Upload,
  Download,
  RotateCcw,
  Volume2,
  Sparkles,
  Music,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mic,
  MicOff,
  AudioLines
} from 'lucide-react'
import { WaveformVisualizer } from '../../components/common/WaveformVisualizer'

export type EffectPreset = 'none' | 'vocal-clean' | 'bass-boost' | 'treble-air' | 'radio-fx'

export const AudioStudio: React.FC = () => {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)

  // Audio adjustments
  const [speed, setSpeed] = useState<number>(1.0)
  const [gainLevel, setGainLevel] = useState<number>(1.0)
  const [activePreset, setActivePreset] = useState<EffectPreset>('none')

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Web Audio graph refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const startOffsetRef = useRef<number>(0)
  const playbackTimerRef = useRef<number | null>(null)

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportSuccess, setExportSuccess] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize or get AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioCtx()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop()
        sourceNodeRef.current.disconnect()
      } catch {
        // Node might have already finished
      }
      sourceNodeRef.current = null
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [stopPlayback])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    setExportSuccess(false)
    stopPlayback()

    try {
      const ctx = getAudioContext()
      const arrayBuffer = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(arrayBuffer)
      setAudioBuffer(decoded)
      setFileName(file.name)
      setDuration(decoded.duration)
      setCurrentTime(0)
      startOffsetRef.current = 0
    } catch {
      setErrorMessage('Could not decode this audio file. Please upload an MP3, WAV, OGG, or M4A file.')
    }
  }

  // Handle microphone recording
  const handleToggleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // Start recording
      setErrorMessage(null)
      setExportSuccess(false)
      stopPlayback()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        recordedChunksRef.current = []
        const recorder = new MediaRecorder(stream)

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop())
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          const ctx = getAudioContext()
          try {
            const decoded = await ctx.decodeAudioData(arrayBuffer)
            setAudioBuffer(decoded)
            setFileName(`Mic_Recording_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.wav`)
            setDuration(decoded.duration)
            setCurrentTime(0)
            startOffsetRef.current = 0
          } catch {
            setErrorMessage('Could not process microphone recording.')
          }
        }

        mediaRecorderRef.current = recorder
        recorder.start()
        setIsRecording(true)
      } catch {
        setErrorMessage('Microphone access was denied or is unavailable on this device.')
      }
    }
  }

  // Start playback from current offset with filters
  const playFromOffset = (offset: number) => {
    if (!audioBuffer) return
    const ctx = getAudioContext()

    stopPlayback()

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = speed

    const gain = ctx.createGain()
    gain.gain.value = gainLevel
    gainNodeRef.current = gain

    // Build filter chain based on preset
    let lastNode: AudioNode = source

    if (activePreset === 'vocal-clean') {
      // High-pass filter at 120Hz to eliminate desk rumble / mic hum
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 120
      lastNode.connect(hp)
      lastNode = hp
    } else if (activePreset === 'bass-boost') {
      const lowShelf = ctx.createBiquadFilter()
      lowShelf.type = 'lowshelf'
      lowShelf.frequency.value = 220
      lowShelf.gain.value = 6
      lastNode.connect(lowShelf)
      lastNode = lowShelf
    } else if (activePreset === 'treble-air') {
      const highShelf = ctx.createBiquadFilter()
      highShelf.type = 'highshelf'
      highShelf.frequency.value = 7500
      highShelf.gain.value = 5
      lastNode.connect(highShelf)
      lastNode = highShelf
    } else if (activePreset === 'radio-fx') {
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 1800
      bandpass.Q.value = 1.2
      lastNode.connect(bandpass)
      lastNode = bandpass
    }

    lastNode.connect(gain)
    gain.connect(ctx.destination)

    sourceNodeRef.current = source
    startTimeRef.current = ctx.currentTime
    startOffsetRef.current = offset

    source.start(0, offset)
    setIsPlaying(true)

    source.onended = () => {
      // If natural finish
      if (ctx.currentTime - startTimeRef.current >= (duration - startOffsetRef.current) / speed - 0.1) {
        setIsPlaying(false)
        setCurrentTime(0)
        startOffsetRef.current = 0
        if (playbackTimerRef.current) clearInterval(playbackTimerRef.current)
      }
    }

    // Interval to track currentTime for seeker
    playbackTimerRef.current = window.setInterval(() => {
      const elapsed = (ctx.currentTime - startTimeRef.current) * speed
      const cur = Math.min(duration, startOffsetRef.current + elapsed)
      setCurrentTime(cur)
    }, 100)
  }

  const handlePlayPause = () => {
    if (!audioBuffer) return
    if (isPlaying) {
      // Pause
      const ctx = getAudioContext()
      const elapsed = (ctx.currentTime - startTimeRef.current) * speed
      startOffsetRef.current = Math.min(duration, startOffsetRef.current + elapsed)
      setCurrentTime(startOffsetRef.current)
      stopPlayback()
    } else {
      // Play
      if (currentTime >= duration) {
        startOffsetRef.current = 0
      }
      playFromOffset(startOffsetRef.current)
    }
  }

  const handleStop = () => {
    stopPlayback()
    setCurrentTime(0)
    startOffsetRef.current = 0
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    startOffsetRef.current = newTime
    if (isPlaying) {
      playFromOffset(newTime)
    }
  }

  // Preset changer
  const handleSelectPreset = (preset: EffectPreset) => {
    setActivePreset(preset)
    if (isPlaying) {
      const cur = currentTime
      playFromOffset(cur)
    }
  }

  // AudioBuffer to 16-bit PCM WAV Converter
  const encodeWAV = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const channelData: Float32Array[] = []
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i))
    }

    const numSamples = buffer.length
    const blockAlign = numChannels * (bitDepth / 8)
    const byteRate = sampleRate * blockAlign
    const dataSize = numSamples * blockAlign
    const totalSize = 36 + dataSize

    const arrayBuffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(arrayBuffer)

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF')
    view.setUint32(4, totalSize, true)
    writeString(view, 8, 'WAVE')

    // fmt sub-chunk
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // SubChunk1Size (16 for PCM)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)

    // data sub-chunk
    writeString(view, 36, 'data')
    view.setUint32(40, dataSize, true)

    // Write interleaved 16-bit PCM samples
    let offset = 44
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channelData[channel][i]
        // Clamp to -1.0 to 1.0
        sample = Math.max(-1, Math.min(1, sample))
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }

    return new Blob([view], { type: 'audio/wav' })
  }

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  // Export processed audio using OfflineAudioContext
  const handleExportWAV = async () => {
    if (!audioBuffer) return
    setIsExporting(true)
    setErrorMessage(null)
    setExportSuccess(false)

    try {
      const renderDuration = audioBuffer.duration / speed
      const sampleRate = audioBuffer.sampleRate
      const numChannels = audioBuffer.numberOfChannels
      const totalFrames = Math.ceil(renderDuration * sampleRate)

      const offlineCtx = new OfflineAudioContext(numChannels, totalFrames, sampleRate)
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      source.playbackRate.value = speed

      const gain = offlineCtx.createGain()
      gain.gain.value = gainLevel

      let lastNode: AudioNode = source

      if (activePreset === 'vocal-clean') {
        const hp = offlineCtx.createBiquadFilter()
        hp.type = 'highpass'
        hp.frequency.value = 120
        lastNode.connect(hp)
        lastNode = hp
      } else if (activePreset === 'bass-boost') {
        const lowShelf = offlineCtx.createBiquadFilter()
        lowShelf.type = 'lowshelf'
        lowShelf.frequency.value = 220
        lowShelf.gain.value = 6
        lastNode.connect(lowShelf)
        lastNode = lowShelf
      } else if (activePreset === 'treble-air') {
        const highShelf = offlineCtx.createBiquadFilter()
        highShelf.type = 'highshelf'
        highShelf.frequency.value = 7500
        highShelf.gain.value = 5
        lastNode.connect(highShelf)
        lastNode = highShelf
      } else if (activePreset === 'radio-fx') {
        const bandpass = offlineCtx.createBiquadFilter()
        bandpass.type = 'bandpass'
        bandpass.frequency.value = 1800
        bandpass.Q.value = 1.2
        lastNode.connect(bandpass)
        lastNode = bandpass
      }

      lastNode.connect(gain)
      gain.connect(offlineCtx.destination)

      source.start(0)

      const renderedBuffer = await offlineCtx.startRendering()
      const wavBlob = encodeWAV(renderedBuffer)

      // Download file
      const url = URL.createObjectURL(wavBlob)
      const a = document.createElement('a')
      a.href = url
      const baseTitle = fileName.replace(/\.[^/.]+$/, '') || 'Studio_Master'
      a.download = `${baseTitle}_processed.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
    } catch {
      setErrorMessage('Failed to export processed audio.')
    } finally {
      setIsExporting(false)
    }
  }

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const remSec = Math.floor(sec % 60)
    return `${mins}:${remSec < 10 ? '0' : ''}${remSec}`
  }

  return (
    <div className="space-y-8">
      {/* Workspace Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Audio Studio &amp; Effects Cleaner
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Sparkles className="h-3 w-3" />
                  Web Audio Studio
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed adjustments, volume boost, vocal room hum filtering, and pristine 16-bit WAV mastering
              </p>
            </div>
          </div>

          {/* Quick Info Badge */}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
            <Music className="h-4 w-4 text-blue-600" />
            <span>100% Client-Side • Private &amp; Offline</span>
          </div>
        </div>

        {/* Upload or Record Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Box */}
          <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-slate-50/50 dark:bg-slate-950/30">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Choose an audio file or drag & drop'}
            </div>
            <p className="text-[11px] text-slate-400">
              Supports MP3, WAV, M4A, OGG, AAC • Up to 100 MB
            </p>
          </label>

          {/* Microphone Recording Box */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2.5 bg-slate-50/50 dark:bg-slate-950/30">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                isRecording
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 animate-pulse ring-4 ring-rose-500/20'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {isRecording ? 'Recording microphone audio...' : 'Record directly from microphone'}
            </div>
            <button
              type="button"
              onClick={handleToggleRecord}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Waveform Player Section (Only shown if audioBuffer exists) */}
        {audioBuffer && (
          <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                {fileName}
              </span>
              <div className="flex items-center gap-2 font-mono text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Visualizer */}
            <WaveformVisualizer isPlaying={isPlaying} height={56} barCount={60} />

            {/* Seeker Slider */}
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg accent-blue-600 cursor-pointer"
              aria-label="Seek audio track"
            />

            {/* Player Controls & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayPause}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
                  <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStop}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  title="Stop and return to beginning"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              </div>

              {/* Master WAV Export Button */}
              <button
                type="button"
                onClick={handleExportWAV}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting WAV...' : 'Export & Download Master WAV'}</span>
              </button>
            </div>

            {exportSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Processed audio successfully mastered and downloaded!</span>
              </div>
            )}
          </div>
        )}

        {/* Audio Effects & Processing Panel */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-5 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <AudioLines className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Studio Equalization &amp; FX Presets</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSpeed(1.0)
                setGainLevel(1.0)
                setActivePreset('none')
              }}
              className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Effects</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'none' as const, label: 'Bypass / Clean', desc: 'Original sound untouched' },
              { id: 'vocal-clean' as const, label: 'Voice De-Hum', desc: '120Hz Low-cut room filter' },
              { id: 'bass-boost' as const, label: 'Bass Warmth', desc: '+6dB low-end presence' },
              { id: 'treble-air' as const, label: 'Treble Air', desc: '+5dB crisp voice clarity' },
              { id: 'radio-fx' as const, label: 'Radio / Walkie', desc: 'Bandpass telephone effect' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activePreset === preset.id
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/60 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className={`text-xs font-bold ${activePreset === preset.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  {preset.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Sliders: Speed & Gain */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Speed & Tempo */}
            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>Speed / Tempo</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{speed.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={speed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setSpeed(val)
                  if (isPlaying) {
                    playFromOffset(currentTime)
                  }
                }}
                className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Audio playback speed"
              />
              <div className="flex justify-between gap-1 text-[10px]">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSpeed(s)
                      if (isPlaying) playFromOffset(currentTime)
                    }}
                    className={`px-2 py-0.5 rounded ${speed === s ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Gain Boost */}
            <div className="space-y-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1">
                  <Volume2 className="h-4 w-4 text-emerald-600" />
                  Volume / Gain Booster
                </span>
                <span className="font-mono text-emerald-600 font-bold">{Math.round(gainLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={2.5}
                step={0.05}
                value={gainLevel}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setGainLevel(val)
                  if (gainNodeRef.current) {
                    gainNodeRef.current.gain.value = val
                  }
                }}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                aria-label="Audio gain level"
              />
              <div className="flex justify-between gap-1 text-[10px]">
                {[
                  { label: '50%', v: 0.5 },
                  { label: '100%', v: 1.0 },
                  { label: '150%', v: 1.5 },
                  { label: '200%', v: 2.0 },
                  { label: '250%', v: 2.5 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setGainLevel(item.v)
                      if (gainNodeRef.current) gainNodeRef.current.gain.value = item.v
                    }}
                    className={`px-2 py-0.5 rounded ${gainLevel === item.v ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
