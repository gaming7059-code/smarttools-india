/**
 * Optional Cloud Neural TTS Provider (BYOK - Bring Your Own Key)
 *
 * Enables optional studio-grade cloud neural voices for advanced users.
 * - 100% Client-Side Direct Calls: Requests are sent directly from the user's browser.
 * - Zero Server Storage: API keys are stored strictly in the user's local browser localStorage.
 * - Zero Cost to SmartTools India: No backend bills or proxy requirements.
 * - Supported Providers: OpenAI TTS (tts-1), ElevenLabs
 */

import type { TTSProvider } from './TTSProvider'
import type {
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
  GeneratedAudioOutput,
} from '../types'

const LOCAL_STORAGE_KEY = 'smarttools_tts_cloud_config'

export interface StoredCloudConfig {
  provider: 'openai' | 'elevenlabs'
  apiKey: string
}

export class CloudNeuralTTSProvider implements TTSProvider {
  readonly id = 'cloud-neural' as const
  readonly name = 'Cloud Studio (BYOK)'
  readonly description = 'Optional studio neural voices via your own private OpenAI or ElevenLabs key (saved locally)'
  readonly canDownload = true
  readonly requiresNetwork = true

  private currentAudio: HTMLAudioElement | null = null

  static getConfig(): StoredCloudConfig | null {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  static setConfig(config: StoredCloudConfig | null): void {
    try {
      if (config && config.apiKey.trim()) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config))
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    } catch (e) {
      console.warn('Unable to save cloud TTS key to localStorage', e)
    }
  }

  async isAvailable(): Promise<boolean> {
    const config = CloudNeuralTTSProvider.getConfig()
    return !!(config && config.apiKey.trim())
  }

  async getVoices(): Promise<TTSVoice[]> {
    const config = CloudNeuralTTSProvider.getConfig()

    if (config?.provider === 'openai') {
      return [
        {
          id: 'openai-alloy',
          name: 'OpenAI Alloy',
          displayName: 'Alloy (Balanced & Natural)',
          lang: 'en-US',
          providerId: 'cloud-neural',
          tier: 'cloud-neural',
          tierLabel: 'Cloud Studio',
          isOffline: false,
          nativePreviewText: 'Hello! I am Alloy, an OpenAI neural voice.',
        },
        {
          id: 'openai-nova',
          name: 'OpenAI Nova',
          displayName: 'Nova (Warm & Expressive)',
          lang: 'en-US',
          providerId: 'cloud-neural',
          tier: 'cloud-neural',
          tierLabel: 'Cloud Studio',
          isOffline: false,
          nativePreviewText: 'Hello! I am Nova, an expressive neural voice.',
        },
        {
          id: 'openai-shimmer',
          name: 'OpenAI Shimmer',
          displayName: 'Shimmer (Clear & Engaging)',
          lang: 'en-US',
          providerId: 'cloud-neural',
          tier: 'cloud-neural',
          tierLabel: 'Cloud Studio',
          isOffline: false,
          nativePreviewText: 'Hello! I am Shimmer, a clear and engaging voice.',
        },
        {
          id: 'openai-echo',
          name: 'OpenAI Echo',
          displayName: 'Echo (Calm & Deep)',
          lang: 'en-US',
          providerId: 'cloud-neural',
          tier: 'cloud-neural',
          tierLabel: 'Cloud Studio',
          isOffline: false,
          nativePreviewText: 'Hello! I am Echo, a deep and calm voice.',
        },
      ]
    }

    // Default placeholder voices shown when unconfigured
    return [
      {
        id: 'cloud-preview-1',
        name: 'OpenAI Alloy / Nova',
        displayName: 'OpenAI Neural Studio (Connect Key)',
        lang: 'en-US',
        providerId: 'cloud-neural',
        tier: 'cloud-neural',
        tierLabel: 'Cloud Studio',
        isOffline: false,
        nativePreviewText: 'Connect your private API key to enable OpenAI Studio voices.',
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
    const config = CloudNeuralTTSProvider.getConfig()
    if (!config?.apiKey) {
      throw new Error('Please configure your private OpenAI or ElevenLabs API key in Cloud Settings.')
    }

    try {
      this.stop()
      callbacks.onStart?.()

      callbacks.onProgress?.({
        activeSentenceIndex: 0,
        totalSentences: 1,
        currentSentenceText: 'Connecting to Cloud Neural API...',
        percent: 25,
      })

      const voiceName = options.voiceId.replace('openai-', '') || 'alloy'

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text.slice(0, 4000),
          voice: voiceName,
          speed: options.rate,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Cloud API error (${response.status}): ${errorBody}`)
      }

      callbacks.onProgress?.({
        activeSentenceIndex: 0,
        totalSentences: 1,
        currentSentenceText: 'Streaming studio audio...',
        percent: 85,
      })

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      this.currentAudio = audio
      audio.volume = options.volume

      audio.onended = () => {
        URL.revokeObjectURL(url)
        this.currentAudio = null
        callbacks.onEnd?.()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        this.currentAudio = null
        callbacks.onError?.(new Error('Cloud audio playback failed.'))
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
    await this.speak(
      'Hello! This is a preview of the cloud studio neural voice.',
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
    const config = CloudNeuralTTSProvider.getConfig()
    if (!config?.apiKey) {
      throw new Error('Please configure your private OpenAI or ElevenLabs API key in Cloud Settings.')
    }

    onProgress?.({ stage: 'Sending text to Cloud Neural API...', percent: 20 })

    const voiceName = options.voiceId.replace('openai-', '') || 'alloy'

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4000),
        voice: voiceName,
        speed: options.rate,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Cloud API error (${response.status}): ${errorBody}`)
    }

    onProgress?.({ stage: 'Receiving high-fidelity MP3 stream...', percent: 80 })

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const timestamp = Date.now()

    onProgress?.({ stage: 'Audio ready for download!', percent: 100 })

    return {
      blob,
      url,
      filename: `smarttools-cloud-${voiceName}-${timestamp}.mp3`,
      durationSeconds: 0,
      sizeBytes: blob.size,
      sampleRate: 24000,
      format: 'audio/mp3',
    }
  }
}
