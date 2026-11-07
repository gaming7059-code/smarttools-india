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
      return await active.getVoices(langFilter)
    } catch (err) {
      console.warn(`Error loading voices for provider ${this.activeProviderId}:`, err)
      return []
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
      const error = err instanceof Error ? err : new Error(String(err))
      callbacks.onError?.(error)
      throw error
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
