/**
 * Free Browser Web Speech API Provider
 *
 * Implements standard browser speech synthesis with:
 * - Dynamic OS & browser voice discovery
 * - Quality tiering (Natural Online, Browser Cloud, Device Enhanced, Device System)
 * - Intelligent sentence chunking with multi-script pause cadence
 * - 9-second keepalive watchdog to prevent Chromium / Safari 15s freeze
 * - Native voice preview feature
 */

import type { TTSProvider } from './TTSProvider'
import type {
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
} from '../types'
import {
  createIntelligentSpeechChunks,
  type SpeechChunk,
} from '../../../utils/speechChunker'
import {
  categorizeVoice,
  NATIVE_PREVIEWS,
} from '../../../utils/languageDetector'

export class BrowserTTSProvider implements TTSProvider {
  readonly id = 'browser' as const
  readonly name = 'Free Browser Voice'
  readonly description = 'Instant native device speech synthesis (100% free, zero downloads, zero API keys)'
  readonly canDownload = false
  readonly requiresNetwork = false

  private activeUtterance: SpeechSynthesisUtterance | null = null
  private previewUtterance: SpeechSynthesisUtterance | null = null
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null
  private isCancelled = false
  private currentChunks: SpeechChunk[] = []
  private currentChunkIndex = 0

  getActiveUtterance(): SpeechSynthesisUtterance | null {
    return this.activeUtterance
  }

  getPreviewUtterance(): SpeechSynthesisUtterance | null {
    return this.previewUtterance
  }

  getCurrentChunks(): SpeechChunk[] {
    return this.currentChunks
  }

  async isAvailable(): Promise<boolean> {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    )
  }

  async getVoices(langFilter?: string): Promise<TTSVoice[]> {
    if (!(await this.isAvailable())) return []

    const rawVoices = window.speechSynthesis.getVoices()
    if (!rawVoices || rawVoices.length === 0) return []

    const voices: TTSVoice[] = rawVoices.map((v) => {
      const info = categorizeVoice(v)
      return {
        id: v.voiceURI,
        name: v.name,
        displayName: info.displayName,
        lang: v.lang,
        providerId: 'browser',
        tier: info.tier,
        tierLabel: info.tierLabel,
        isOffline: v.localService === true,
        nativePreviewText: info.nativePreviewText,
      }
    })

    // Filter by language if specified
    const filtered = langFilter && langFilter !== 'all'
      ? voices.filter((v) => {
          if (langFilter.startsWith('en-in') && v.lang.toLowerCase() === 'en-in') return true
          if (langFilter.startsWith('en-us') && v.lang.toLowerCase() === 'en-us') return true
          if (langFilter.startsWith('en-gb') && v.lang.toLowerCase() === 'en-gb') return true
          return v.lang.toLowerCase().startsWith(langFilter.toLowerCase())
        })
      : voices

    // Sort by quality score (Natural Online & Cloud first)
    return filtered.sort((a, b) => {
      const getScore = (v: TTSVoice) => {
        if (v.tier === 'natural') return 95
        if (v.tier === 'cloud') return 85
        if (v.tier === 'enhanced') return 80
        if (v.lang.toLowerCase().startsWith('en-in') || v.lang.toLowerCase().startsWith('hi')) return 50
        return 20
      }
      return getScore(b) - getScore(a)
    })
  }

  private clearKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer)
      this.keepAliveTimer = null
    }
  }

  async speak(
    text: string,
    options: TTSPlaybackOptions,
    callbacks: {
      onStart?: () => void
      onProgress?: (progress: TTSProgressInfo) => void
      onPause?: () => void
      onResume?: () => void
      onEnd?: () => void
      onError?: (err: Error) => void
    }
  ): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error('Speech synthesis is not supported in this browser.')
    }

    const trimmed = text.trim()
    if (!trimmed) {
      throw new Error('Please enter some text to speak.')
    }

    // Stop ongoing speech
    this.stop()
    this.isCancelled = false

    // Chunk text using multi-script punctuation processor
    const chunks = createIntelligentSpeechChunks(trimmed, 165)
    if (chunks.length === 0) return

    this.currentChunks = chunks
    this.currentChunkIndex = 0

    const rawVoices = window.speechSynthesis.getVoices()
    const targetVoice = rawVoices.find((v) => v.voiceURI === options.voiceId) || null

    const speakChunk = (index: number) => {
      if (this.isCancelled) return
      if (index >= chunks.length) {
        this.clearKeepAlive()
        this.activeUtterance = null
        callbacks.onEnd?.()
        return
      }

      const chunk = chunks[index]
      const utterance = new SpeechSynthesisUtterance(chunk.cleanText)

      if (targetVoice) {
        utterance.voice = targetVoice
        utterance.lang = targetVoice.lang
      }

      utterance.rate = options.rate
      utterance.pitch = options.pitch
      utterance.volume = options.volume

      utterance.onstart = () => {
        if (!this.isCancelled) {
          if (index === 0) callbacks.onStart?.()
          callbacks.onProgress?.({
            activeSentenceIndex: index,
            totalSentences: chunks.length,
            currentSentenceText: chunk.text,
            percent: Math.round(((index + 1) / chunks.length) * 100),
          })

          // 9-second keepalive heartbeat to prevent Chromium 15s freeze
          this.clearKeepAlive()
          this.keepAliveTimer = setInterval(() => {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
              window.speechSynthesis.pause()
              window.speechSynthesis.resume()
            }
          }, 9000)
        }
      }

      utterance.onpause = () => callbacks.onPause?.()
      utterance.onresume = () => callbacks.onResume?.()

      utterance.onend = () => {
        this.clearKeepAlive()
        if (this.isCancelled) return

        this.currentChunkIndex = index + 1
        if (this.currentChunkIndex < chunks.length) {
          // Dynamic natural breathing pause between sentences/paragraphs
          const pauseMs = chunk.pauseAfterMs || 120
          setTimeout(() => {
            speakChunk(this.currentChunkIndex)
          }, pauseMs)
        } else {
          this.activeUtterance = null
          callbacks.onEnd?.()
        }
      }

      utterance.onerror = (event) => {
        this.clearKeepAlive()
        if (event.error === 'canceled' || event.error === 'interrupted') return
        this.activeUtterance = null
        callbacks.onError?.(new Error(`Browser speech error: ${event.error || 'Playback stopped'}`))
      }

      this.activeUtterance = utterance
      window.speechSynthesis.speak(utterance)
    }

    speakChunk(0)
  }

  pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause()
    }
  }

  resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume()
    }
  }

  stop(): void {
    this.isCancelled = true
    this.clearKeepAlive()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.activeUtterance = null
    this.previewUtterance = null
  }

  async preview(voiceId: string, options?: Partial<TTSPlaybackOptions>): Promise<void> {
    if (!(await this.isAvailable())) return

    this.stop()
    const rawVoices = window.speechSynthesis.getVoices()
    const voice = rawVoices.find((v) => v.voiceURI === voiceId)
    if (!voice) return

    const info = categorizeVoice(voice)
    const previewText = info.nativePreviewText || NATIVE_PREVIEWS[voice.lang.toLowerCase()] || NATIVE_PREVIEWS.en

    const utterance = new SpeechSynthesisUtterance(previewText)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = options?.rate ?? 1.0
    utterance.pitch = options?.pitch ?? 1.0
    utterance.volume = options?.volume ?? 1.0

    this.previewUtterance = utterance
    window.speechSynthesis.speak(utterance)
  }
}
