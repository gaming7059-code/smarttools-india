import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { VideoPromptGenerator } from '../../tools/VideoPromptGenerator/VideoPromptGenerator'
import { ALL_TOOLS } from '../../data/toolsData'

export const VideoPromptGeneratorPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'video-prompt-generator') || {
    id: 'video-prompt-generator',
    name: 'AI Video Prompt Generator',
    slug: 'video-prompt-generator',
    path: '/tools/video-prompt-generator',
    description: 'Reverse engineer and construct director-level cinematographic video prompts for OpenAI Sora, Runway Gen-3, Kling AI, and Midjourney.',
    categoryId: 'creator-tools',
    categoryIds: ['creator-tools', 'seo-tools', 'education'],
    categoryName: 'Creator Tools',
    icon: 'Clapperboard',
    isPopular: true,
    isFunctional: true,
    keywords: ['ai video prompt', 'sora prompt generator', 'runway gen 3 prompt', 'kling ai prompt', 'cinematography prompt', 'midjourney video prompt'],
  }

  const howToUseSteps = [
    'Define your main Subject or Character (e.g. A cybernetic explorer, a royal Bengal tiger, a luxury watch).',
    'Describe the Core Action or Behavior happening in the shot.',
    'Set the Environment and Background Atmosphere (e.g. Sundarbans dawn mist, neon cyberpunk alleyway).',
    'Choose a Camera Movement preset (such as Drone Aerial, Steadicam Tracking, Dolly Zoom, or 360 Orbit).',
    'Select Lighting and Mood aesthetics (Golden hour, Cyberpunk neon, Diffused overcast, Chiaroscuro).',
    'Select your Target AI model: OpenAI Sora, Runway Gen-3, Kling AI, or Midjourney v6.',
    'Pick your desired Aspect Ratio (16:9 for YouTube/TV, 9:16 for Reels/Shorts/TikTok, 2.39:1 for Anamorphic film).',
    'Click "Copy Prompt" and paste directly into your favorite AI video generation tool.',
  ]

  const formulas = [
    {
      title: 'Cinematographic Shot Breakdown',
      formula: 'Prompt = [Subject + Action] + [Setting/Environment] + [Camera Motion] + [Lighting Mood] + [Film Aesthetic & Specs]',
      explanation:
        'AI video models like Sora and Runway generate dramatically higher temporal coherence when prompts follow traditional movie director cue structures.',
    },
    {
      title: 'Camera Motion Vector Prompting',
      formula: 'Camera Vector = Direction (Dolly / Boom / Orbit) + Speed (Slow / Fast) + Framing (Macro / Wide / POV)',
      explanation:
        'Directing camera speed and angle prevents erratic AI camera shakes and enforces intentional visual storytelling.',
    },
    {
      title: 'Aspect Ratio & Resolution Matrix',
      formula: '16:9 (1920×1080 / 3840×2160) | 9:16 (1080×1920) | 2.39:1 (Cinemascope)',
      explanation:
        'Standardized technical flags (--ar 16:9, --ar 9:16) optimize composition and prevent black padding letterboxing.',
    },
    {
      title: 'Negative Prompt Filtering',
      formula: 'Negative = Artifacts + Anatomical Deformities + Jerky Motion + Watermarks',
      explanation:
        'Suppresses common neural video generation flaws such as extra limbs, unnatural morphing, and synthetic plastic textures.',
    },
  ]

  const examples = [
    {
      title: 'Cinematic Wildlife Documentary',
      description: 'Creating National Geographic style footage of endangered animals in high dynamic range.',
      input: 'Bengal Tiger + Mangrove Forest + Golden Hour Sunlight + Low Angle Tracking',
      output: 'Photorealistic master shot with authentic fur physics and water reflections',
    },
    {
      title: 'Viral Social Media Commercial Reel',
      description: 'Generating vertical 9:16 product advertisements for luxury brands.',
      input: 'Titanium Smartwatch + Zero Gravity + 360 Turntable Orbit + Studio Softbox Lighting',
      output: 'High-impact commercial video ready for Instagram Reels and YouTube Shorts',
    },
    {
      title: 'Sci-Fi Cyberpunk Action Film',
      description: 'Directing futuristic night cityscapes with anamorphic lens flares.',
      input: 'Hover-bike Courier + Neon Skyscrapers + High-Speed Drone Chase + Blade Runner Mood',
      output: 'Cinematic 2.39:1 wide composition with wet reflective pavement highlights',
    },
  ]

  const faqs = [
    {
      question: 'Which AI video generators are supported by this tool?',
      answer:
        'This tool generates optimized, tailored prompts for OpenAI Sora, Runway Gen-3 Alpha, Kling AI, Luma Dream Machine, Pika, Hailuo Minimax, and Midjourney v6/v7.',
    },
    {
      question: 'Do I need an API key or account to use this prompt generator?',
      answer:
        'No. This prompt engineering tool is 100% free and client-side. You do not need an account, login, or API key. The generated prompt can be copied and used anywhere.',
    },
    {
      question: 'Why should I include camera movement in my prompt?',
      answer:
        'Specifying precise camera motions like "Dolly push-in" or "Steadicam tracking" stops the AI video engine from guessing camera angles and avoids random, disorienting camera movements.',
    },
    {
      question: 'What is a negative prompt in AI video generation?',
      answer:
        'A negative prompt tells the AI what to exclude from the generated video, such as morphing glitches, distorted faces, unrealistic anatomy, or watermarks.',
    },
  ]

  const relatedSlugs = ['text-to-speech', 'word-counter', 'pdf-editor']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free AI Video Prompt Generator — Sora, Runway Gen-3 & Kling Director Studio"
      seoDescription="Generate director-level cinematographic video prompts for OpenAI Sora, Runway Gen-3, Kling AI, and Midjourney. Includes camera motion, lighting, and aspect ratios."
      keywords="ai video prompt generator, sora prompt generator, runway gen 3 prompt, kling ai prompt, video prompt reverse engineering, cinematography prompt maker, creator tools"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <VideoPromptGenerator />
    </ToolPageLayout>
  )
}
