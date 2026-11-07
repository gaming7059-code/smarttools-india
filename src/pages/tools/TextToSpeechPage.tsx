import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { TextToSpeech } from '../../tools/TextToSpeech/TextToSpeech'
import { ALL_TOOLS } from '../../data/toolsData'

export const TextToSpeechPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'text-to-speech')!

  const howToUseSteps = [
    'Type or paste your text into the large workspace input area (supports up to 5,000 characters).',
    'Automatic script detection identifies English, Hindi, Bengali, or Urdu and suggests matching authentic voices.',
    'Choose your preferred voice engine: Companion 24kHz Studio Neural (localhost:8000), In-Browser ONNX, or Free Browser Voice.',
    'Click the "Preview" button next to the voice selector to hear an instant sample of any voice before playing.',
    'Fine-tune speech speed (0.5x to 2x), pitch (low, natural, high), volume, and vocal cadence presets.',
    'Click the large "Play Speech" button to listen with native natural voices. You can pause, resume, or stop speech playback anytime.',
    'Follow along with real-time sentence tracking and smooth progress visualization as each sentence is spoken.',
    'Click "Download Audio" to synthesize and save high-fidelity MP3 or WAV audio with your chosen speed, pitch, and volume directly to your device.',
  ]

  const formulas = [
    {
      title: 'Companion Neural Engine (24kHz Studio Quality)',
      formula: 'Text → Fast Neural Speech Pipeline (Localhost:8000) → 24kHz Studio Audio (MP3/WAV)',
      explanation:
        'High-fidelity neural synthesis companion service running on your local machine with zero API keys. Delivers authentic, human-like cadence for Bengali, Hindi, English, and Urdu with multiple male and female voices.',
    },
    {
      title: 'In-Browser Neural AI Waveform Generator (Meta MMS-TTS)',
      formula: 'Text → VITS Neural Acoustic Pipeline → 16-bit PCM WAV (16 kHz / audio/wav)',
      explanation:
        'Uses Meta’s open-source MMS-TTS VITS models running entirely in-browser on WebAssembly via Transformers.js. Synthesizes natural voice waveforms locally without uploading text to any server.',
    },
    {
      title: 'Browser-Native Web Speech API',
      formula: 'window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))',
      explanation:
        'Converts written text to spoken audio 100% locally on your computer or phone using your browser and operating system speech engine. Zero downloads required.',
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
      description: 'Practicing English (India), Hindi, Bengali, or Urdu phrases with accurate native inflection.',
      input: 'আজকের দিনটা খুব সুন্দর। (Bengali greeting)',
      output: 'Clear native Bengali audio pronunciation with natural cadence',
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
      question: 'What is the Companion Neural Engine and how do I use it?',
      answer:
        'The Companion Neural Engine is a lightweight local Python FastAPI service included in the website repository under `server/`. Running `run_tts.bat` on Windows gives you studio-quality 24kHz neural voices in Bengali, Hindi, English, and Urdu with zero external API keys and 100% private local execution.',
    },
    {
      question: 'Are Indian languages like Bengali, Hindi, and Urdu fully supported?',
      answer:
        'Yes! The Companion Engine offers authentic natural voices for Bengali (India & Bangladesh), Hindi, Indian English, and Urdu (India & Pakistan). In addition, on-device WebAssembly neural synthesis supports English and Hindi, and the Free Browser Voice supports all languages installed on your system.',
    },
    {
      question: 'Is my text private and secure?',
      answer:
        '100% private. All speech generation takes place either directly in your local web browser or via the local companion service binding strictly to localhost (127.0.0.1). Your text is never uploaded to any third-party cloud database or logged.',
    },
    {
      question: 'Can I download the spoken speech as an audio file?',
      answer:
        'Yes! You can download high-fidelity MP3 audio directly via the Companion Engine, or uncompressed 16-bit PCM WAV audio via the client-side In-Browser Neural engine.',
    },
    {
      question: 'What is the license for the neural voice models?',
      answer:
        'The in-browser models are Meta’s open-source MMS checkpoints licensed under CC-BY-NC 4.0. The Companion Engine uses high-quality neural voice synthesis via edge-tts. Both operate with zero mandatory API keys or paid subscriptions.',
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
      seoTitle="Free Neural Text to Speech Converter & Audio Download | SmartTools India"
      seoDescription="Convert text into natural neural speech and download MP3/WAV audio. High-fidelity Bengali, Hindi, English, and Urdu voices with speed, pitch, and volume controls."
      keywords="free text to speech converter, neural text to speech, bengali text to speech, hindi text to speech, urdu text to speech, download tts wav mp3, read aloud, speech synthesis browser, indian english voice, smarttools india"
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
