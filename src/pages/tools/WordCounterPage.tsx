import React from 'react'
import { ToolPageLayout } from '../../components/layout/ToolPageLayout'
import { WordCounter } from '../../tools/WordCounter/WordCounter'
import { ALL_TOOLS } from '../../data/toolsData'

export const WordCounterPage: React.FC = () => {
  const tool = ALL_TOOLS.find((t) => t.slug === 'word-counter')!

  const howToUseSteps = [
    'Paste or type your article, essay, social media post, or script directly into the large workspace textarea.',
    'Metrics update live in real-time as you write: words, characters with/without spaces, sentences, and paragraphs.',
    'Review the estimated reading time badge to ensure your content suits your audience attention span.',
    'Use the "Copy" button to instantly grab your text with one click, or "Clear" to wipe the editor clean.',
    'Click "Load Sample" to explore how multi-paragraph formatting and statistics appear.',
  ]

  const formulas = [
    {
      title: 'Word Tokenization Rule',
      formula: 'Words = Text.trim().split(/\\s+/).filter(token => token.length > 0)',
      explanation: 'Splits on arbitrary whitespace clusters, tabs, and line breaks while discarding empty token artifacts.',
    },
    {
      title: 'Characters Without Spaces',
      formula: 'Chars (No Spaces) = Text.replace(/\\s+/g, "").length',
      explanation: 'Measures total linguistic glyphs and punctuation marks excluding formatting blanks.',
    },
    {
      title: 'Estimated Reading Duration',
      formula: 'Reading Time (min) = Math.ceil(Total Words / 200)',
      explanation: 'Assumes average silent reading speed of 200 words per minute commonly recommended by publishing standards.',
    },
    {
      title: 'Average Words Per Sentence',
      formula: 'Avg Words = Total Words / Sentence Count',
      explanation: 'Evaluates readability and prose pacing (15–20 words per sentence is ideal for high comprehension).',
    },
  ]

  const examples = [
    {
      title: 'Social Media Character Limits',
      description: 'Ensuring an X (formerly Twitter) post fits within 280 characters or LinkedIn post within standard preview length.',
      input: 'A short promotional snippet with hashtags',
      output: '245 Characters • 38 Words',
    },
    {
      title: 'Academic College Essay',
      description: 'Monitoring strict 500-word university SOP or exam essay limits.',
      input: 'University admission statement',
      output: '492 Words • 3 Paragraphs • 2.5 min read',
    },
    {
      title: 'Blog Post & SEO Article Pacing',
      description: 'Writing an in-depth 1,500 word technology guide.',
      input: 'Full article text with subheadings',
      output: '1,520 Words • 8 min estimated reading time',
    },
  ]

  const faqs = [
    {
      question: 'Does this word counter support Hindi and other Indian languages?',
      answer: 'Yes! The tokenizer operates with full Unicode support, allowing accurate word, character, and sentence counting for Hindi, Bengali, Tamil, Telugu, Marathi, and all Indian regional scripts as well as emojis.',
    },
    {
      question: 'Is my text private and secure?',
      answer: 'Absolutely. Your text is processed entirely within your browser memory. Nothing you type is sent over the internet or saved to any database.',
    },
    {
      question: 'How is reading time calculated?',
      answer: 'Based on cognitive linguistic research, the typical adult reads English and informational prose at approximately 200 to 250 words per minute. We use 200 WPM to give you a reliable estimate.',
    },
    {
      question: 'Do hyphenated words count as one or two words?',
      answer: 'Hyphenated terms (like "state-of-the-art") separated by hyphens without inner spaces are counted as a single word token according to standard word-processor conventions.',
    },
  ]

  return (
    <ToolPageLayout
      tool={tool}
      seoTitle="Word Counter — Count Words, Characters & Reading Time Live | SmartTools India"
      seoDescription="Count words, characters, sentences, paragraphs, and reading time in real-time. Free online text analyzer for writers, students, and SEO creators."
      howToUseSteps={howToUseSteps}
      formulas={formulas}
      examples={examples}
      faqs={faqs}
      relatedSlugs={['unit-converter', 'percentage-calculator', 'date-difference-calculator']}
    >
      <WordCounter />
    </ToolPageLayout>
  )
}
