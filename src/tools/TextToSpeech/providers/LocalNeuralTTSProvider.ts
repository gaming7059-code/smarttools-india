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

  async getVoices(): Promise<TTSVoice[]> {
    return [
      {
        id: 'neural-en',
        name: 'Meta MMS Neural English',
        displayName: 'Meta MMS-TTS English (Global)',
        lang: 'en-US',
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
        lang: 'hi-IN',
        providerId: 'local-neural',
        tier: 'local-neural',
        tierLabel: 'Neural ONNX',
        isOffline: true,
        nativePreviewText: 'नमस्ते! यह लोकल न्यूरल स्पीच मॉडल का नमूना है।',
      },
    ]
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

      const targetLang: NeuralLanguage = options.voiceId === 'neural-hi' ? 'hi' : 'en'

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
    const targetLang: NeuralLanguage = options.voiceId === 'neural-hi' ? 'hi' : 'en'
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
