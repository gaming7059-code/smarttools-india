import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { SearchModal } from '../components/common/SearchModal'
import { ToolPreviewModal } from '../components/common/ToolPreviewModal'
import type { Tool } from '../types/tools'

export interface LayoutContextType {
  openSearch: () => void
  openToolPreview: (tool: Tool) => void
}

export const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [previewTool, setPreviewTool] = useState<Tool | null>(null)

  const handleOpenSearch = () => setIsSearchOpen(true)
  const handleCloseSearch = () => setIsSearchOpen(false)

  const handleOpenToolPreview = (tool: Tool) => {
    if (tool.isFunctional) {
      navigate(tool.path)
    } else {
      setPreviewTool(tool)
    }
  }

  const handleCloseToolPreview = () => {
    setPreviewTool(null)
  }

  const handleSelectToolFromSearch = (tool: Tool) => {
    setIsSearchOpen(false)
    if (tool.isFunctional) {
      navigate(tool.path)
    } else {
      setPreviewTool(tool)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Header onOpenSearch={handleOpenSearch} />

      <main className="flex-1">
        <Outlet
          context={{
            openSearch: handleOpenSearch,
            openToolPreview: handleOpenToolPreview,
          } satisfies LayoutContextType}
        />
      </main>

      <Footer />

      {/* Global Search Dialog (Ctrl+K or Header trigger) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        onSelectTool={handleSelectToolFromSearch}
      />

      {/* Step 1 Tool Preview Modal */}
      <ToolPreviewModal
        tool={previewTool}
        onClose={handleCloseToolPreview}
      />
    </div>
  )
}
