import React, { useState } from 'react'
import {
  Clapperboard,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Camera,
  SunMedium,
  Layers,
  Wand2,
  Tv,
  Film,
  Compass
} from 'lucide-react'

export interface PromptConfig {
  subject: string
  action: string
  environment: string
  cameraMotion: string
  lighting: string
  visualStyle: string
  aspectRatio: string
  aiTarget: 'sora' | 'runway' | 'kling' | 'midjourney'
  fps: string
  resolution: string
}

export const VideoPromptGenerator: React.FC = () => {
  const [config, setConfig] = useState<PromptConfig>({
    subject: 'A majestic royal Bengal tiger',
    action: 'prowling stealthily through lush mangrove waterways',
    environment: 'Sundarbans delta forest during golden dawn mist',
    cameraMotion: 'Low-angle tracking shot moving parallel at ground level',
    lighting: 'Golden hour amber sunlight filtering through morning haze',
    visualStyle: 'Cinematic 35mm film grain, National Geographic documentary look, photorealistic 8K',
    aspectRatio: '16:9',
    aiTarget: 'sora',
    fps: '24fps',
    resolution: '4K',
  })

  const [copied, setCopied] = useState(false)
  const [copiedNegative, setCopiedNegative] = useState(false)

  // Generate composite prompt based on selected AI model
  const generatedPrompt = React.useMemo(() => {
    const { subject, action, environment, cameraMotion, lighting, visualStyle, aspectRatio, aiTarget, fps, resolution } = config

    const core = `${subject.trim()} ${action.trim()}`.trim()
    const env = environment.trim() ? `, set in ${environment.trim()}` : ''
    const cam = cameraMotion.trim() ? `. Camera: ${cameraMotion.trim()}` : ''
    const light = lighting.trim() ? `. Lighting: ${lighting.trim()}` : ''
    const style = visualStyle.trim() ? `. Style & Rendering: ${visualStyle.trim()}` : ''

    if (aiTarget === 'runway') {
      return `${core}${env}${cam}${light}${style} --ar ${aspectRatio} --fps ${fps.replace('fps', '')} --motion 5 --upscale ${resolution}`
    } else if (aiTarget === 'kling') {
      return `${core}${env}, ${cam}, ${light}, cinematic masterpiece, high dynamic range, ${resolution}, --ar ${aspectRatio}`
    } else if (aiTarget === 'midjourney') {
      return `/imagine prompt: ${core}${env}, ${cam}, ${light}, ${style}, hyperdetailed, cinematic composition --ar ${aspectRatio} --v 6.1 --style raw`
    }

    // Default for Sora / General AI Video
    return `Photorealistic cinematic video: ${core}${env}${cam}${light}${style}. Master shot, natural physics, fluid motion, authentic reflections, ${resolution} UHD, ${fps}, aspect ratio ${aspectRatio}.`
  }, [config])

  const negativePrompt = 'blurry, distorted faces, unrealistic limb anatomy, morphing artifacts, low resolution, watermark, jerky camera shake, overexposed, plastic texture, 3D video game graphics.'

  const handleCopy = (textToCopy: string, isNeg = false) => {
    navigator.clipboard.writeText(textToCopy)
    if (isNeg) {
      setCopiedNegative(true)
      setTimeout(() => setCopiedNegative(false), 2000)
    } else {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleApplyPreset = (presetName: 'tiger' | 'cyberpunk' | 'monsoon' | 'commercial' | 'space') => {
    if (presetName === 'tiger') {
      setConfig({
        subject: 'A majestic royal Bengal tiger',
        action: 'prowling stealthily through lush mangrove waterways',
        environment: 'Sundarbans delta forest during golden dawn mist',
        cameraMotion: 'Low-angle tracking shot moving parallel at ground level',
        lighting: 'Golden hour amber sunlight filtering through morning haze',
        visualStyle: 'Cinematic 35mm film grain, National Geographic documentary look, photorealistic 8K',
        aspectRatio: '16:9',
        aiTarget: 'sora',
        fps: '24fps',
        resolution: '4K',
      })
    } else if (presetName === 'cyberpunk') {
      setConfig({
        subject: 'A futuristic cybernetic courier wearing a reflective holographic jacket',
        action: 'navigating an electric hover-bike through towering neon skyscrapers in heavy rain',
        environment: 'Dystopian mega-city alleyways illuminated by giant Japanese and Hindi billboards',
        cameraMotion: 'High-speed drone chase diving from rooftops down into congested traffic',
        lighting: 'Volumetric neon magenta and cyan street glow reflecting on wet asphalt',
        visualStyle: 'Blade Runner 2049 aesthetic, anamorphic lens flares, shallow depth of field',
        aspectRatio: '2.39:1',
        aiTarget: 'runway',
        fps: '30fps',
        resolution: '4K',
      })
    } else if (presetName === 'monsoon') {
      setConfig({
        subject: 'An elderly artisan weaving handloom Banarasi silk on a traditional wooden loom',
        action: 'gently threading vibrant golden zari yarn with meticulous rhythmic movements',
        environment: 'An antique haveli workshop courtyard in Varanasi during soft monsoon rain',
        cameraMotion: 'Slow cinematic macro push-in focusing on weathered hands and intricate gold thread',
        lighting: 'Soft diffused natural window light with subtle dust motes floating in air',
        visualStyle: 'Warm earthy color grading, intimate documentary realism, 8K ultra fine detail',
        aspectRatio: '16:9',
        aiTarget: 'sora',
        fps: '24fps',
        resolution: '4K',
      })
    } else if (presetName === 'commercial') {
      setConfig({
        subject: 'A sleek matte-black titanium smartwatch with water droplets on the sapphire glass',
        action: 'rotating gracefully in zero gravity with magnetic straps clasping seamlessly',
        environment: 'Minimalist studio cyclorama with floating geometric glass prisms',
        cameraMotion: '360-degree orbital turntable sweep with dynamic focal rack',
        lighting: 'Ultra-clean commercial studio key light with sharp rim highlights',
        visualStyle: 'Apple product launch style, crisp hyper-detailed CGI realism, razor sharp focus',
        aspectRatio: '9:16',
        aiTarget: 'runway',
        fps: '60fps',
        resolution: '4K',
      })
    } else {
      setConfig({
        subject: 'A lone interstellar astronaut exploring a canyon of crystalline formations',
        action: 'walking towards a glowing ancient monolith emitting rhythmic bioluminescent pulses',
        environment: 'Alien desert planet under a sky with three orbiting ringed moons',
        cameraMotion: 'Wide panoramic boom up revealing the vast extraterrestrial horizon',
        lighting: 'Starlight ambiance paired with deep violet and emerald bioluminescence',
        visualStyle: 'Interstellar and Dune cinematic grandeur, IMAX 70mm composition',
        aspectRatio: '16:9',
        aiTarget: 'kling',
        fps: '24fps',
        resolution: '4K',
      })
    }
  }

  const handleReset = () => {
    handleApplyPreset('tiger')
  }

  return (
    <div className="space-y-8">
      {/* Workspace Header Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Video Prompt Generator
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  <Sparkles className="h-3 w-3" />
                  Sora • Runway • Kling
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Craft director-level cinematographic video prompts with camera motion, lighting, and aspect ratios
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('tiger')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              Wildlife
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('cyberpunk')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              Cyberpunk
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('monsoon')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              Handicraft
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('commercial')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-slate-600 dark:text-slate-300 font-medium"
            >
              Product Reel
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('space')}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-slate-600 dark:text-slate-300 font-medium hidden sm:inline-block"
            >
              Sci-Fi
            </button>
          </div>
        </div>

        {/* AI Engine Selector Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Target AI Generator:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full sm:w-auto">
            {[
              { id: 'sora' as const, label: 'OpenAI Sora' },
              { id: 'runway' as const, label: 'Runway Gen-3' },
              { id: 'kling' as const, label: 'Kling AI' },
              { id: 'midjourney' as const, label: 'Midjourney v6' },
            ].map((engine) => (
              <button
                key={engine.id}
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, aiTarget: engine.id }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  config.aiTarget === engine.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-purple-300'
                }`}
              >
                {engine.label}
              </button>
            ))}
          </div>
        </div>

        {/* Directing Parameters Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Subject & Character */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-subject" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Subject / Character / Protagonist
            </label>
            <input
              id="prompt-subject"
              type="text"
              value={config.subject}
              onChange={(e) => setConfig((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="e.g. A young robotic inventor in copper goggles"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Action & Movement */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-action" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              2. Core Action &amp; Behavior
            </label>
            <input
              id="prompt-action"
              type="text"
              value={config.action}
              onChange={(e) => setConfig((prev) => ({ ...prev, action: e.target.value }))}
              placeholder="e.g. adjusting a glowing crystal engine as sparks scatter"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Environment & Location */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-env" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              3. Setting &amp; Environment
            </label>
            <input
              id="prompt-env"
              type="text"
              value={config.environment}
              onChange={(e) => setConfig((prev) => ({ ...prev, environment: e.target.value }))}
              placeholder="e.g. A cluttered Victorian steampunk airship workshop over clouds"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Camera Motion */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-camera" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Camera className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                4. Camera Movement
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Cinematography angle</span>
            </label>
            <div className="flex gap-2">
              <input
                id="prompt-camera"
                type="text"
                value={config.cameraMotion}
                onChange={(e) => setConfig((prev) => ({ ...prev, cameraMotion: e.target.value }))}
                placeholder="e.g. Slow orbital 360 camera arc tracking the character"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <select
                aria-label="Preset Camera Motion"
                onChange={(e) => {
                  if (e.target.value) setConfig((prev) => ({ ...prev, cameraMotion: e.target.value }))
                }}
                className="w-28 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 text-slate-700 dark:text-slate-300"
              >
                <option value="">Presets...</option>
                <option value="Dolly push-in slow cinematic zoom">Dolly In</option>
                <option value="Drone high aerial establishing sweep">Drone Aerial</option>
                <option value="Steadicam tracking shot following behind">Steadicam</option>
                <option value="Low-angle heroic ground shot">Low Angle</option>
                <option value="Macro close-up with shallow depth of field">Macro Focus</option>
                <option value="360-degree circular orbit">360 Orbit</option>
              </select>
            </div>
          </div>

          {/* Lighting & Atmosphere */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-lighting" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                5. Lighting &amp; Atmosphere
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Time of day &amp; mood</span>
            </label>
            <div className="flex gap-2">
              <input
                id="prompt-lighting"
                type="text"
                value={config.lighting}
                onChange={(e) => setConfig((prev) => ({ ...prev, lighting: e.target.value }))}
                placeholder="e.g. Golden hour warm sunset with volumetric god-rays"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <select
                aria-label="Preset Lighting"
                onChange={(e) => {
                  if (e.target.value) setConfig((prev) => ({ ...prev, lighting: e.target.value }))
                }}
                className="w-28 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 text-slate-700 dark:text-slate-300"
              >
                <option value="">Presets...</option>
                <option value="Golden hour warm amber sunlight">Golden Hour</option>
                <option value="Cyberpunk neon magenta and cyan glow">Neon Cyber</option>
                <option value="Moody chiaroscuro dark shadows with single beam">Chiaroscuro</option>
                <option value="Overcast diffused soft daylight">Soft Overcast</option>
                <option value="Studio three-point lighting with rim highlight">Studio Rim</option>
              </select>
            </div>
          </div>

          {/* Visual Style & Film Aesthetics */}
          <div className="space-y-1.5">
            <label htmlFor="prompt-style" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Film className="h-3.5 w-3.5 text-rose-500" />
                6. Visual Style &amp; Film Aesthetic
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Color &amp; rendering</span>
            </label>
            <div className="flex gap-2">
              <input
                id="prompt-style"
                type="text"
                value={config.visualStyle}
                onChange={(e) => setConfig((prev) => ({ ...prev, visualStyle: e.target.value }))}
                placeholder="e.g. 35mm vintage film, Kodak Portra color grading, photorealistic"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <select
                aria-label="Preset Visual Style"
                onChange={(e) => {
                  if (e.target.value) setConfig((prev) => ({ ...prev, visualStyle: e.target.value }))
                }}
                className="w-28 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 text-slate-700 dark:text-slate-300"
              >
                <option value="">Presets...</option>
                <option value="Cinematic 35mm film grain, 8K photorealism">Cinematic 35mm</option>
                <option value="Hyperrealistic 8K documentary style">Documentary</option>
                <option value="Makoto Shinkai anime aesthetic, vibrant sky">Anime Dream</option>
                <option value="Commercial advertising studio CGI, razor sharp">Commercial CGI</option>
                <option value="IMAX 70mm large format cinematography">IMAX Epic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Technical Specs: Aspect Ratio, Resolution, FPS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Tv className="h-3.5 w-3.5 text-slate-500" />
              <span>Aspect Ratio</span>
            </label>
            <div className="grid grid-cols-4 gap-1">
              {['16:9', '9:16', '1:1', '2.39:1'].map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, aspectRatio: ar }))}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                    config.aspectRatio === ar
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Compass className="h-3.5 w-3.5 text-slate-500" />
              <span>Frame Rate</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['24fps', '30fps', '60fps'].map((fpsVal) => (
                <button
                  key={fpsVal}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, fps: fpsVal }))}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                    config.fps === fpsVal
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {fpsVal}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>Master Resolution</span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['1080p', '4K', '8K'].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, resolution: res }))}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                    config.resolution === res
                      ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generated Prompt Output Box */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Compiled Production Prompt
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(generatedPrompt)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 p-4 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed select-all">
            {generatedPrompt}
          </div>
        </div>

        {/* Negative Prompt Callout */}
        <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Recommended Negative Prompt (prevents deformities and artifacts)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(negativePrompt, true)}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              {copiedNegative ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>{copiedNegative ? 'Copied' : 'Copy Negative'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800 select-all">
            {negativePrompt}
          </p>
        </div>
      </div>
    </div>
  )
}
