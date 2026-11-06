import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { HomePage } from './pages/HomePage'
import { ToolsPage } from './pages/ToolsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PercentageCalculatorPage } from './pages/tools/PercentageCalculatorPage'
import { AgeCalculatorPage } from './pages/tools/AgeCalculatorPage'
import { DiscountCalculatorPage } from './pages/tools/DiscountCalculatorPage'
import { EMICalculatorPage } from './pages/tools/EMICalculatorPage'
import { GSTCalculatorPage } from './pages/tools/GSTCalculatorPage'
import { ProfitLossCalculatorPage } from './pages/tools/ProfitLossCalculatorPage'
import { SalaryCalculatorPage } from './pages/tools/SalaryCalculatorPage'
import { DateDifferenceCalculatorPage } from './pages/tools/DateDifferenceCalculatorPage'
import { UnitConverterPage } from './pages/tools/UnitConverterPage'
import { WordCounterPage } from './pages/tools/WordCounterPage'
import { PDFEditorPage } from './pages/tools/PDFEditorPage'
import { TextToSpeechPage } from './pages/tools/TextToSpeechPage'
import { VideoPromptGeneratorPage } from './pages/tools/VideoPromptGeneratorPage'
import { AudioStudioPage } from './pages/tools/AudioStudioPage'
import { AudioTranscriberPage } from './pages/tools/AudioTranscriberPage'
import { JpgToPdfPage } from './pages/tools/JpgToPdfPage'
import { ImageQualityIncreaserPage } from './pages/tools/ImageQualityIncreaserPage'
import { GamesPage } from './pages/GamesPage'
import { HexDriftPage } from './pages/games/HexDriftPage'
import { ThemeProvider } from './context/ThemeContext'

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="tools/percentage-calculator" element={<PercentageCalculatorPage />} />
          <Route path="tools/age-calculator" element={<AgeCalculatorPage />} />
          <Route path="tools/discount-calculator" element={<DiscountCalculatorPage />} />
          <Route path="tools/emi-calculator" element={<EMICalculatorPage />} />
          <Route path="tools/gst-calculator" element={<GSTCalculatorPage />} />
          <Route path="tools/profit-loss-calculator" element={<ProfitLossCalculatorPage />} />
          <Route path="tools/profit-and-loss-calculator" element={<Navigate to="/tools/profit-loss-calculator" replace />} />
          <Route path="tools/salary-calculator" element={<SalaryCalculatorPage />} />
          <Route path="tools/date-difference-calculator" element={<DateDifferenceCalculatorPage />} />
          <Route path="tools/date-calculator" element={<Navigate to="/tools/date-difference-calculator" replace />} />
          <Route path="tools/unit-converter" element={<UnitConverterPage />} />
          <Route path="tools/word-counter" element={<WordCounterPage />} />
          <Route path="tools/pdf-editor" element={<PDFEditorPage />} />
          <Route path="tools/text-to-speech" element={<TextToSpeechPage />} />
          <Route path="tools/video-prompt-generator" element={<VideoPromptGeneratorPage />} />
          <Route path="tools/audio-studio" element={<AudioStudioPage />} />
          <Route path="tools/audio-transcriber" element={<AudioTranscriberPage />} />
          <Route path="tools/jpg-to-pdf" element={<JpgToPdfPage />} />
          <Route path="tools/image-quality-increaser" element={<ImageQualityIncreaserPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="games/hex-drift" element={<HexDriftPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
)
}

export default App
