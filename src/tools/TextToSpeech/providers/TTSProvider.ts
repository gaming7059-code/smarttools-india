/**
 * Abstract TTS Provider Contract
 *
 * Defines the standard lifecycle and capabilities required by any TTS provider.
 */

import type {
  TTSProviderId,
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
  GeneratedAudioOutput,
} from '../types'

export interface TTSProvider {
  readonly id: TTSProviderId
  readonly name: string
  readonly description: string
  readonly canDownload: boolean
  readonly requiresNetwork: boolean

  /** Verifies whether this provider is supported in the current client environment */
  isAvailable(): Promise<boolean>

  /** Returns all available voices for this provider, optionally filtered by language code */
  getVoices(langFilter?: string): Promise<TTSVoice[]>

  /** Speaks the given text with real-time sentence callbacks */
  speak(
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
  ): Promise<void>

  /** Pauses active speech */
  pause(): void

  /** Resumes paused speech */
  resume(): void

  /** Stops ongoing speech immediately */
  stop(): void

  /** Plays a quick audio preview of a specific voice */
  preview(voiceId: string, options?: Partial<TTSPlaybackOptions>): Promise<void>

  /** Synthesizes and returns a downloadable audio file (Blob), if supported */
  downloadAudio?(
    text: string,
    options: TTSPlaybackOptions,
    onProgress?: (progress: { stage: string; percent: number; detail?: string }) => void
  ): Promise<GeneratedAudioOutput>
}
