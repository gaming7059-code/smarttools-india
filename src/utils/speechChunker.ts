/**
 * Utility to split long text into natural speech chunks
 * to prevent browser SpeechSynthesis API timeouts (~15s Chrome limitation).
 */

export function chunkText(text: string, maxLength: number = 200): string[] {
  const clean = text.trim()
  if (!clean) return []
  if (clean.length <= maxLength) return [clean]

  const chunks: string[] = []
  // Split on sentence boundaries (period, exclamation, question mark, newline)
  const sentenceRegex = /([^.!?\n]+[.!?\n]+|[^.!?\n]+$)/g
  const sentences = clean.match(sentenceRegex) || [clean]

  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    // If an individual sentence is longer than maxLength, split by clauses or words
    if (trimmed.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }
      const words = trimmed.split(/\s+/)
      let subChunk = ''
      for (const word of words) {
        if ((subChunk + ' ' + word).trim().length > maxLength) {
          if (subChunk) chunks.push(subChunk.trim())
          subChunk = word
        } else {
          subChunk = subChunk ? `${subChunk} ${word}` : word
        }
      }
      if (subChunk.trim()) {
        chunks.push(subChunk.trim())
      }
    } else {
      if ((currentChunk + ' ' + trimmed).trim().length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = trimmed
      } else {
        currentChunk = currentChunk ? `${currentChunk} ${trimmed}` : trimmed
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
