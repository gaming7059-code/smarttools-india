/**
 * Unified Text-to-Speech Engine Types & Interfaces
 *
 * Defines the shared contracts for all TTS providers:
 * - Companion Neural Engine (Localhost 127.0.0.1:8000)
 * - In-Browser Local Neural (ONNX / WebAssembly)
 * - Free Browser Voices (Web Speech API)
 * - Optional Cloud Studio (BYOK)
 */

export type TTSProviderId = 'companion' | 'local-neural' | 'browser' | 'cloud-neural'

export type VoiceQualityTier =
  | 'neural-hq'
  | 'local-neural'
  | 'natural'
  | 'cloud'
  | 'enhanced'
  | 'system'
  | 'cloud-neural'

export interface TTSVoice {
  id: string
  name: string
  displayName: string
  lang: string
  locale?: string
  gender?: 'Male' | 'Female' | 'Neutral'
  providerId: TTSProviderId
  tier: VoiceQualityTier
  tierLabel: string
  isOffline: boolean
  nativePreviewText: string
  sampleRate?: number
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

export interface CompanionServerStatus {
  isAvailable: boolean
  url: string
  version?: string
  voicesCount?: number
  cpuCores?: number
  lastChecked: number
}
