import React from 'react'
import { X, Clock, CheckCircle2 } from 'lucide-react'
import type { Tool } from '../../types/tools'
import { DynamicIcon } from './DynamicIcon'

interface ToolPreviewModalProps {
  tool: Tool | null
  onClose: () => void
}

export const ToolPreviewModal: React.FC<ToolPreviewModalProps> = ({ tool, onClose }) => {
  if (!tool) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DynamicIcon name={tool.icon} className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                {tool.categoryName}
              </span>
              <h3 id="modal-title" className="text-lg font-bold text-slate-900">
                {tool.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {tool.description}
          </p>

          <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4">
            <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Step 1 Foundation Preview</span>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              This tool card is part of the Step 1 core architecture. Full interactive calculations, inputs, and real-time computation logic are scheduled for implementation in Step 2.
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>100% Client-side processing (no database / no accounts)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Fast, responsive, and tailored for Indian users</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
