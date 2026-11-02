import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { ImageQualityIncreaser } from '../../tools/ImageQualityIncreaser/ImageQualityIncreaser'
import { ALL_TOOLS } from '../../data/toolsData'
import type { Tool } from '../../types/tools'

export const ImageQualityIncreaserPage: React.FC = () => {
  const tool: Tool = ALL_TOOLS.find((t) => t.slug === 'image-quality-increaser') || {
    id: 'image-quality-increaser',
    name: 'Image Quality Increaser',
    slug: 'image-quality-increaser',
    path: '/tools/image-quality-increaser',
    description: 'Enhance image clarity, edge sharpness, contrast, and upscaled resolution up to 4x directly in your browser with zero server uploads.',
    categoryId: 'creator-tools',
    categoryIds: ['creator-tools', 'seo-tools', 'education'],
    categoryName: 'Creator Tools',
    icon: 'Maximize2',
    isPopular: true,
    isFunctional: true,
    keywords: ['image quality increaser', 'enhance image online', 'upscale photo', 'image sharpener', 'photo resolution booster', 'browser image enhancer'],
  }

  const howToUseSteps = [
    'Upload your JPG, PNG, or WebP photo by dragging it into the dropzone or clicking "Select Image File".',
    'View the interactive Before/After preview. Drag the vertical divider handle left and right to inspect fine detail improvements.',
    'Select your desired output resolution: 1x (Original size), 2x Upscale (High Definition 200%), or 4x Upscale (Ultra High Definition 400%).',
    'Fine-tune the Edge Sharpness slider to apply 3x3 unsharp mask convolution, bringing out subtle textures without noise.',
    'Adjust Contrast, Brightness, and Color Saturation sliders to balance tone curves and enhance color vibrancy.',
    'Select your preferred export format (JPG for compressed sharing or PNG for lossless master quality).',
    'Click "Download Enhanced Image" to save the high-resolution picture directly to your device.',
  ]

  const formulas = [
    {
      title: '3×3 Laplacian Unsharp Mask Convolution',
      formula: 'I_sharp(x, y) = I(x, y) + w × [4·I(x, y) - I(x+1, y) - I(x-1, y) - I(x, y+1) - I(x, y-1)]',
      explanation:
        'Calculates spatial second-derivatives along micro-edges and amplifies high-frequency details directly on canvas pixel buffers.',
    },
    {
      title: 'Midpoint-Anchored Contrast Expansion',
      formula: 'F = 259 × (C + 255) / [255 × (259 - C)], Output = F × (Input - 128) + 128',
      explanation:
        'Expands luminance distance from the 128 midpoint, boosting perceived depth and clarity across textures.',
    },
    {
      title: 'ITU-R BT.709 Relative Luminance & Chroma Saturation',
      formula: 'Y = 0.2126·R + 0.7152·G + 0.0722·B, Channel\' = Y + S × (Channel - Y)',
      explanation:
        'Preserves perceptual human eye brightness sensitivity while intensifying color richness.',
    },
    {
      title: 'Multi-Pass Stepped Canvas Super-Sampling',
      formula: 'Resolution_out = Resolution_in × ScaleFactor (1×, 2×, 4×), with High-Quality Bicubic Resampling',
      explanation:
        'Step-interpolates intermediate canvas buffers to prevent pixelation and aliasing artifacts when magnifying images.',
    },
  ]

  const examples = [
    {
      title: 'Smartphone Low-Light Photo Enhancement',
      description: 'Enhance a soft, underexposed 1080p smartphone camera photo taken indoors.',
      input: '1920 × 1080 JPEG photo with +35% Sharpness, +15% Contrast, +10% Saturation, 2x Upscale',
      output: 'Crisp 3840 × 2160 (8.3 Megapixel) image with illuminated shadow details and punchy natural colors.',
    },
    {
      title: 'Website Logo & Graphic Magnification',
      description: 'Upscale a small 400 × 400 web icon or graphic for print or presentation slides.',
      input: '400 × 400 PNG with 4x Upscale and Lossless PNG export',
      output: 'High-definition 1600 × 1600 PNG with smooth anti-aliased curves and sharp edges.',
    },
  ]

  const faqs = [
    {
      question: 'How does the image quality enhancement work?',
      answer:
        'This tool uses a browser-native image processing pipeline combining progressive multi-pass bicubic super-sampling with a 3×3 unsharp mask Laplacian edge-enhancement convolution filter. All processing occurs in hardware-accelerated HTML5 Canvas on your device, without uploading your photos to remote servers.',
    },
    {
      question: 'Is this an AI deep-learning model?',
      answer:
        'No. In compliance with SmartTools India standards, we clearly label this as a transparent, high-precision browser-based algorithmic processor rather than AI. It does not require downloading hundreds of megabytes of heavy AI models or sending data to third-party cloud APIs.',
    },
    {
      question: 'Are my pictures stored or sent to the cloud?',
      answer:
        'Never. Your images are loaded into local browser memory and processed strictly on your computer or smartphone. We have zero tracking, zero server storage, and zero data uploads.',
    },
    {
      question: 'What is the difference between JPG and PNG export?',
      answer:
        'JPG provides high-efficiency compression ideal for social media, email, and everyday viewing. PNG provides lossless compression with perfect color accuracy, making it ideal for graphics, diagrams, and archival photos.',
    },
  ]

  const relatedSlugs = ['jpg-to-pdf', 'pdf-editor', 'video-prompt-generator', 'audio-studio']

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Free Image Quality Increaser — Enhance Photo Clarity & Resolution Online | SmartTools India"
      seoDescription="Enhance image clarity, sharpness, contrast, and upscale resolution up to 4x directly in your browser. 100% private, free, and hardware-accelerated with zero server uploads."
      keywords="image quality increaser, enhance image quality, increase photo resolution, image sharpener, upscale image online, free photo enhancer, smarttools india"
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={relatedSlugs}
    >
      <ImageQualityIncreaser />
    </ToolPageLayout>
  )
}
