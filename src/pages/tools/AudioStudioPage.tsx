import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { AudioStudio } from '../../tools/AudioStudio/AudioStudio'
import { ALL_TOOLS } from '../../data/toolsData'

export const AudioStudioPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'audio-studio') || {
    id: 'audio-studio',
    name: 'Audio Studio & Effects Cleaner',
    slug: 'audio-studio',
    path: '/tools/audio-studio',
    description: 'Adjust playback speed, boost volume gain, eliminate microphone room hum with 120Hz low-cut filters, and master 16-bit WAV audio in your browser.',
    categoryId: 'creator-tools',
    categoryIds: ['creator-tools', 'education'],
    categoryName: 'Creator Tools',
    icon: 'SlidersHorizontal',
    isPopular: true,
    isFunctional: true,
    keywords: ['audio studio', 'audio effects', 'volume booster', 'audio speed changer', 'mic hum cleaner', 'wav exporter', 'web audio cleaner'],
  }

  const howToUseSteps = [
    'Upload your audio recording (MP3, WAV, M4A, OGG) or record your voice live using the "Start Recording" microphone button.',
    'Play and preview your audio using the interactive player and animated frequency waveform.',
    'Adjust the playback speed and tempo slider from 0.5x (slow) up to 2.0x (fast).',
    'Boost quiet audio recordings up to 250% using the Volume / Gain Booster slider.',
    'Apply audio cleaning presets such as "Voice De-Hum" (120Hz high-pass filter) to eliminate room rumblings and microphone desk thumps.',
    'Test specialized vocal tones like "Bass Warmth", "Treble Air Clarity", or vintage "Radio / Walkie" effects.',
    'Click "Export & Download Master WAV" to render and save a studio-grade 16-bit PCM WAV file directly to your computer or phone.',
  ]

  const formulas = [
    {
      title: 'Web Audio API Realtime Graph',
      formula: 'AudioBufferSourceNode → BiquadFilterNode (EQ) → GainNode (Volume) → AudioDestinationNode',
      explanation:
        'All audio manipulation runs natively in hardware-accelerated Web Audio on your browser with zero latency and zero server uploads.',
    },
    {
      title: 'Vocal De-Humming High-Pass Filter',
      formula: 'H(s) = s² / (s² + (ω₀/Q)s + ω₀²), Cutoff = 120 Hz, Q = 0.707',
      explanation:
        'Removes subsonic HVAC rumble, microphone wind blasts, and desk vibrations without altering spoken vocal warmth or intelligibility.',
    },
    {
      title: 'Gain Scaling & Normalization',
      formula: 'V_out = V_in × GainMultiplier (0.1× to 2.5×, +8 dB Boost)',
      explanation:
        'Amplifies low-volume podcast or smartphone voice recordings to commercial broadcast levels.',
    },
    {
      title: '16-bit PCM RIFF WAV Encoding',
      formula: 'RIFF WAVE [fmt chunk: 16-bit Linear PCM, 44.1/48kHz] + [data chunk: Int16 Samples]',
      explanation:
        'Exports uncompressed, lossless broadcast WAV files compatible with all video editors, DAWs, YouTube, and podcast hosts.',
    },
  ]

  const examples = [
    {
      title: 'Cleaning Microphone Recordings for Podcasts',
      description: 'Removing low frequency AC room hum and desk handling noise from voiceovers.',
      input: 'Voiceover clip with background computer fan or AC hum',
      output: 'Crystal clear voice recording with 120Hz high-pass de-humming applied',
    },
    {
      title: 'Boosting Quiet Phone Audio',
      description: 'Amplifying student lecture recordings or phone interview audio files.',
      input: 'Low volume voice note recorded from across a room',
      output: '200% amplified loud, intelligible WAV recording',
    },
    {
      title: 'Speeding Up Audio Lectures for Quick Review',
      description: 'Playing and mastering lectures or audiobooks at 1.25x or 1.5x speed.',
      input: '60-minute educational audio lecture',
      output: 'Clean, accelerated audio file saving 20 minutes of study time',
    },
  ]

  const faqs = [
    {
      question: 'Is my audio uploaded to any server or cloud service?',
      answer:
        'No. 100% of the audio processing, equalization, filtering, and WAV encoding occurs locally inside your web browser using HTML5 Web Audio. Your private recordings never leave your device.',
    },
    {
      question: 'What audio file formats are supported for upload?',
      answer:
        'You can upload MP3, WAV, M4A, AAC, OGG, WebM, and FLAC audio files up to 100 MB.',
    },
    {
      question: 'What does the Voice De-Hum preset do?',
      answer:
        'It applies a sharp 120Hz high-pass filter that cuts off low-frequency ambient rumble, AC electrical hum, and desk thumping while keeping human speech crisp and natural.',
    },
    {
      question: 'Can I export the processed audio file for free?',
      answer:
        'Yes. You can click "Export & Download Master WAV" as many times as you like with zero subscriptions, fees, or watermarks.',
    },
  ]

  const relatedSlugs = ['text-to-speech', 'video-prompt-generator', 'word-counter']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free Online Audio Studio & Effects Cleaner — De-Hum, Boost Gain & Speed Changer"
      seoDescription="Free browser-based audio studio. Boost volume gain, adjust tempo speed, clean microphone room hum with 120Hz low-cut filters, and download 16-bit WAV files."
      keywords="audio studio online, clean audio room hum, volume booster online, audio speed changer, free audio editor wav, mic noise filter, creator audio tools"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <AudioStudio />
    </ToolPageLayout>
  )
}
