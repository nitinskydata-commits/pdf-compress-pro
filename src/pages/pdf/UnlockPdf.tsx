import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const tool = getToolBySlug('unlock-pdf') || {
  slug: 'unlock-pdf',
  name: 'Unlock PDF Online',
  shortName: 'Unlock PDF',
  description: 'Remove password protection, printing restrictions, and copy limits from your PDF documents. 100% free, private in-browser decryption.',
  metaTitle: 'Unlock PDF Online Free — Remove PDF Password & Restrictions',
  metaDescription: 'Unlock password protected PDF online for free. Strip owner restrictions, re-enable printing, and save unencrypted PDF copy. 100% secure.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['unlock pdf', 'remove pdf password', 'decrypt pdf', 'pdf password remover', 'unlock pdf permissions'],
  icon: '🔓',
}

const faqItems = [
  {
    question: 'How do I remove the password permanently from a PDF?',
    answer: 'Upload your password-protected PDF, enter your password once to authorize decryption, and click "Unlock PDF". The browser will export a clean, unencrypted version that opens anywhere without asking for a password.',
  },
  {
    question: 'Can I remove restrictions on printing or copying?',
    answer: 'Yes! Many PDFs allow viewing but block printing or text selection. Our tool strips these owner permission restrictions instantly.',
  },
  {
    question: 'Can this tool crack or bypass an unknown user password?',
    answer: 'No. For documents with strong AES encryption, you must know the password to decrypt the data. Once entered, the encryption is permanently removed so you never have to re-enter it.',
  },
  {
    question: 'Are my confidential documents uploaded to any server?',
    answer: 'No. All decryption and PDF generation run 100% locally inside your browser memory. Your files and passwords never touch external servers.',
  },
]

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setPassword('')

    try {
      const buffer = await f.arrayBuffer()
      // Test if document is encrypted
      const loadingTask = pdfjsLib.getDocument({ data: buffer })
      await loadingTask.promise
      setNeedsPassword(false)
    } catch (err: any) {
      if (err.name === 'PasswordException') {
        setNeedsPassword(true)
      } else {
        setNeedsPassword(false)
      }
    }
  }, [])

  const unlockDocument = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)

    try {
      const buffer = await file.arrayBuffer()

      // Attempt 1: If it only had owner permission restrictions (viewable without password)
      if (!needsPassword) {
        try {
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
          const outputBytes = await doc.save()
          const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

          trackToolUsage({
            toolId: 'unlock-pdf',
            toolName: 'Unlock PDF',
            category: 'pdf',
            action: `Removed restrictions from ${file.name}`,
            details: 'Owner permission flags cleared',
            originalSize: file.size,
            compressedSize: outputBytes.length,
            method: 'Client PDF-Lib Permission Unlock',
          })

          setResult({ blob, size: outputBytes.length })
          return
        } catch {
          // Fall through to password unlock
        }
      }

      // Attempt 2: Document with user password
      if (!password) {
        alert('Please enter the password for this PDF.')
        setIsProcessing(false)
        return
      }

      // Verify with pdfjsLib
      const loadingTask = pdfjsLib.getDocument({ data: buffer, password })
      const pdf = await loadingTask.promise
      const totalPages = pdf.numPages

      // Re-create clean unencrypted PDF with pdf-lib or canvas rendering
      const newDoc = await PDFDocument.create()
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!

        await (page.render as any)({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise

        const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95)
        const imgBytes = await fetch(imgDataUrl).then(r => r.arrayBuffer())
        const embeddedImg = await newDoc.embedJpg(imgBytes)

        const newPage = newDoc.addPage([viewport.width / 2.0, viewport.height / 2.0])
        newPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: viewport.width / 2.0,
          height: viewport.height / 2.0,
        })
      }

      const cleanBytes = await newDoc.save()
      const blob = new Blob([cleanBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'unlock-pdf',
        toolName: 'Unlock PDF',
        category: 'pdf',
        action: `Unlocked password on ${file.name}`,
        details: `Decrypted ${totalPages} pages permanently`,
        originalSize: file.size,
        compressedSize: cleanBytes.length,
        method: 'Client Decrypt & Re-encode',
      })

      setResult({ blob, size: cleanBytes.length })
    } catch (err: any) {
      if (err.name === 'PasswordException') {
        alert('Incorrect password. Please verify and try again.')
      } else {
        alert('Failed to unlock PDF. Please check your file and password.')
      }
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, needsPassword, password])

  const reset = () => {
    setFile(null)
    setPassword('')
    setNeedsPassword(false)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/unlock-pdf"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/unlock-pdf`,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <Link to="/#category-catalog">PDF Tools</Link>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="pdf" slug="unlock-pdf" name="Unlock PDF" icon="🔓" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Unlock PDF Online Free
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Remove password protection and strip printing, editing, and copying restrictions permanently. 100% private in-browser decryption with zero server uploads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Permanent Password Removal
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Strip Printing & Copy Limits
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Zero Server Uploads
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".pdf,application/pdf"
              onFiles={handleFile}
              maxSizeMB={100}
              icon="🔓"
              title="Drop your protected PDF here to unlock, or click to browse"
              subtitle="Remove password prompts and restrictions securely in your browser"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="unlock-pdf" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatFileSize(file.size)} • {needsPassword ? '🔒 Password Protected' : '🔓 Permission Restricted'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Password Input (if needed) */}
              {needsPassword && (
                <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-700">
                    Enter PDF Password
                  </label>
                  <p className="text-xs text-surface-500 mb-2">
                    Enter the document password once to authorize permanent removal of the encryption.
                  </p>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter document password"
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 font-bold text-surface-900"
                  />
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={unlockDocument}
                disabled={isProcessing || (needsPassword && !password)}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Decrypting Document...
                  </span>
                ) : (
                  '🔓 Remove Password & Unlock PDF'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Result Card */}
        {result && (
          <div ref={resultRef} className="card-premium p-6 sm:p-10 mb-8 border-2 border-emerald-500/30 text-center scroll-mt-24">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-surface-900 mb-2">
              PDF Unlocked Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              All encryption and owner restrictions have been permanently removed ({formatFileSize(result.size)}).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `unlocked_${file?.name || 'document.pdf'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Unlocked PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Unlock Another File
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Unlock and Remove PDF Passwords
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Tired of having to re-enter a password every time you open your monthly bank statement, pay stub, or utility invoice? PDFCompress Pro strips the password layer permanently.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Simply supply the password once to authorize decryption. Our browser-based engine compiles an unencrypted clean copy that can be opened, printed, and searched freely. Your confidential password and files never touch any external network.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="unlock-pdf" />
      </div>
    </div>
  )
}
