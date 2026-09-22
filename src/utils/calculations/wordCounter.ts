/**
 * Pure Text Analytics Functions for Word Counter
 * Supports multi-line, unicode, paragraph, sentence, and reading-time metrics.
 */

export interface TextAnalytics {
  wordCount: number
  characterCount: number
  charactersWithoutSpaces: number
  sentenceCount: number
  paragraphCount: number
  lineCount: number
  readingTimeMinutes: number
  readingTimeText: string
  averageWordsPerSentence: number
}

export function analyzeText(text: string): TextAnalytics {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      characterCount: text ? text.length : 0,
      charactersWithoutSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      lineCount: text && text.length > 0 ? text.split('\n').length : 0,
      readingTimeMinutes: 0,
      readingTimeText: '0 min',
      averageWordsPerSentence: 0,
    }
  }

  // 1. Characters with spaces
  const characterCount = text.length

  // 2. Characters without spaces (removes \s whitespace, tabs, newlines)
  const charactersWithoutSpaces = text.replace(/\s+/g, '').length

  // 3. Word count (matches sequences of non-whitespace characters)
  // Splits by whitespace and filters out punctuation-only artifacts
  const rawWords = text.trim().split(/\s+/)
  const wordTokens = rawWords.filter((token) => token.length > 0)
  const wordCount = wordTokens.length

  // 4. Paragraph count: splits on double newline or consecutive line breaks
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  const paragraphCount = paragraphs.length > 0 ? paragraphs.length : 1

  // 5. Line count
  const lineCount = text.split('\n').length

  // 6. Sentence count: detects sentences ending with . ! ? or Indian danda (।)
  const sentences = text
    .split(/[.!?।]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  const sentenceCount = sentences.length > 0 ? sentences.length : (wordCount > 0 ? 1 : 0)

  // 7. Average words per sentence
  const averageWordsPerSentence =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0

  // 8. Reading time estimation (standard average adult reading speed: 200 words per minute)
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200))
  const readingTimeText =
    wordCount === 0
      ? '0 min'
      : readingTimeMinutes === 1
      ? '1 min'
      : `${readingTimeMinutes} mins`

  return {
    wordCount,
    characterCount,
    charactersWithoutSpaces,
    sentenceCount,
    paragraphCount,
    lineCount,
    readingTimeMinutes,
    readingTimeText,
    averageWordsPerSentence,
  }
}
