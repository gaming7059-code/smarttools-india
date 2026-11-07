/**
 * Local Neural TTS Provider (Client-Side ONNX / WebAssembly)
 *
 * Runs Meta MMS-TTS neural acoustic synthesis directly inside the browser.
 * - 100% Client-Side WebAssembly execution.
 * - Zero external API keys, zero paid services, zero remote text uploads.
 * - Produces uncompressed 16-bit PCM RIFF WAV audio files.
 * - Cached offline in browser memory after first download (~38 MB).
 */

import type { TTSProvider } from './TTSProvider'
import type {
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
  GeneratedAudioOutput,
} from '../types'
import {
  generateNeuralSpeech,
  isNeuralTtsSupported,
  type NeuralLanguage,
  type NeuralProgressInfo,
} from '../../../utils/neuralSpeechService'

export class LocalNeuralTTSProvider implements TTSProvider {
  readonly id = 'local-neural' as const
  readonly name = 'Local Neural AI'
  readonly description = 'On-device VITS neural waveform synthesis via WebAssembly (100% private, supports .wav download)'
  readonly canDownload = true
  readonly requiresNetwork = false // Offline once model weights are cached

  private currentAudio: HTMLAudioElement | null = null

  async isAvailable(): Promise<boolean> {
    return isNeuralTtsSupported()
  }

  async getVoices(langFilter?: string): Promise<TTSVoice[]> {
    const allVoices: TTSVoice[] = [
      {
        id: 'neural-en',
        name: 'Meta MMS Neural English',
        displayName: 'Meta MMS-TTS English (Global / Indian Accent)',
        lang: 'en',
        providerId: 'local-neural',
        tier: 'local-neural',
        tierLabel: 'Neural ONNX',
        isOffline: true,
        nativePreviewText: 'Hello! This is a preview of the local neural speech synthesis model.',
      },
      {
        id: 'neural-hi',
        name: 'Meta MMS Neural Hindi',
        displayName: 'Meta MMS-TTS Hindi (हिंदी)',
        lang: 'hi',
        providerId: 'local-neural',
        tier: 'local-neural',
        tierLabel: 'Neural ONNX',
        isOffline: true,
        nativePreviewText: 'नमस्ते! यह लोकल न्यूरल स्पीच मॉडल का नमूना है।',
      },
    ]

    if (!langFilter || langFilter === 'all') {
      return allVoices
    }

    const filter = langFilter.toLowerCase()
    return allVoices.filter((v) => {
      const vLang = v.lang.toLowerCase()
      if (filter.startsWith('en') && vLang.startsWith('en')) return true
      if (filter.startsWith('hi') && vLang.startsWith('hi')) return true
      return vLang.startsWith(filter) || filter.startsWith(vLang)
    })
  }

  private resolveTargetLanguage(text: string, voiceId?: string): NeuralLanguage {
    if (voiceId === 'neural-hi') return 'hi'
    if (voiceId === 'neural-en') return 'en'
    // Automatic fallback based on script
    const hasDevanagari = /[\u0900-\u097F]/.test(text)
    return hasDevanagari ? 'hi' : 'en'
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
    try {
      this.stop()
      callbacks.onStart?.()

      const targetLang = this.resolveTargetLanguage(text, options.voiceId)

      const result = await generateNeuralSpeech(text, targetLang, (p: NeuralProgressInfo) => {
        callbacks.onProgress?.({
          activeSentenceIndex: 0,
          totalSentences: 1,
          currentSentenceText: p.stage,
          percent: p.percent,
        })
      })

      const audio = new Audio(result.url)
      this.currentAudio = audio
      audio.playbackRate = options.rate
      audio.volume = options.volume

      audio.onended = () => {
        this.currentAudio = null
        callbacks.onEnd?.()
      }

      audio.onerror = () => {
        this.currentAudio = null
        callbacks.onError?.(new Error('Local neural audio playback failed.'))
      }

      await audio.play()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      callbacks.onError?.(error)
    }
  }

  pause(): void {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
    }
  }

  resume(): void {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play()
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  async preview(voiceId: string, options?: Partial<TTSPlaybackOptions>): Promise<void> {
    const previewText =
      voiceId === 'neural-hi'
        ? 'नमस्ते! स्मार्टटूल्स इंडिया में आपका स्वागत है।'
        : 'Hello! Welcome to SmartTools India.'

    await this.speak(
      previewText,
      {
        voiceId,
        rate: options?.rate ?? 1.0,
        pitch: options?.pitch ?? 1.0,
        volume: options?.volume ?? 1.0,
      },
      {}
    )
  }

  async downloadAudio(
    text: string,
    options: TTSPlaybackOptions,
    onProgress?: (progress: { stage: string; percent: number; detail?: string }) => void
  ): Promise<GeneratedAudioOutput> {
    const targetLang = this.resolveTargetLanguage(text, options.voiceId)
    const result = await generateNeuralSpeech(text, targetLang, onProgress)

    return {
      blob: result.blob,
      url: result.url,
      filename: result.filename,
      durationSeconds: result.durationSeconds,
      sizeBytes: result.sizeBytes,
      sampleRate: result.sampleRate,
      format: 'audio/wav',
    }
  }
}
