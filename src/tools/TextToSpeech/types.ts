/**
 * Unified Text-to-Speech Engine Types & Interfaces
 *
 * Defines the shared contracts for all TTS providers (Browser, Local Neural, Cloud Neural),
 * voices, playback options, and progress events.
 */

export type TTSProviderId = 'browser' | 'local-neural' | 'cloud-neural'

export type VoiceQualityTier =
  | 'natural'
  | 'cloud'
  | 'enhanced'
  | 'system'
  | 'local-neural'
  | 'cloud-neural'

export interface TTSVoice {
  id: string
  name: string
  displayName: string
  lang: string
  providerId: TTSProviderId
  tier: VoiceQualityTier
  tierLabel: string
  isOffline: boolean
  nativePreviewText: string
}

export interface TTSPlaybackOptions {
  voiceId: string
  rate: number
  pitch: number
  volume: number
}

export type TTSPlaybackState = 'idle' | 'speaking' | 'paused' | 'generating'

export interface TTSProgressInfo {
  activeSentenceIndex: number
  totalSentences: number
  currentSentenceText: string
  percent: number
}

export interface GeneratedAudioOutput {
  blob: Blob
  url: string
  filename: string
  durationSeconds: number
  sizeBytes: number
  sampleRate: number
  format: string
}

export interface CloudProviderConfig {
  provider: 'openai' | 'elevenlabs'
  apiKey: string
  model?: string
}
