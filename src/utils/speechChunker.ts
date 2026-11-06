/**
 * Intelligent Speech Chunker & Natural Prosody Processor
 *
 * Breaks text into natural sentence-based speech units with human-like breathing pauses.
 * - Respects sentence boundaries across English, Hindi, Bengali, and Urdu.
 * - Protects abbreviations (Dr., Mr., Rs., etc.) and decimal numbers from awkward mid-sentence breaks.
 * - Prevents Chromium/Safari Web Speech API speech queue freezes (~15-second timeout bug).
 * - Preserves paragraph structure and inserts natural pauses between sentences and clauses.
 */

export interface SpeechChunk {
  /** The original text of the sentence/clause */
  text: string
  /** Normalized acoustic text for speech synthesis (phonetic symbol expansions) */
  cleanText: string
  /** Natural pause duration to insert after this chunk (in milliseconds) */
  pauseAfterMs: number
  /** Whether this chunk marks the conclusion of a paragraph */
  isParagraphEnd: boolean
  /** 0-based chunk sequence index */
  index: number
}

// Common abbreviations across English and Indian contexts
const PROTECTED_ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie',
  'rs', 'shri', 'smt', 'approx', 'min', 'sec', 'hr', 'no', 'vol', 'st',
  'dept', 'est', 'capt', 'lt', 'col', 'gen', 'rep', 'sen', 'gov'
])

/**
 * Expands currency and math symbols into natural spoken phonetics
 * without modifying user-facing text in the textarea.
 */
export function normalizeAcousticText(text: string): string {
  return text
    .replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 rupees')
    .replace(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 dollars')
    .replace(/€\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 euros')
    .replace(/£\s*(\d+(?:,\d+)*(?:\.\d+)?)/g, '$1 pounds')
    .replace(/(\d+)%/g, '$1 percent')
    .replace(/\b&\b/g, ' and ')
    .replace(/\b@\b/g, ' at ')
    .replace(/\b#(\d+)\b/g, ' number $1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Splits text into intelligent sentence-based speech chunks.
 *
 * @param text The input text to chunk
 * @param maxChunkLength Target character limit per utterance (default: 175)
 */
export function createIntelligentSpeechChunks(
  text: string,
  maxChunkLength: number = 175
): SpeechChunk[] {
  const clean = text.trim()
  if (!clean) return []

  const placeholder = '___DOT___'
  let safe = clean

  // 1. Protect decimal numbers (e.g. 3.14, Rs. 500.50, 99.9%)
  safe = safe.replace(/(\d)\.(\d)/g, `$1${placeholder}$2`)

  // 2. Protect abbreviations (e.g. Dr. Sharma, Rs. 100, Mr. Roy, e.g. text)
  safe = safe.replace(/\b([a-zA-Z]{1,6})\.(?=\s+[a-zA-Z0-9\u0900-\u097F\u0980-\u09FF\u0600-\u06FF])/gi, (match, prefix) => {
    if (PROTECTED_ABBREVIATIONS.has(prefix.toLowerCase())) {
      return `${prefix}${placeholder}`
    }
    return match
  })

  // 3. Protect ellipses (... or …)
  safe = safe.replace(/\.{3}/g, `..${placeholder}`)

  // 4. Split into paragraphs
  const rawParagraphs = safe.split(/\n+/)
  const chunks: SpeechChunk[] = []
  let chunkCount = 0

  for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
    const para = rawParagraphs[pIdx].trim()
    if (!para) continue

    const isLastParagraph = pIdx === rawParagraphs.length - 1

    // Split paragraph by full-stop terminators across:
    // - English / Latin: . ! ?
    // - Hindi / Devanagari: । (U+0964) ॥ (U+0965)
    // - Bengali: । (U+0964)
    // - Urdu / Arabic: ۔ (U+06D4) ؟ (U+061F) !
    const sentenceRegex = /[^.!?।॥۔؟]+(?:[.!?।॥۔؟]+(?:["'”’)\]}]*)|$)/gu
    const rawSentences = para.match(sentenceRegex) || [para]

    for (let sIdx = 0; sIdx < rawSentences.length; sIdx++) {
      const rawSent = rawSentences[sIdx].trim()
      if (!rawSent) continue

      const isLastSentenceInPara = sIdx === rawSentences.length - 1
      const restored = rawSent.split(placeholder).join('.')

      if (restored.length <= maxChunkLength) {
        chunks.push({
          text: restored,
          cleanText: normalizeAcousticText(restored),
          pauseAfterMs: isLastSentenceInPara ? (isLastParagraph ? 0 : 250) : 130,
          isParagraphEnd: isLastSentenceInPara,
          index: chunkCount++
        })
      } else {
        // Sentence exceeds maxChunkLength: split gracefully at clause boundaries
        // (commas, semicolons, colons, em-dashes, or conjunctions)
        const clauseParts = restored
          .split(/([,;:\u2014\u2013\u060C]|\s{2,})/)
          .filter(Boolean)

        let accumulated = ''

        for (let cIdx = 0; cIdx < clauseParts.length; cIdx++) {
          const part = clauseParts[cIdx]
          if ((accumulated + part).trim().length > maxChunkLength && accumulated.trim().length > 0) {
            chunks.push({
              text: accumulated.trim(),
              cleanText: normalizeAcousticText(accumulated.trim()),
              pauseAfterMs: 75,
              isParagraphEnd: false,
              index: chunkCount++
            })
            accumulated = part
          } else {
            accumulated += part
          }
        }

        if (accumulated.trim().length > 0) {
          chunks.push({
            text: accumulated.trim(),
            cleanText: normalizeAcousticText(accumulated.trim()),
            pauseAfterMs: isLastSentenceInPara ? (isLastParagraph ? 0 : 250) : 130,
            isParagraphEnd: isLastSentenceInPara,
            index: chunkCount++
          })
        }
      }
    }
  }

  return chunks
}

/**
 * Backward-compatible helper returning simple string chunks.
 */
export function chunkText(text: string, maxLength: number = 180): string[] {
  const speechChunks = createIntelligentSpeechChunks(text, maxLength)
  return speechChunks.map((c) => c.text)
}
