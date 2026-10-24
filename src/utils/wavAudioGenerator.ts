/**
 * 100% Client-Side Formant Speech Synthesizer & WAV Audio Generator
 *
 * Synthesizes spoken text into an uncompressed 16-bit PCM RIFF WAV audio file
 * entirely in browser memory using Web Audio API / OfflineAudioContext.
 *
 * - Zero external APIs, zero paid services, zero network requests.
 * - Private & offline: audio is generated directly in the user's browser.
 * - Produces valid, standard 'audio/wav' files playable in any OS or media player.
 * - Supports custom speed (rate), pitch, and volume adjustments.
 */

export interface SpeechWavOptions {
  rate?: number // 0.5 to 2.0 (default 1.0)
  pitch?: number // 0.5 to 2.0 (default 1.0)
  volume?: number // 0.0 to 1.0 (default 1.0)
}

export interface GeneratedAudioResult {
  blob: Blob
  url: string
  filename: string
  durationSeconds: number
  sizeBytes: number
  sampleRate: number
}

// Phoneme acoustic representation
interface PhonemeAcoustics {
  type: 'voiced' | 'fricative' | 'plosive' | 'nasal' | 'pause' | 'aspirate'
  durationMs: number
  f1?: number
  f2?: number
  f3?: number
  noiseFreq?: number
  noiseQ?: number
  gain?: number
}

// Map single digits and symbols to spoken words
const DIGIT_WORDS: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '%': ' percent ',
  '&': ' and ',
  '+': ' plus ',
  '=': ' equals ',
  '@': ' at ',
  '#': ' hash ',
  '/': ' slash ',
  '$': ' dollar ',
  '₹': ' rupee ',
}

// Standard English phoneme acoustic database
const PHONEME_DATA: Record<string, PhonemeAcoustics> = {
  // Vowels
  a: { type: 'voiced', durationMs: 140, f1: 750, f2: 1250, f3: 2450, gain: 0.9 },
  ae: { type: 'voiced', durationMs: 150, f1: 680, f2: 1720, f3: 2450, gain: 0.9 },
  e: { type: 'voiced', durationMs: 130, f1: 530, f2: 1840, f3: 2480, gain: 0.85 },
  ee: { type: 'voiced', durationMs: 160, f1: 270, f2: 2290, f3: 2950, gain: 0.85 },
  i: { type: 'voiced', durationMs: 120, f1: 400, f2: 1990, f3: 2550, gain: 0.8 },
  o: { type: 'voiced', durationMs: 140, f1: 550, f2: 900, f3: 2400, gain: 0.85 },
  oo: { type: 'voiced', durationMs: 150, f1: 320, f2: 850, f3: 2240, gain: 0.85 },
  u: { type: 'voiced', durationMs: 130, f1: 640, f2: 1190, f3: 2390, gain: 0.85 },
  ai: { type: 'voiced', durationMs: 170, f1: 650, f2: 1800, f3: 2500, gain: 0.9 },
  au: { type: 'voiced', durationMs: 170, f1: 600, f2: 1000, f3: 2350, gain: 0.9 },
  er: { type: 'voiced', durationMs: 150, f1: 490, f2: 1350, f3: 1690, gain: 0.85 },

  // Fricatives
  s: { type: 'fricative', durationMs: 100, noiseFreq: 5500, noiseQ: 3.5, gain: 0.55 },
  sh: { type: 'fricative', durationMs: 110, noiseFreq: 3200, noiseQ: 2.5, gain: 0.65 },
  f: { type: 'fricative', durationMs: 90, noiseFreq: 3800, noiseQ: 1.5, gain: 0.4 },
  th: { type: 'fricative', durationMs: 80, noiseFreq: 3500, noiseQ: 2.0, gain: 0.45 },
  z: { type: 'fricative', durationMs: 100, noiseFreq: 4800, noiseQ: 3.0, gain: 0.5 },
  v: { type: 'fricative', durationMs: 80, noiseFreq: 3000, noiseQ: 1.8, gain: 0.45 },
  h: { type: 'aspirate', durationMs: 70, noiseFreq: 1600, noiseQ: 1.2, gain: 0.35 },

  // Plosives
  p: { type: 'plosive', durationMs: 70, noiseFreq: 800, noiseQ: 1.5, gain: 0.6 },
  b: { type: 'plosive', durationMs: 75, noiseFreq: 350, noiseQ: 1.2, gain: 0.6 },
  t: { type: 'plosive', durationMs: 75, noiseFreq: 4200, noiseQ: 3.0, gain: 0.65 },
  d: { type: 'plosive', durationMs: 75, noiseFreq: 2600, noiseQ: 2.0, gain: 0.65 },
  k: { type: 'plosive', durationMs: 80, noiseFreq: 2200, noiseQ: 2.5, gain: 0.7 },
  g: { type: 'plosive', durationMs: 80, noiseFreq: 1800, noiseQ: 2.0, gain: 0.65 },
  ch: { type: 'plosive', durationMs: 100, noiseFreq: 3500, noiseQ: 2.8, gain: 0.7 },
  j: { type: 'plosive', durationMs: 90, noiseFreq: 2800, noiseQ: 2.2, gain: 0.65 },

  // Nasals
  m: { type: 'nasal', durationMs: 110, f1: 280, f2: 1100, f3: 2400, gain: 0.6 },
  n: { type: 'nasal', durationMs: 110, f1: 300, f2: 1550, f3: 2500, gain: 0.65 },
  ng: { type: 'nasal', durationMs: 120, f1: 320, f2: 1900, f3: 2600, gain: 0.65 },

  // Liquids / Semi-vowels
  l: { type: 'voiced', durationMs: 110, f1: 380, f2: 1150, f3: 2600, gain: 0.75 },
  r: { type: 'voiced', durationMs: 110, f1: 420, f2: 1300, f3: 1650, gain: 0.75 },
  w: { type: 'voiced', durationMs: 100, f1: 320, f2: 750, f3: 2300, gain: 0.8 },
  y: { type: 'voiced', durationMs: 100, f1: 280, f2: 2150, f3: 2850, gain: 0.8 },

  // Pauses
  space: { type: 'pause', durationMs: 60 },
  comma: { type: 'pause', durationMs: 180 },
  period: { type: 'pause', durationMs: 320 },
}

// Devanagari character mapping to phonemes
const DEVANAGARI_MAP: Record<string, string[]> = {
  // Independent vowels
  अ: ['a'],
  आ: ['a', 'a'],
  इ: ['i'],
  ई: ['ee'],
  उ: ['u'],
  ऊ: ['oo'],
  ए: ['e'],
  ऐ: ['ai'],
  ओ: ['o'],
  औ: ['au'],
  अं: ['a', 'm'],
  अः: ['a', 'h'],

  // Consonants (inherent 'a' vowel)
  क: ['k', 'a'],
  ख: ['k', 'h', 'a'],
  ग: ['g', 'a'],
  घ: ['g', 'h', 'a'],
  ङ: ['ng', 'a'],
  च: ['ch', 'a'],
  छ: ['ch', 'h', 'a'],
  ज: ['j', 'a'],
  झ: ['j', 'h', 'a'],
  ञ: ['n', 'a'],
  ट: ['t', 'a'],
  ठ: ['t', 'h', 'a'],
  ड: ['d', 'a'],
  ढ: ['d', 'h', 'a'],
  ण: ['n', 'a'],
  त: ['t', 'a'],
  थ: ['t', 'h', 'a'],
  द: ['d', 'a'],
  ध: ['d', 'h', 'a'],
  न: ['n', 'a'],
  प: ['p', 'a'],
  फ: ['f', 'a'],
  ब: ['b', 'a'],
  भ: ['b', 'h', 'a'],
  म: ['m', 'a'],
  य: ['y', 'a'],
  र: ['r', 'a'],
  ल: ['l', 'a'],
  व: ['w', 'a'],
  श: ['sh', 'a'],
  ष: ['sh', 'a'],
  स: ['s', 'a'],
  ह: ['h', 'a'],

  // Matras
  'ा': ['a'],
  'ि': ['i'],
  'ी': ['ee'],
  'ु': ['u'],
  'ू': ['oo'],
  'े': ['e'],
  'ै': ['ai'],
  'ो': ['o'],
  'ौ': ['au'],
  'ं': ['m'],
  'ः': ['h'],
}

/**
 * Normalizes input text and tokenizes into speech phoneme sequence
 */
function tokenizeTextToPhonemes(inputText: string): PhonemeAcoustics[] {
  // Replace digits and symbols with words
  let text = inputText
  for (const [sym, word] of Object.entries(DIGIT_WORDS)) {
    text = text.split(sym).join(` ${word} `)
  }

  const tokens: PhonemeAcoustics[] = []
  let i = 0

  while (i < text.length) {
    const char = text[i]

    // Sentence pause punctuation
    if (char === '.' || char === '!' || char === '?' || char === '\n') {
      tokens.push({ ...PHONEME_DATA.period })
      i++
      continue
    }

    // Minor pause punctuation
    if (char === ',' || char === ';' || char === ':' || char === '-' || char === '—') {
      tokens.push({ ...PHONEME_DATA.comma })
      i++
      continue
    }

    // Word boundary whitespace
    if (/\s/.test(char)) {
      tokens.push({ ...PHONEME_DATA.space })
      while (i < text.length && /\s/.test(text[i])) {
        i++
      }
      continue
    }

    // Check Devanagari character
    if (DEVANAGARI_MAP[char]) {
      const phonemeKeys = DEVANAGARI_MAP[char]
      // Check if next char is virama (्) which removes inherent vowel
      const nextChar = text[i + 1]
      if (nextChar === '्') {
        // Only keep the consonant part
        const consonantKey = phonemeKeys[0]
        if (PHONEME_DATA[consonantKey]) {
          tokens.push({ ...PHONEME_DATA[consonantKey] })
        }
        i += 2
        continue
      }
      // Check if next char is a matra
      if (nextChar && DEVANAGARI_MAP[nextChar]) {
        // Consonant + matra
        const consonantKey = phonemeKeys[0]
        const matraKeys = DEVANAGARI_MAP[nextChar]
        if (PHONEME_DATA[consonantKey]) tokens.push({ ...PHONEME_DATA[consonantKey] })
        for (const mk of matraKeys) {
          if (PHONEME_DATA[mk]) tokens.push({ ...PHONEME_DATA[mk] })
        }
        i += 2
        continue
      }

      for (const pk of phonemeKeys) {
        if (PHONEME_DATA[pk]) tokens.push({ ...PHONEME_DATA[pk] })
      }
      i++
      continue
    }

    // Two-character English combinations
    const two = text.slice(i, i + 2).toLowerCase()
    if (two === 'ee' || two === 'ea') {
      tokens.push({ ...PHONEME_DATA.ee })
      i += 2
      continue
    }
    if (two === 'oo') {
      tokens.push({ ...PHONEME_DATA.oo })
      i += 2
      continue
    }
    if (two === 'ai' || two === 'ay') {
      tokens.push({ ...PHONEME_DATA.ai })
      i += 2
      continue
    }
    if (two === 'au' || two === 'aw') {
      tokens.push({ ...PHONEME_DATA.au })
      i += 2
      continue
    }
    if (two === 'sh') {
      tokens.push({ ...PHONEME_DATA.sh })
      i += 2
      continue
    }
    if (two === 'ch') {
      tokens.push({ ...PHONEME_DATA.ch })
      i += 2
      continue
    }
    if (two === 'th') {
      tokens.push({ ...PHONEME_DATA.th })
      i += 2
      continue
    }
    if (two === 'ng') {
      tokens.push({ ...PHONEME_DATA.ng })
      i += 2
      continue
    }
    if (two === 'er' || two === 'ir' || two === 'ur' || two === 'or') {
      tokens.push({ ...PHONEME_DATA.er })
      i += 2
      continue
    }

    // Single English character
    const lower = char.toLowerCase()
    if (PHONEME_DATA[lower]) {
      tokens.push({ ...PHONEME_DATA[lower] })
    } else if (lower === 'c') {
      tokens.push({ ...PHONEME_DATA.k })
    } else if (lower === 'q') {
      tokens.push({ ...PHONEME_DATA.k }, { ...PHONEME_DATA.w })
    } else if (lower === 'x') {
      tokens.push({ ...PHONEME_DATA.k }, { ...PHONEME_DATA.s })
    } else {
      // Default fallback for other alphanumeric characters
      if (/[a-z]/i.test(char)) {
        tokens.push({ ...PHONEME_DATA.a })
      }
    }

    i++
  }

  return tokens
}

/**
 * Encodes raw 32-bit float audio samples into a 16-bit PCM RIFF .wav Blob
 */
export function encodeWavBlob(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1
  const bytesPerSample = 2 // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const totalBufferSize = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(totalBufferSize)
  const view = new DataView(arrayBuffer)

  // Write ASCII tag helper
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  // RIFF Header
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true) // ChunkSize
  writeString(8, 'WAVE')

  // "fmt " Subchunk
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true) // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true) // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true) // SampleRate
  view.setUint32(28, byteRate, true) // ByteRate
  view.setUint16(32, blockAlign, true) // BlockAlign
  view.setUint16(34, 16, true) // BitsPerSample

  // "data" Subchunk
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Write 16-bit PCM signed integer samples
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    // Clamp sample between -1.0 and 1.0
    const clamped = Math.max(-1.0, Math.min(1.0, samples[i]))
    // Scale to signed 16-bit integer range [-32768, 32767]
    const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
    view.setInt16(offset, Math.round(intSample), true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Synthesizes text into a downloadable 16-bit PCM WAV audio file using OfflineAudioContext
 */
export async function generateSpeechWav(
  text: string,
  options: SpeechWavOptions = {}
): Promise<GeneratedAudioResult> {
  const { rate = 1.0, pitch = 1.0, volume = 1.0 } = options

  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Please enter some text before generating audio.')
  }

  // Check browser support for OfflineAudioContext
  const OfflineContextClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext

  if (!OfflineContextClass) {
    throw new Error('Your browser does not support Web Audio rendering (OfflineAudioContext).')
  }

  // Parse text into phoneme acoustic tokens
  const phonemes = tokenizeTextToPhonemes(trimmed)
  if (phonemes.length === 0) {
    throw new Error('Unable to extract printable speech tokens from the text.')
  }

  // Speed multiplier: rate < 1 means slower (longer duration), rate > 1 means faster (shorter duration)
  const speedScale = 1.0 / Math.max(0.4, Math.min(2.5, rate))

  // Calculate total audio duration in seconds
  let totalDurationMs = 0
  for (const p of phonemes) {
    totalDurationMs += p.durationMs * speedScale
  }
  // Add safety decay padding at the end (250ms)
  totalDurationMs += 250

  const sampleRate = 22050
  const totalDurationSeconds = Math.max(0.4, totalDurationMs / 1000)
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate)

  // Create Offline Audio Context for faster-than-realtime synthesis
  const offlineCtx = new OfflineContextClass(1, totalSamples, sampleRate)

  // Master Gain Node
  const masterGain = offlineCtx.createGain()
  masterGain.gain.setValueAtTime(Math.max(0.0, Math.min(1.0, volume)), 0)
  masterGain.connect(offlineCtx.destination)

  // 1. Voiced Sound Source: Glottal Pulse Generator (Sawtooth with low-pass dampening)
  const baseF0 = 145 * Math.max(0.5, Math.min(2.0, pitch)) // Base fundamental frequency
  const voiceOsc = offlineCtx.createOscillator()
  voiceOsc.type = 'sawtooth'
  voiceOsc.frequency.setValueAtTime(baseF0, 0)

  // Glottal low-pass filter (simulates vocal fold tissue dampening higher harmonics)
  const glottalFilter = offlineCtx.createBiquadFilter()
  glottalFilter.type = 'lowpass'
  glottalFilter.frequency.setValueAtTime(2800, 0)
  voiceOsc.connect(glottalFilter)

  // Three parallel formant bandpass filters (F1, F2, F3)
  const f1Filter = offlineCtx.createBiquadFilter()
  f1Filter.type = 'bandpass'
  f1Filter.frequency.setValueAtTime(500, 0)
  f1Filter.Q.setValueAtTime(6.0, 0)

  const f2Filter = offlineCtx.createBiquadFilter()
  f2Filter.type = 'bandpass'
  f2Filter.frequency.setValueAtTime(1500, 0)
  f2Filter.Q.setValueAtTime(7.5, 0)

  const f3Filter = offlineCtx.createBiquadFilter()
  f3Filter.type = 'bandpass'
  f3Filter.frequency.setValueAtTime(2500, 0)
  f3Filter.Q.setValueAtTime(9.0, 0)

  const f1Gain = offlineCtx.createGain()
  f1Gain.gain.setValueAtTime(0.7, 0)
  const f2Gain = offlineCtx.createGain()
  f2Gain.gain.setValueAtTime(0.4, 0)
  const f3Gain = offlineCtx.createGain()
  f3Gain.gain.setValueAtTime(0.2, 0)

  glottalFilter.connect(f1Filter)
  glottalFilter.connect(f2Filter)
  glottalFilter.connect(f3Filter)

  f1Filter.connect(f1Gain)
  f2Filter.connect(f2Gain)
  f3Filter.connect(f3Gain)

  const voicedMasterGain = offlineCtx.createGain()
  voicedMasterGain.gain.setValueAtTime(0, 0)

  f1Gain.connect(voicedMasterGain)
  f2Gain.connect(voicedMasterGain)
  f3Gain.connect(voicedMasterGain)
  voicedMasterGain.connect(masterGain)

  // 2. Unvoiced Sound Source: Filtered Noise Generator for Fricatives, Bursts, & Plosives
  const noiseBufferSize = sampleRate * 2 // 2 seconds looping white noise buffer
  const noiseBuffer = offlineCtx.createBuffer(1, noiseBufferSize, sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)
  for (let n = 0; n < noiseBufferSize; n++) {
    noiseData[n] = Math.random() * 2 - 1
  }

  const noiseSource = offlineCtx.createBufferSource()
  noiseSource.buffer = noiseBuffer
  noiseSource.loop = true

  const noiseFilter = offlineCtx.createBiquadFilter()
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.setValueAtTime(4000, 0)
  noiseFilter.Q.setValueAtTime(2.0, 0)

  const noiseGain = offlineCtx.createGain()
  noiseGain.gain.setValueAtTime(0, 0)

  noiseSource.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(masterGain)

  // Start oscillators
  voiceOsc.start(0)
  noiseSource.start(0)

  // Schedule phoneme envelopes and filter modulations across time
  let currentTime = 0.05 // start with slight 50ms silence

  for (let idx = 0; idx < phonemes.length; idx++) {
    const p = phonemes[idx]
    const pDur = (p.durationMs * speedScale) / 1000
    const attack = Math.min(0.02, pDur * 0.25)
    const release = Math.min(0.02, pDur * 0.25)
    const sustainDur = Math.max(0.005, pDur - attack - release)

    // Slight natural pitch intonation (gentle inflection)
    const intonation = 1.0 - 0.05 * Math.sin((idx / phonemes.length) * Math.PI)
    const currentF0 = baseF0 * intonation

    if (p.type === 'voiced' || p.type === 'nasal') {
      const f1 = p.f1 || 500
      const f2 = p.f2 || 1500
      const f3 = p.f3 || 2500
      const targetGain = (p.gain || 0.8) * 0.7

      // Smoothly transition formant frequencies
      f1Filter.frequency.setTargetAtTime(f1, currentTime, 0.015)
      f2Filter.frequency.setTargetAtTime(f2, currentTime, 0.015)
      f3Filter.frequency.setTargetAtTime(f3, currentTime, 0.015)
      voiceOsc.frequency.setTargetAtTime(currentF0, currentTime, 0.015)

      // Voiced envelope
      voicedMasterGain.gain.setValueAtTime(0, currentTime)
      voicedMasterGain.gain.linearRampToValueAtTime(targetGain, currentTime + attack)
      voicedMasterGain.gain.setValueAtTime(targetGain, currentTime + attack + sustainDur)
      voicedMasterGain.gain.linearRampToValueAtTime(0, currentTime + pDur)

      // Ensure noise is silent
      noiseGain.gain.setValueAtTime(0, currentTime)
    } else if (p.type === 'fricative' || p.type === 'aspirate') {
      const nFreq = p.noiseFreq || 4000
      const nQ = p.noiseQ || 2.0
      const targetGain = (p.gain || 0.5) * 0.65

      noiseFilter.frequency.setTargetAtTime(nFreq, currentTime, 0.01)
      noiseFilter.Q.setTargetAtTime(nQ, currentTime, 0.01)

      // Noise envelope
      noiseGain.gain.setValueAtTime(0, currentTime)
      noiseGain.gain.linearRampToValueAtTime(targetGain, currentTime + attack)
      noiseGain.gain.setValueAtTime(targetGain, currentTime + attack + sustainDur)
      noiseGain.gain.linearRampToValueAtTime(0, currentTime + pDur)

      // Ensure voiced is silent
      voicedMasterGain.gain.setValueAtTime(0, currentTime)
    } else if (p.type === 'plosive') {
      // Plosive: brief closure (silence) followed by sudden burst
      const closureDur = pDur * 0.4
      const burstTime = currentTime + closureDur
      const burstDur = pDur - closureDur
      const nFreq = p.noiseFreq || 2500
      const targetGain = (p.gain || 0.6) * 0.8

      // Silence during closure
      voicedMasterGain.gain.setValueAtTime(0, currentTime)
      noiseGain.gain.setValueAtTime(0, currentTime)

      // Burst
      noiseFilter.frequency.setValueAtTime(nFreq, burstTime)
      noiseFilter.Q.setValueAtTime(p.noiseQ || 2.0, burstTime)
      noiseGain.gain.setValueAtTime(targetGain, burstTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, burstTime + burstDur)
    } else {
      // Pause
      voicedMasterGain.gain.setValueAtTime(0, currentTime)
      noiseGain.gain.setValueAtTime(0, currentTime)
    }

    currentTime += pDur
  }

  // Stop oscillators after playback finishes
  voiceOsc.stop(currentTime + 0.1)
  noiseSource.stop(currentTime + 0.1)

  // Render audio into buffer
  const renderedBuffer = await offlineCtx.startRendering()
  const rawSamples = renderedBuffer.getChannelData(0)

  // Normalize / Soft limiter to avoid clipping and maximize clarity
  let maxPeak = 0
  for (let i = 0; i < rawSamples.length; i++) {
    const abs = Math.abs(rawSamples[i])
    if (abs > maxPeak) maxPeak = abs
  }

  const normalized = new Float32Array(rawSamples.length)
  const normFactor = maxPeak > 0.01 ? Math.min(1.5, 0.92 / maxPeak) : 1.0

  for (let i = 0; i < rawSamples.length; i++) {
    normalized[i] = rawSamples[i] * normFactor
  }

  // Encode to 16-bit PCM RIFF WAV Blob
  const blob = encodeWavBlob(normalized, sampleRate)
  const url = URL.createObjectURL(blob)
  const filename = `smarttools-speech-${Date.now()}.wav`

  return {
    blob,
    url,
    filename,
    durationSeconds: totalDurationSeconds,
    sizeBytes: blob.size,
    sampleRate,
  }
}

/**
 * Cleanly releases an object URL created for speech audio
 */
export function revokeSpeechAudioUrl(url: string | null | undefined): void {
  if (url && typeof window !== 'undefined' && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // Safe fallback
    }
  }
}
