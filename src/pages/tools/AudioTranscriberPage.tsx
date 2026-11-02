import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { AudioTranscriber } from '../../tools/AudioTranscriber/AudioTranscriber'
import { ALL_TOOLS } from '../../data/toolsData'

export const AudioTranscriberPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'audio-transcriber') || {
    id: 'audio-transcriber',
    name: 'Audio & Speech Transcriber',
    slug: 'audio-transcriber',
    path: '/tools/audio-transcriber',
    description: 'Transcribe speech to text in real time with microphone dictation, slow down audio files for easy manual transcription, and export TXT or SRT subtitles.',
    categoryId: 'creator-tools',
    categoryIds: ['creator-tools', 'seo-tools', 'education'],
    categoryName: 'Creator Tools',
    icon: 'Mic',
    isPopular: true,
    isFunctional: true,
    keywords: ['speech to text', 'audio transcriber', 'voice dictation', 'transcribe audio online', 'hindi speech to text', 'srt subtitle generator', 'voice notes'],
  }

  const howToUseSteps = [
    'Choose your dictation language from the dropdown (such as English India, Hindi, Bengali, or Urdu).',
    'Click the microphone button to start live voice dictation. Speak clearly into your computer or phone microphone.',
    'Watch your spoken words convert to editable text in real time with continuous recognition.',
    'To transcribe an existing audio recording, click "Upload Audio File" to load the slow-down player.',
    'Use the 0.5x or 0.75x speed buttons and the "Insert Timestamp" feature to easily annotate audio timestamps.',
    'Edit or add notes directly in the transcription output box.',
    'Export your transcript as plain text (.TXT), SubRip subtitles (.SRT), or click "Send to Text to Speech Tool" to re-synthesize the voice.',
  ]

  const formulas = [
    {
      title: 'HTML5 Web Speech Recognition API',
      formula: 'window.SpeechRecognition || window.webkitSpeechRecognition, Continuous = true',
      explanation:
        'Uses your operating system and browser speech engine to transcribe spoken acoustic signals into written text locally without requiring third-party cloud services or API keys.',
    },
    {
      title: 'SubRip Subtitle (.SRT) Time Sequencing',
      formula: 'Index Number \\n [HH:MM:SS,000] --> [HH:MM:SS,000] \\n Subtitle Text',
      explanation:
        'Formats line-by-line spoken transcripts into standard timed subtitle format compatible with YouTube, Premiere Pro, DaVinci Resolve, and VLC media player.',
    },
    {
      title: 'Real-time Word & Character Metrics',
      formula: 'Words = Text.trim().split(/\\s+/).length, Characters = Text.length',
      explanation:
        'Instantly counts words and characters as you dictate to help meet length limits for video scripts, articles, and student essays.',
    },
  ]

  const examples = [
    {
      title: 'Live Voice Dictation for Articles & Emails',
      description: 'Dictating thoughts verbally instead of typing on a keyboard.',
      input: 'Spoken English or Hindi voice dictation via microphone',
      output: 'Accurately transcribed text paragraphs ready to copy',
    },
    {
      title: 'Generating Subtitles for YouTube & Reels',
      description: 'Creating .SRT subtitle files for videos.',
      input: 'Voiceover transcript lines',
      output: 'Properly formatted SubRip (.SRT) subtitle file',
    },
    {
      title: 'Audio Lecture Transcription for Students',
      description: 'Slowing down recorded college lectures to 0.75x for easy study note creation.',
      input: 'Recorded audio file from class lecture',
      output: 'Formatted transcript with [MM:SS] timestamps for key exam topics',
    },
  ]

  const faqs = [
    {
      question: 'Which languages are supported for live speech dictation?',
      answer:
        'Live speech recognition supports English (India, US, UK), Hindi (हिंदी), Bengali (বাংলা), and Urdu (اردو), depending on your browser and operating system voice packs.',
    },
    {
      question: 'Is my microphone audio sent to external marketing servers?',
      answer:
        'No. Speech recognition is processed natively by your browser interface. SmartTools India never records, stores, or sells your private voice conversations.',
    },
    {
      question: 'Can I generate subtitles for my videos?',
      answer:
        'Yes. Once you have transcribed your text, click "Download .SRT Subtitles" to export an industry-standard subtitle file ready to upload to YouTube or video editing software.',
    },
    {
      question: 'Does this tool work on mobile devices?',
      answer:
        'Yes. You can use this on Android (Google Chrome) and iOS (Safari) to dictate voice notes directly from your smartphone microphone.',
    },
  ]

  const relatedSlugs = ['text-to-speech', 'word-counter', 'video-prompt-generator']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free Audio & Speech Transcriber — Live Voice Dictation & SRT Subtitle Generator"
      seoDescription="Transcribe speech to text in real time with microphone dictation. Supports English, Hindi, Bengali, and Urdu. Slow down audio files and export TXT or SRT subtitles."
      keywords="speech to text free, audio transcriber online, voice dictation hindi, bengali speech to text, srt subtitle generator, transcribe voice to text, creator tools"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <AudioTranscriber />
    </ToolPageLayout>
  )
}
