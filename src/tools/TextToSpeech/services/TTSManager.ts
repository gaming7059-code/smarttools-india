/**
 * TTS Manager (Engine Orchestrator)
 *
 * Coordinates between:
 * 1. Local Companion Neural Engine (FastAPI 127.0.0.1:8000) - 24kHz Studio Quality (Bengali, Hindi, English, Urdu)
 * 2. In-Browser Local Neural AI (Transformers.js ONNX) - WebAssembly On-Device (English, Hindi)
 * 3. Free Browser Voices (Web Speech API) - Instant 0 MB System Voices
 * 4. Cloud Studio (BYOK OpenAI / ElevenLabs)
 */

import type { TTSProvider } from '../providers/TTSProvider'
import { BrowserTTSProvider } from '../providers/BrowserTTSProvider'
import { LocalNeuralTTSProvider } from '../providers/LocalNeuralTTSProvider'
import { CloudNeuralTTSProvider } from '../providers/CloudNeuralTTSProvider'
import { LocalCompanionTTSProvider } from '../providers/LocalCompanionTTSProvider'
import type {
  TTSProviderId,
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
  GeneratedAudioOutput,
  CompanionServerStatus,
} from '../types'

export class TTSManager {
  private providers: Map<TTSProviderId, TTSProvider> = new Map()
  private activeProviderId: TTSProviderId = 'browser'
  private companionProvider: LocalCompanionTTSProvider

  constructor() {
    const browserProvider = new BrowserTTSProvider()
    const localNeuralProvider = new LocalNeuralTTSProvider()
    const cloudProvider = new CloudNeuralTTSProvider()
    this.companionProvider = new LocalCompanionTTSProvider()

    this.providers.set('companion', this.companionProvider)
    this.providers.set('local-neural', localNeuralProvider)
    this.providers.set('browser', browserProvider)
    this.providers.set('cloud-neural', cloudProvider)
  }

  async checkCompanionStatus(): Promise<CompanionServerStatus> {
    await this.companionProvider.isAvailable()
    return this.companionProvider.getStatus()
  }

  getCompanionStatus(): CompanionServerStatus {
    return this.companionProvider.getStatus()
  }

  getActiveProviderId(): TTSProviderId {
    return this.activeProviderId
  }

  setActiveProvider(id: TTSProviderId): void {
    if (this.providers.has(id)) {
      this.stop()
      this.activeProviderId = id
    }
  }

  getActiveProvider(): TTSProvider {
    return this.providers.get(this.activeProviderId) || this.providers.get('browser')!
  }

  getProvider(id: TTSProviderId): TTSProvider | undefined {
    return this.providers.get(id)
  }

  async getAllVoices(langFilter?: string): Promise<TTSVoice[]> {
    const active = this.getActiveProvider()
    try {
      const voices = await active.getVoices(langFilter)
      if (voices.length > 0) {
        return voices
      }
      // If companion or neural returned no voices for this language, fallback to browser voices
      const fallback = this.providers.get('browser')!
      return await fallback.getVoices(langFilter)
    } catch {
      // Fallback to browser provider
      const fallback = this.providers.get('browser')!
      return await fallback.getVoices(langFilter)
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
    const provider = this.getActiveProvider()
    try {
      await provider.speak(text, options, callbacks)
    } catch (err: unknown) {
      // If neural engine fails, offer automatic fallback to Browser TTS
      if (this.activeProviderId !== 'browser') {
        console.warn(`Provider ${this.activeProviderId} failed. Falling back to Browser TTS.`, err)
        const fallback = this.providers.get('browser')!
        await fallback.speak(text, options, callbacks)
      } else {
        throw err
      }
    }
  }

  pause(): void {
    this.getActiveProvider().pause()
  }

  resume(): void {
    this.getActiveProvider().resume()
  }

  stop(): void {
    for (const provider of this.providers.values()) {
      provider.stop()
    }
  }

  async preview(voiceId: string, options?: Partial<TTSPlaybackOptions>): Promise<void> {
    await this.getActiveProvider().preview(voiceId, options)
  }

  async downloadAudio(
    text: string,
    options: TTSPlaybackOptions,
    onProgress?: (progress: { stage: string; percent: number; detail?: string }) => void
  ): Promise<GeneratedAudioOutput> {
    const provider = this.getActiveProvider()
    if (provider.downloadAudio) {
      return await provider.downloadAudio(text, options, onProgress)
    }

    // Default to local companion if active, or local neural provider for file download
    if (this.companionProvider.getStatus().isAvailable) {
      return await this.companionProvider.downloadAudio(text, options, onProgress)
    }

    const localNeural = this.providers.get('local-neural')!
    if (localNeural.downloadAudio) {
      return await localNeural.downloadAudio(text, options, onProgress)
    }

    throw new Error('Audio download is not supported by the current engine.')
  }
}
