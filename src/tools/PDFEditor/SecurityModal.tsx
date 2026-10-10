import React, { useState, useEffect } from 'react'
import {
  X,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Printer,
  Copy,
  FileEdit,
  AlertTriangle,
  Check,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react'
import type { PdfSecuritySettings } from './types'

interface SecurityModalProps {
  isOpen: boolean
  onClose: () => void
  currentSettings: PdfSecuritySettings | null
  onSaveSettings: (settings: PdfSecuritySettings | null) => void
}

function calculatePasswordStrength(pass: string): { label: string; percent: number; color: string } {
  if (!pass) return { label: 'Empty', percent: 0, color: 'bg-slate-200 dark:bg-slate-700' }
  let score = 0
  if (pass.length >= 6) score += 20
  if (pass.length >= 10) score += 20
  if (/[A-Z]/.test(pass)) score += 20
  if (/[0-9]/.test(pass)) score += 20
  if (/[^A-Za-z0-9]/.test(pass)) score += 20

  if (score <= 40) return { label: 'Weak', percent: score, color: 'bg-rose-500' }
  if (score <= 60) return { label: 'Fair', percent: score, color: 'bg-amber-500' }
  if (score <= 80) return { label: 'Good', percent: score, color: 'bg-blue-500' }
  return { label: 'Strong', percent: 100, color: 'bg-emerald-500' }
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [enabled, setEnabled] = useState<boolean>(() => currentSettings?.enabled ?? true)
  const [userPassword, setUserPassword] = useState<string>(() => currentSettings?.userPassword || '')
  const [ownerPassword, setOwnerPassword] = useState<string>(() => currentSettings?.ownerPassword || '')
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false)
  const [showOwnerPassword, setShowOwnerPassword] = useState<boolean>(false)
  const [algorithm, setAlgorithm] = useState<'AES-256' | 'RC4'>(() => currentSettings?.algorithm || 'AES-256')

  // Permission settings
  const [allowPrinting, setAllowPrinting] = useState<boolean>(() => currentSettings?.allowPrinting ?? true)
  const [allowHighQualityPrint, setAllowHighQualityPrint] = useState<boolean>(() => currentSettings?.allowHighQualityPrint ?? true)
  const [allowCopying, setAllowCopying] = useState<boolean>(() => currentSettings?.allowCopying ?? false)
  const [allowModifying, setAllowModifying] = useState<boolean>(() => currentSettings?.allowModifying ?? false)
  const [allowAnnotating, setAllowAnnotating] = useState<boolean>(() => currentSettings?.allowAnnotating ?? true)
  const [allowFillingForms, setAllowFillingForms] = useState<boolean>(() => currentSettings?.allowFillingForms ?? true)
  const [allowAssembly, setAllowAssembly] = useState<boolean>(() => currentSettings?.allowAssembly ?? false)

  const [validationError, setValidationError] = useState<string | null>(null)

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const userStrength = calculatePasswordStrength(userPassword)

  const handleApply = () => {
    if (enabled) {
      if (!userPassword.trim() && !ownerPassword.trim()) {
        setValidationError('Please specify either an Open Password or a Master / Permissions Password.')
        return
      }
    }

    const settings: PdfSecuritySettings = {
      enabled,
      userPassword: userPassword.trim() || undefined,
      ownerPassword: ownerPassword.trim() || undefined,
      algorithm,
      allowPrinting,
      allowHighQualityPrint: allowPrinting && allowHighQualityPrint,
      allowCopying,
      allowModifying,
      allowAnnotating,
      allowFillingForms,
      allowAssembly,
    }

    onSaveSettings(enabled ? settings : null)
    onClose()
  }

  const handleClear = () => {
    onSaveSettings(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  PDF Security & Permissions
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Client-Side
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect your document with standard PDF encryption and permission restrictions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master Enable Protection Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  enabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {enabled ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enable PDF Password & Security
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Encrypt document and enforce printing & copying restrictions when exported.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {enabled && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Passwords Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User / Open Password */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-blue-500" />
                      <span>Document Open Password</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Required to view</span>
                  </div>

                  <div className="relative">
                    <input
                      type={showUserPassword ? 'text' : 'password'}
                      value={userPassword}
                      onChange={(e) => {
                        setUserPassword(e.target.value)
                        setValidationError(null)
                      }}
                      placeholder="e.g. MySecretPass123"
                      className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {userPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Strength:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {userStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${userStrength.color} transition-all duration-300`}
                          style={{ width: `${userStrength.percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Users must enter this password to open and view the PDF.
                  </p>
                </div>

                {/* Owner / Master Password */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      <span>Master / Owner Password</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Permissions admin</span>
                  </div>

                  <div className="relative">
                    <input
                      type={showOwnerPassword ? 'text' : 'password'}
                      value={ownerPassword}
                      onChange={(e) => {
                        setOwnerPassword(e.target.value)
                        setValidationError(null)
                      }}
                      placeholder="e.g. AdminControl987"
                      className="w-full pr-10 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Required to bypass permissions or modify security settings in Adobe Acrobat.
                  </p>
                </div>
              </div>

              {/* Encryption Algorithm Selection */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Encryption Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      algorithm === 'AES-256'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value="AES-256"
                      checked={algorithm === 'AES-256'}
                      onChange={() => setAlgorithm('AES-256')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          AES-256
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        PDF 2.0 / Adobe Acrobat 9.0+. Highest military-grade security with SHA-256 key derivation.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      algorithm === 'RC4'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="algorithm"
                      value="RC4"
                      checked={algorithm === 'RC4'}
                      onChange={() => setAlgorithm('RC4')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          RC4 128-bit
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400">
                          Legacy
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Legacy standard for compatibility with ancient PDF readers (pre-Acrobat 7).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Document Permission Settings */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileEdit className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Document Permission Settings
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Standard Viewer Restrictions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Printing Permission */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Printing
                        </div>
                        <div className="text-[10px] text-slate-500">Enable physical printout</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowPrinting}
                      onChange={(e) => setAllowPrinting(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* High Quality Printing */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          High-Quality Print
                        </div>
                        <div className="text-[10px] text-slate-500">Allow max resolution print</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!allowPrinting}
                      checked={allowPrinting && allowHighQualityPrint}
                      onChange={(e) => setAllowHighQualityPrint(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  {/* Copying Permission */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Copy className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Copying
                        </div>
                        <div className="text-[10px] text-slate-500">Copy text & graphics</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowCopying}
                      onChange={(e) => setAllowCopying(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Modifying Permission */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <FileEdit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Modifying
                        </div>
                        <div className="text-[10px] text-slate-500">Edit document content</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowModifying}
                      onChange={(e) => setAllowModifying(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Annotations & Comments */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Annotating
                        </div>
                        <div className="text-[10px] text-slate-500">Add notes & markups</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowAnnotating}
                      onChange={(e) => setAllowAnnotating(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Form Filling */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Form Filling
                        </div>
                        <div className="text-[10px] text-slate-500">Fill existing interactive fields</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowFillingForms}
                      onChange={(e) => setAllowFillingForms(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {/* Page Assembly */}
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Allow Page Assembly
                        </div>
                        <div className="text-[10px] text-slate-500">Insert, rotate, or delete pages</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowAssembly}
                      onChange={(e) => setAllowAssembly(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Notice & Limitations Callout */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span>Important Security & Technical Notes:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                  <li>
                    <strong>100% Client-Side Encryption:</strong> All encryption algorithms run directly in your browser memory via WebAssembly/pure JavaScript. Passwords and documents are never sent over any network.
                  </li>
                  <li>
                    <strong>Document Open Password (User Password):</strong> Provides cryptographically unbreakable confidentiality with AES-256. Nobody can decrypt or view the PDF without this password.
                  </li>
                  <li>
                    <strong>Permission Enforcement Limitation:</strong> Printing and copying restrictions are standard PDF security flags. Standard conforming PDF viewers (such as Adobe Acrobat, Chrome, Microsoft Edge, and macOS Preview) strictly enforce these rules. However, non-conforming or open-source command-line tools can bypass permission restrictions if the document is unlocked.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <div>
            {currentSettings && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Remove Security
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Apply Security</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
