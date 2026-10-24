import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { TextToSpeech } from '../../tools/TextToSpeech/TextToSpeech'
import { ALL_TOOLS } from '../../data/toolsData'

export const TextToSpeechPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'text-to-speech')!

  const howToUseSteps = [
    'Type or paste your text into the large workspace input area (supports up to 5,000 characters).',
    'Choose your preferred language from the filter dropdown (such as English India, Hindi, Bengali, or US English).',
    'Select a specific voice from the available system voices installed on your device or browser.',
    'Fine-tune the speech speed (0.5x to 2x), pitch (low, normal, high), and volume using the sliders.',
    'Click the large "Play Speech" button to listen with native device voices. You can pause, resume, or stop speech playback anytime.',
    'Click "Download Audio" to synthesize and save a real 16-bit PCM WAV audio file with your chosen speed, pitch, and volume directly to your device.',
    'Use the "Copy" or "Clear" buttons to manage your text, or try the quick sample buttons to test different languages.',
  ]

  const formulas = [
    {
      title: 'Browser-Native Web Speech API',
      formula: 'window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))',
      explanation:
        'Converts written text to spoken audio 100% locally on your computer or phone using your browser and operating system speech engine. No external server requests or API keys required.',
    },
    {
      title: 'Neural AI Waveform Generator (Meta MMS-TTS)',
      formula: 'Text → VITS Neural Acoustic Pipeline → 16-bit PCM WAV (16 kHz / audio/wav)',
      explanation:
        'Uses Meta’s open-source MMS-TTS VITS models running entirely in-browser on WebAssembly via Transformers.js. Synthesizes natural, human-like voice waveforms locally without uploading text to any server.',
    },
    {
      title: 'Fast Offline Synthesizer (Web Audio)',
      formula: 'OfflineAudioContext → Formant Resonators → 16-bit PCM RIFF WAV Blob (22.05 kHz)',
      explanation:
        'Instant, lightweight audio synthesizer requiring 0 MB downloads. Operates 100% offline on any low-end smartphone or computer.',
    },
    {
      title: 'Speed (Rate) Multiplier',
      formula: 'Playback Rate = 0.5x (Slow) to 2.0x (Fast), Default = 1.0x',
      explanation:
        'Controls the speaking cadence. Slower rates (0.75x) are ideal for language learning and pronunciation practice, while faster rates (1.25x - 1.5x) enable rapid document listening.',
    },
    {
      title: 'Intelligent Sentence Chunking',
      formula: 'Long Text → Natural Punctuation Splits (<200 chars) → Continuous Playback',
      explanation:
        'Overcomes browser 15-second speech synthesis cut-offs by intelligently splitting long paragraphs at natural punctuation boundaries without breaking words mid-sentence.',
    },
    {
      title: 'Pitch Modulation',
      formula: 'Pitch Range = 0.5 (Deeper Tone) to 2.0 (Higher Tone), Default = 1.0',
      explanation:
        'Adjusts the acoustic frequency of the speech synthesizer to create a lower or higher vocal tone suited to your listening preference.',
    },
  ]

  const examples = [
    {
      title: 'Proofreading Articles & Essays',
      description: 'Listening to written work aloud to catch awkward phrasing, typos, and sentence rhythm.',
      input: 'A draft email or blog post',
      output: 'Spoken audio revealing punctuation and flow issues',
    },
    {
      title: 'Language Pronunciation Practice',
      description: 'Practicing English (India), Hindi, or regional phrases with accurate native inflection.',
      input: 'नमस्ते! आप कैसे हैं? (Hindi greeting)',
      output: 'Clear native Hindi audio pronunciation',
    },
    {
      title: 'Hands-Free Reading & Accessibility',
      description: 'Having long articles, study notes, or recipes read aloud while resting your eyes or multitasking.',
      input: 'Multi-paragraph study summary',
      output: 'Continuous spoken narration with pause and resume controls',
    },
  ]

  const faqs = [
    {
      question: 'Why do available voices differ across different devices?',
      answer:
        'The Web Speech API utilizes the speech synthesis voices installed on your device by the operating system (Windows, macOS, Android, iOS, ChromeOS) and browser. Google Chrome, Microsoft Edge, and Apple Safari each provide their own unique set of built-in voices.',
    },
    {
      question: 'Are Indian languages like Hindi and Bengali supported?',
      answer:
        'Yes! If your device or browser has voices for Indian English (en-IN), Hindi (hi-IN), Bengali (bn-IN), Tamil (ta-IN), Telugu (te-IN), or Marathi (mr-IN), they will automatically appear in the voice selector. Google Chrome and Microsoft Edge on Windows and Android offer several high-quality Indian voices.',
    },
    {
      question: 'Is my text private and secure?',
      answer:
        '100% private. All speech generation takes place completely inside your local web browser session. Your text is never transmitted across the internet, logged, or saved to any remote database.',
    },
    {
      question: 'Can I download the spoken speech as an audio file?',
      answer:
        'Yes! SmartTools India provides two client-side download engines: 1) Neural AI Voice (Meta MMS-TTS): generates natural, human-like English and Hindi speech directly on your device via WebAssembly, with a one-time ~38 MB model download cached permanently in your browser; 2) Fast Lightweight Synthesizer: produces instant offline audio with zero downloads. Both generate genuine, uncompressed 16-bit PCM WAV audio files.',
    },
    {
      question: 'Why is Bengali available for direct listening but not yet for neural WAV download?',
      answer:
        'Meta’s open-source MMS-TTS release for Bengali currently lacks pre-compiled browser-compatible ONNX tokenizers required by JavaScript runtimes. Rather than providing broken or synthetic fake downloads, SmartTools India supports Bengali for instant, crystal-clear playback using your device’s native browser speech engine (Play Speech), while neural WAV export is currently supported for verified English and Hindi models.',
    },
    {
      question: 'What is the license for the neural voice models?',
      answer:
        'The neural voice models are Meta’s open-source Massively Multilingual Speech (MMS) checkpoints licensed under CC-BY-NC 4.0 (Creative Commons Non-Commercial). They are completely free for personal, educational, non-profit, and evaluation use.',
    },
    {
      question: 'What audio format is generated for download?',
      answer:
        'The audio is downloaded as a standard 16-bit linear PCM WAV file (.wav, 16 kHz or 22.05 kHz mono) with a standard RIFF header. This uncompressed audio format is universally compatible with Windows, macOS, Linux, iOS, Android, and media editors like Audacity and Premiere.',
    },
    {
      question: 'What is the maximum text limit?',
      answer:
        'You can enter up to 5,000 characters per conversion. Our intelligent sentence chunker automatically splits long articles into continuous, natural segments so playback never freezes mid-sentence.',
    },
  ]

  const relatedSlugs = ['word-counter', 'pdf-editor', 'unit-converter', 'percentage-calculator']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free Text to Speech Converter & Audio Download | SmartTools India"
      seoDescription="Convert text into speech and download WAV audio. Choose language, voice, speed, pitch, and volume with this free, private online text-to-speech converter."
      keywords="free text to speech converter, text to speech audio download, download tts wav, text to speech online, read aloud, speech synthesis browser, hindi text to speech, indian english voice, smarttools india"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <TextToSpeech />
    </ToolPageLayout>
  )
}
