// 100% Client-Side Web Audio Synthesizer for Games
// No external mp3/wav files required, zero latency, works offline.

class GameAudioService {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smarttools_games_muted')
      this.isMuted = stored === 'true'
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.ctx = new AudioContextClass()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    if (typeof window !== 'undefined') {
      localStorage.setItem('smarttools_games_muted', String(muted))
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted
    this.setMuted(next)
    return next
  }

  // Play a simple tone
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.15): void {
    if (this.isMuted) return
    try {
      const ctx = this.initContext()
      if (!ctx) return

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch {
      // AudioContext policy safe fallback
    }
  }

  public playClick(): void {
    this.playTone(480, 0.05, 'triangle', 0.1)
  }

  public playMove(): void {
    this.playTone(320, 0.08, 'sine', 0.12)
  }

  public playCardFlip(): void {
    this.playTone(560, 0.07, 'triangle', 0.1)
  }

  public playEatFood(): void {
    if (this.isMuted) return
    try {
      const ctx = this.initContext()
      if (!ctx) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(420, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.1)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.1)
    } catch {}
  }

  public playWin(): void {
    if (this.isMuted) return
    const notes = [440, 554.37, 659.25, 880]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'triangle', 0.18)
      }, idx * 90)
    })
  }

  public playGameOver(): void {
    if (this.isMuted) return
    const notes = [380, 320, 260, 200]
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.25, 'sawtooth', 0.12)
      }, idx * 100)
    })
  }
}

export const gameAudio = new GameAudioService()
