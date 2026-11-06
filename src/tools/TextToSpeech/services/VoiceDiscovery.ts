/**
 * Voice Discovery & Language Matching Service
 *
 * Provides language detection, voice metadata enrichment,
 * and intelligent voice recommendation for Indian and international scripts.
 */

export {
  detectLanguageFromText,
  categorizeVoice,
  findBestVoiceForLanguage,
  estimateSpeechDurationSeconds,
  formatSpeechDuration,
  NATIVE_PREVIEWS,
  type DetectedLanguage,
  type EnhancedVoiceInfo,
} from '../../../utils/languageDetector'
