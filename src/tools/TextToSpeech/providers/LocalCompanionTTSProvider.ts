/**
 * Local Companion Neural TTS Provider (FastAPI on 127.0.0.1:8000)
 *
 * Connects to the local Python companion service for authentic 24kHz neural speech.
 * - Supports Bengali (bn), Hindi (hi), English (en), and Urdu (ur).
 * - Multi-speaker options (Male and Female).
 * - Zero API keys, zero cloud tokens, completely local to the user's workstation.
 * - Generates high-fidelity MP3 audio streams.
 */

import type { TTSProvider } from './TTSProvider'
import type {
  TTSVoice,
  TTSPlaybackOptions,
  TTSProgressInfo,
  GeneratedAudioOutput,
  CompanionServerStatus,
} from '../types'

const COMPANION_URL = 'http://127.0.0.1:8000'

export class LocalCompanionTTSProvider implements TTSProvider {
  readonly id = 'companion' as const
  readonly name = 'Companion Neural Engine'
  readonly description = '24kHz Studio Neural Voice Engine running locally on your PC (FastAPI • 127.0.0.1:8000)'
  readonly canDownload = true
  readonly requiresNetwork = false // Local connection only

  private currentAudio: HTMLAudioElement | null = null
  private serverStatus: CompanionServerStatus = {
    isAvailable: false,
    url: COMPANION_URL,
    lastChecked: 0,
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now()
    // Cache check status for 2 seconds to avoid excessive network polls
    if (now - this.serverStatus.lastChecked < 2000 && this.serverStatus.isAvailable) {
      return true
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1200)

      const resp = await fetch(`${COMPANION_URL}/api/health`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (resp.ok) {
        const data = await resp.json()
        this.serverStatus = {
          isAvailable: true,
          url: COMPANION_URL,
          version: data.version,
          voicesCount: data.voices_count,
          cpuCores: data.hardware?.cpu_cores,
          lastChecked: now,
        }
        return true
      }
    } catch {
      // Server not running or blocked
    }

    this.serverStatus = {
      isAvailable: false,
      url: COMPANION_URL,
      lastChecked: now,
    }
    return false
  }

  getStatus(): CompanionServerStatus {
    return this.serverStatus
  }

  async getVoices(langFilter?: string): Promise<TTSVoice[]> {
    const isUp = await this.isAvailable()
    if (!isUp) {
      return []
    }

    try {
      const url = langFilter && langFilter !== 'all'
        ? `${COMPANION_URL}/api/voices?lang=${encodeURIComponent(langFilter)}`
        : `${COMPANION_URL}/api/voices`

      const resp = await fetch(url)
      if (!resp.ok) return []

      interface RemoteVoice {
        id: string
        name: string
        displayName: string
        lang: string
        gender?: 'Male' | 'Female'
        tier: 'neural-hq'
        tierLabel: string
        previewText: string
        sampleRate?: number
      }

      const remoteVoices: RemoteVoice[] = await resp.json()

      return remoteVoices.map((v) => ({
        id: v.id,
        name: v.name,
        displayName: v.displayName,
        lang: v.lang,
        gender: v.gender,
        providerId: 'companion' as const,
        tier: 'neural-hq' as const,
        tierLabel: v.tierLabel || '24kHz Neural',
        isOffline: true, // Offline once running locally on 127.0.0.1
        nativePreviewText: v.previewText,
        sampleRate: v.sampleRate || 24000,
      }))
    } catch {
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
    try {
      this.stop()
      callbacks.onStart?.()

      callbacks.onProgress?.({
        activeSentenceIndex: 0,
        totalSentences: 1,
        currentSentenceText: 'Generating 24kHz neural speech stream...',
        percent: 30,
      })

      const resp = await fetch(`${COMPANION_URL}/api/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: options.voiceId,
          rate: options.rate,
          pitch: options.pitch,
          volume: options.volume,
        }),
      })

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({ detail: 'Companion server synthesis failed' }))
        throw new Error(errJson.detail || 'Synthesis failed on companion server')
      }

      callbacks.onProgress?.({
        activeSentenceIndex: 0,
        totalSentences: 1,
        currentSentenceText: 'Streaming studio audio...',
        percent: 85,
      })

      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      this.currentAudio = audio
      audio.playbackRate = options.rate
      audio.volume = options.volume

      audio.onended = () => {
        URL.revokeObjectURL(url)
        this.currentAudio = null
        callbacks.onEnd?.()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        this.currentAudio = null
        callbacks.onError?.(new Error('Audio playback failed.'))
      }

      callbacks.onProgress?.({
        activeSentenceIndex: 0,
        totalSentences: 1,
        currentSentenceText: 'Playing audio...',
        percent: 100,
      })

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
      this.currentAudio.play().catch(console.error)
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
    const voices = await this.getVoices()
    const voice = voices.find((v) => v.id === voiceId)
    const previewText = voice?.nativePreviewText || 'Hello! This is a preview of the companion neural voice.'

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
    onProgress?.({
      stage: 'Connecting to local companion neural engine...',
      percent: 15,
    })

    const resp = await fetch(`${COMPANION_URL}/api/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: options.voiceId,
        rate: options.rate,
        pitch: options.pitch,
        volume: options.volume,
      }),
    })

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to synthesize audio file' }))
      throw new Error(err.detail || 'Download generation failed')
    }

    onProgress?.({
      stage: 'Receiving 24kHz neural audio...',
      percent: 80,
    })

    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const timestamp = Date.now()
    const filename = `smarttools-neural-${options.voiceId}-${timestamp}.mp3`

    onProgress?.({
      stage: 'Complete',
      percent: 100,
    })

    return {
      blob,
      url,
      filename,
      durationSeconds: 0, // Will be measured by player
      sizeBytes: blob.size,
      sampleRate: 24000,
      format: 'mp3',
    }
  }
}
