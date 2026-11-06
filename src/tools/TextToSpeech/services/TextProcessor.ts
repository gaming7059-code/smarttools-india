/**
 * Text Processor Service
 *
 * Provides sentence boundary chunking, natural pause calculation,
 * abbreviation protection, and acoustic phonetic normalization.
 */

export {
  createIntelligentSpeechChunks,
  normalizeAcousticText,
  chunkText,
  type SpeechChunk,
} from '../../../utils/speechChunker'
