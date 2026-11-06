/**
 * Language & Voice Intelligence Utility
 *
 * Detects input scripts (English, Hindi, Bengali, Urdu, etc.),
 * categorizes browser voices by quality (Natural Online vs. System),
 * and matches user text to the most authentic voice available.
 */

export interface DetectedLanguage {
  code: string // 'en' | 'hi' | 'bn' | 'ur' | 'ta' | 'te' | 'mr' | 'other'
  name: string
  nativeName: string
  scriptName: string
  isRtl: boolean
  confidence: number // 0 to 100
}

export type VoiceQualityTier = 'natural' | 'cloud' | 'enhanced' | 'system'

export interface EnhancedVoiceInfo {
  voice: SpeechSynthesisVoice
  tier: VoiceQualityTier
  tierLabel: string
  provider: 'Microsoft' | 'Google' | 'Apple' | 'System'
  isHighQuality: boolean
  score: number
  displayName: string
  nativePreviewText: string
}

// Native preview phrases designed for natural vocal inflection
export const NATIVE_PREVIEWS: Record<string, string> = {
  hi: 'नमस्ते! स्मार्टटूल्स इंडिया में आपका स्वागत है।',
  bn: 'নমস্কার! স্মার্টটুলস ইন্ডিয়াতে আপনাকে স্বাগতম।',
  ur: 'ہیلو! اسمارٹ ٹولز انڈیا میں خوش آمدید۔',
  'en-in': 'Hello! Welcome to SmartTools India, your everyday utilities platform.',
  en: 'Hello! This is a preview of my natural voice.',
  ta: 'வணக்கம்! ஸ்மார்ட்டூல்ஸ் இந்தியாவுக்கு வரவேற்கிறோம்.',
  te: 'నమస్కారం! స్మార్ట్ టూల్స్ ఇండియాకు స్వాగతం.',
  mr: 'नमस्कार! स्मार्टटूल्स इंडिया मध्ये आपले स्वागत आहे.',
  gu: 'નમસ્તે! સ્માર્ટટૂલ્સ ઇન્ડિયામાં આપનું સ્વાગત છે.',
}

/**
 * Analyzes text to detect primary language and script.
 */
export function detectLanguageFromText(text: string): DetectedLanguage | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Unicode script match counts
  const devanagariCount = (trimmed.match(/[\u0900-\u097F]/g) || []).length
  const bengaliCount = (trimmed.match(/[\u0980-\u09FF]/g) || []).length
  const urduCount = (trimmed.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length
  const tamilCount = (trimmed.match(/[\u0B80-\u0BFF]/g) || []).length
  const teluguCount = (trimmed.match(/[\u0C00-\u0C7F]/g) || []).length
  const latinCount = (trimmed.match(/[a-zA-Z]/g) || []).length

  const totalLetters = devanagariCount + bengaliCount + urduCount + tamilCount + teluguCount + latinCount
  if (totalLetters === 0) return null

  if (devanagariCount > totalLetters * 0.2) {
    return {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिंदी',
      scriptName: 'Devanagari',
      isRtl: false,
      confidence: Math.round((devanagariCount / totalLetters) * 100),
    }
  }

  if (bengaliCount > totalLetters * 0.2) {
    return {
      code: 'bn',
      name: 'Bengali',
      nativeName: 'বাংলা',
      scriptName: 'Bengali-Assamese',
      isRtl: false,
      confidence: Math.round((bengaliCount / totalLetters) * 100),
    }
  }

  if (urduCount > totalLetters * 0.2) {
    return {
      code: 'ur',
      name: 'Urdu',
      nativeName: 'اردو',
      scriptName: 'Perso-Arabic (Nastaliq)',
      isRtl: true,
      confidence: Math.round((urduCount / totalLetters) * 100),
    }
  }

  if (tamilCount > totalLetters * 0.2) {
    return {
      code: 'ta',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      scriptName: 'Tamil',
      isRtl: false,
      confidence: Math.round((tamilCount / totalLetters) * 100),
    }
  }

  if (teluguCount > totalLetters * 0.2) {
    return {
      code: 'te',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      scriptName: 'Telugu',
      isRtl: false,
      confidence: Math.round((teluguCount / totalLetters) * 100),
    }
  }

  return {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    scriptName: 'Latin',
    isRtl: false,
    confidence: Math.round((latinCount / totalLetters) * 100) || 95,
  }
}

/**
 * Categorizes a SpeechSynthesisVoice by quality and vendor source.
 */
export function categorizeVoice(v: SpeechSynthesisVoice): EnhancedVoiceInfo {
  const name = v.name
  const lowerName = name.toLowerCase()
  const lowerLang = v.lang.toLowerCase()

  let tier: VoiceQualityTier = 'system'
  let tierLabel = 'Device System'
  let provider: 'Microsoft' | 'Google' | 'Apple' | 'System' = 'System'
  let score = 10

  if (lowerName.includes('microsoft')) {
    provider = 'Microsoft'
    if (lowerName.includes('natural') || lowerName.includes('online')) {
      tier = 'natural'
      tierLabel = 'Natural Online'
      score = 95
    } else {
      score = 40
    }
  } else if (lowerName.includes('google') || v.localService === false) {
    provider = 'Google'
    tier = 'cloud'
    tierLabel = 'Browser Cloud'
    score = 85
  } else if (lowerName.includes('apple') || lowerName.includes('siri') || lowerName.includes('enhanced')) {
    provider = 'Apple'
    tier = 'enhanced'
    tierLabel = 'Device Enhanced'
    score = 80
  }

  // Regional priority boosts
  if (lowerLang.startsWith('en-in') || lowerLang.startsWith('hi')) {
    score += 5
  }

  // Get preview text
  let nativePreviewText = NATIVE_PREVIEWS.en
  if (lowerLang.startsWith('hi')) nativePreviewText = NATIVE_PREVIEWS.hi
  else if (lowerLang.startsWith('bn')) nativePreviewText = NATIVE_PREVIEWS.bn
  else if (lowerLang.startsWith('ur')) nativePreviewText = NATIVE_PREVIEWS.ur
  else if (lowerLang.startsWith('en-in')) nativePreviewText = NATIVE_PREVIEWS['en-in']
  else if (lowerLang.startsWith('ta')) nativePreviewText = NATIVE_PREVIEWS.ta
  else if (lowerLang.startsWith('te')) nativePreviewText = NATIVE_PREVIEWS.te
  else if (lowerLang.startsWith('mr')) nativePreviewText = NATIVE_PREVIEWS.mr

  // Clean, professional display name
  const cleanName = name
    .replace(/^Microsoft\s+/i, '')
    .replace(/^Google\s+/i, 'Google ')
    .replace(/\s*\(Natural\)/i, ' (Natural)')
    .replace(/\s*Online\s*/i, ' ')
    .trim()

  return {
    voice: v,
    tier,
    tierLabel,
    provider,
    isHighQuality: tier === 'natural' || tier === 'cloud' || tier === 'enhanced',
    score,
    displayName: cleanName,
    nativePreviewText,
  }
}

/**
 * Finds the highest quality matching voice for a given language code.
 */
export function findBestVoiceForLanguage(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null

  const candidates = voices.filter((v) => {
    const l = v.lang.toLowerCase()
    if (langCode === 'en') return l.startsWith('en')
    return l.startsWith(langCode.toLowerCase())
  })

  if (candidates.length === 0) return null

  // Score candidate voices
  const scored = candidates.map((v) => categorizeVoice(v))
  scored.sort((a, b) => b.score - a.score)

  return scored[0]?.voice || null
}

/**
 * Calculates estimated speech duration in seconds based on word count and speed rate.
 */
export function estimateSpeechDurationSeconds(
  text: string,
  rate: number = 1.0,
  langCode: string = 'en'
): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  if (words === 0) return 0

  // Words per minute: ~145 wpm for English, ~130 wpm for Indic/Urdu scripts
  const baseWpm = langCode === 'en' ? 145 : 130
  const adjustedWpm = baseWpm * Math.max(0.4, Math.min(2.5, rate))

  return Math.ceil((words / adjustedWpm) * 60)
}

/**
 * Formats seconds into clean human readable duration (e.g. "45s", "1m 20s").
 */
export function formatSpeechDuration(seconds: number): string {
  if (seconds <= 0) return '0s'
  if (seconds < 60) return `~${seconds}s`
  const mins = Math.floor(seconds / 60)
  const remSecs = seconds % 60
  return remSecs > 0 ? `~${mins}m ${remSecs}s` : `~${mins}m`
}
