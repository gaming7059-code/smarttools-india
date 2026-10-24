/**
 * Real In-Browser Neural Text-to-Speech Engine
 * Powered by Meta MMS-TTS (VITS Architecture) via Transformers.js
 *
 * - 100% Client-Side: Runs on WebAssembly / WebGPU in the user's browser.
 * - Zero external API keys, zero paid services, zero remote text uploads.
 * - End-to-end neural waveform synthesis producing authentic human speech.
 * - Verified models:
 *   - English: Xenova/mms-tts-eng (Quantized ONNX, ~38.4 MB)
 *   - Hindi: Xenova/mms-tts-hin (Quantized ONNX, ~38.4 MB)
 * - Models are downloaded on-demand and cached in browser IndexedDB/Cache API.
 */

import { encodeWavBlob } from './wavAudioGenerator'

export type NeuralLanguage = 'en' | 'hi'

export interface NeuralProgressInfo {
  stage: string
  percent: number
  detail?: string
}

export interface NeuralSpeechResult {
  blob: Blob
  url: string
  filename: string
  durationSeconds: number
  sizeBytes: number
  sampleRate: number
  language: NeuralLanguage
}

// In-memory cache of pipeline instances to avoid re-instantiation overhead
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pipelineCache: Partial<Record<NeuralLanguage, any>> = {}

// Single-digit and common symbol mapping for clear pronunciation in neural speech
const SYMBOL_REPLACEMENTS: Record<string, string> = {
  '%': ' percent ',
  '&': ' and ',
  '+': ' plus ',
  '=': ' equals ',
  '@': ' at ',
  '#': ' number ',
  '/': ' slash ',
  '$': ' dollars ',
  '₹': ' rupees ',
}

const DIGIT_WORDS_EN: Record<string, string> = {
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
}

/**
 * Normalizes input text for MMS-TTS: expands symbols and stand-alone numbers
 * so the model does not skip or mispronounce them.
 */
export function normalizeTextForMms(input: string, lang: NeuralLanguage): string {
  let text = input.trim()

  // Replace common symbols with phonetic equivalents
  for (const [sym, word] of Object.entries(SYMBOL_REPLACEMENTS)) {
    text = text.split(sym).join(word)
  }

  // In English, expand stand-alone digits
  if (lang === 'en') {
    text = text.replace(/\b\d\b/g, (d) => DIGIT_WORDS_EN[d] || d)
  }

  // Remove repeated punctuation and normalize spaces
  text = text.replace(/([.!?।])\1+/g, '$1')
  text = text.replace(/\s+/g, ' ')

  return text.trim()
}

/**
 * Splits text ONLY on real, full sentence boundaries (never mid-thought or mid-clause)
 * to maintain natural vocal inflection (prosody) and prevent stuttering pauses.
 */
export function splitIntoSentences(text: string): string[] {
  const clean = text.trim()
  if (!clean) return []

  // Split on full sentence endings: period, exclamation, question mark, Hindi danda (।), or newline
  const sentenceRegex = /[^.!?।\n]+[.!?।\n]*/g
  const matches = clean.match(sentenceRegex) || [clean]

  const sentences: string[] = []
  for (const match of matches) {
    const s = match.trim()
    if (s.length === 0) continue

    // If a single sentence is extraordinarily long (>350 characters without punctuation),
    // split gracefully at clause boundaries (comma, semicolon, dash)
    if (s.length > 350) {
      const clauses = s.split(/([,;—–-]|\s{2,})/).filter((c) => c.trim().length > 0)
      let current = ''
      for (const clause of clauses) {
        if ((current + ' ' + clause).trim().length > 300) {
          if (current.trim()) sentences.push(current.trim())
          current = clause
        } else {
          current = current ? `${current} ${clause}` : clause
        }
      }
      if (current.trim()) sentences.push(current.trim())
    } else {
      sentences.push(s)
    }
  }

  return sentences
}

/**
 * Trims unnatural leading and trailing dead silence buffers produced by the neural model.
 * Each raw MMS-TTS output typically contains ~300ms of leading silence and ~250ms of trailing silence.
 * Trimming these buffers removes stuttering gaps and enables smooth, continuous sentence transitions.
 */
export function trimSilence(audio: Float32Array, sampleRate: number, threshold = 0.015): Float32Array {
  let start = 0
  while (start < audio.length && Math.abs(audio[start]) < threshold) {
    start++
  }

  let end = audio.length - 1
  while (end > start && Math.abs(audio[end]) < threshold) {
    end--
  }

  // Preserve a 20ms safety margin to avoid abruptly clipping soft plosives or natural acoustic release
  const safetyMargin = Math.round(sampleRate * 0.02)
  const safeStart = Math.max(0, start - safetyMargin)
  const safeEnd = Math.min(audio.length, end + safetyMargin)

  return audio.subarray(safeStart, safeEnd)
}

/**
 * Checks if the current browser environment supports WebAssembly and required Web APIs
 */
export function isNeuralTtsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof WebAssembly !== 'undefined' &&
    'caches' in window
  )
}

/**
 * Generates smooth, natural neural speech and returns a standard 16-bit PCM WAV audio file
 */
export async function generateNeuralSpeech(
  text: string,
  language: NeuralLanguage,
  onProgress?: (progress: NeuralProgressInfo) => void
): Promise<NeuralSpeechResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Please enter some text before generating audio.')
  }

  if (!isNeuralTtsSupported()) {
    throw new Error('Neural Speech requires WebAssembly and browser caching support.')
  }

  const modelId = language === 'hi' ? 'Xenova/mms-tts-hin' : 'Xenova/mms-tts-eng'

  onProgress?.({
    stage: 'Initializing neural speech pipeline...',
    percent: 5,
  })

  // Dynamically import @huggingface/transformers to keep initial page load lightweight
  const { pipeline } = await import('@huggingface/transformers')

  let synthesizer = pipelineCache[language]

  if (!synthesizer) {
    onProgress?.({
      stage: 'Loading neural voice model (cached offline after first download)...',
      percent: 15,
      detail: `${modelId} (~38 MB)`,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressCallback = (p: any) => {
      if (p.status === 'progress' && typeof p.progress === 'number') {
        const pct = Math.min(95, Math.max(15, Math.round(15 + p.progress * 0.75)))
        const detailStr = p.file
          ? `${p.file} (${Math.round((p.loaded || 0) / 1024 / 1024)}MB / ${Math.round((p.total || 0) / 1024 / 1024)}MB)`
          : undefined
        onProgress?.({
          stage: 'Downloading neural voice weights...',
          percent: pct,
          detail: detailStr,
        })
      } else if (p.status === 'ready' || p.status === 'done') {
        onProgress?.({
          stage: 'Neural voice model ready in memory',
          percent: 90,
        })
      }
    }

    try {
      synthesizer = await pipeline('text-to-speech', modelId, {
        progress_callback: progressCallback,
      })
      pipelineCache[language] = synthesizer
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load neural model.'
      throw new Error(`Neural model loading error: ${msg}. If offline, please connect once to download the model.`)
    }
  }

  // Normalize text for clear pronunciation and numbers
  const normalized = normalizeTextForMms(trimmed, language)

  // Split ONLY on true sentence boundaries to preserve natural flow and vocal cadence
  const sentences = splitIntoSentences(normalized)
  if (sentences.length === 0) {
    throw new Error('Unable to extract valid sentences from text.')
  }

  const audioBuffers: Float32Array[] = []
  let sampleRate = 16000

  // Synthesize each sentence and trim dead silence
  for (let i = 0; i < sentences.length; i++) {
    const chunkPercent = Math.round(90 + ((i + 1) / sentences.length) * 8)
    onProgress?.({
      stage: `Synthesizing sentence ${i + 1} of ${sentences.length}...`,
      percent: chunkPercent,
      detail: `"${sentences[i].slice(0, 45)}${sentences[i].length > 45 ? '...' : ''}"`,
    })

    try {
      const out = await synthesizer(sentences[i])
      if (out?.audio && out.audio.length > 0) {
        if (out.sampling_rate) {
          sampleRate = out.sampling_rate
        }

        // Trim the model's excessive leading and trailing dead silence buffers
        const trimmedAudio = trimSilence(out.audio, sampleRate)
        audioBuffers.push(trimmedAudio)

        // Insert a natural, crisp 100ms inter-sentence breathing pause between distinct sentences
        if (i < sentences.length - 1) {
          const pauseSamples = Math.round(sampleRate * 0.1)
          audioBuffers.push(new Float32Array(pauseSamples))
        }
      }
    } catch (chunkErr: unknown) {
      const msg = chunkErr instanceof Error ? chunkErr.message : 'Error in speech sentence'
      throw new Error(`Neural synthesis failed on sentence ${i + 1}: ${msg}`)
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error('No audio output was generated by the neural model.')
  }

  // Calculate total sample count
  let totalLength = 0
  for (const buf of audioBuffers) {
    totalLength += buf.length
  }

  // Concatenate all trimmed sentence buffers seamlessly into a single contiguous waveform
  const mergedSamples = new Float32Array(totalLength)
  let offset = 0
  for (const buf of audioBuffers) {
    mergedSamples.set(buf, offset)
    offset += buf.length
  }

  onProgress?.({
    stage: 'Encoding uncompressed 16-bit PCM WAV audio file...',
    percent: 99,
  })

  // Encode to standard 16-bit PCM RIFF WAV Blob
  const blob = encodeWavBlob(mergedSamples, sampleRate)
  const url = URL.createObjectURL(blob)
  const timestamp = Date.now()
  const filename = `smarttools-neural-${language}-${timestamp}.wav`
  const durationSeconds = mergedSamples.length / sampleRate

  onProgress?.({
    stage: 'Audio generation complete!',
    percent: 100,
  })

  return {
    blob,
    url,
    filename,
    durationSeconds,
    sizeBytes: blob.size,
    sampleRate,
    language,
  }
}
