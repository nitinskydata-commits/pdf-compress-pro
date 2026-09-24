import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument, degrees } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('rotate-pdf') || {
  slug: 'rotate-pdf',
  name: 'Rotate PDF Online',
  shortName: 'Rotate PDF',
  description: 'Rotate PDF pages 90 degrees clockwise, 180 degrees, or counter-clockwise permanently. 100% free, private, and preserves original quality.',
  metaTitle: 'Rotate PDF Online Free — Rotate 90°, 180°, 270° Instantly',
  metaDescription: 'Rotate PDF pages permanently in your web browser. Rotate all pages, odd/even pages, or specific ranges. 100% secure with zero file uploads.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['rotate pdf', 'turn pdf', 'rotate pdf 90 degrees', 'rotate pdf online free', 'fix upside down pdf'],
  icon: '🔄',
}

const faqItems = [
  {
    question: 'Does rotating a PDF degrade text or image quality?',
    answer: 'No. Rotating a PDF simply modifies the orientation metadata flag on the page dictionary. All text vectors, embedded fonts, and high-resolution images remain 100% untouched and sharp.',
  },
  {
    question: 'Will the rotation remain permanent when I save or print the PDF?',
    answer: 'Yes! The rotation is saved directly into the PDF file structure. When you open it in Adobe Acrobat, Apple Preview, Google Chrome, or send it to a printer, it will stay in the new orientation.',
  },
  {
    question: 'Can I rotate only upside-down or landscape pages?',
    answer: 'Yes! You can choose to rotate "Odd Pages Only", "Even Pages Only", or enter specific page numbers (e.g. 2, 4, 7-9) while leaving the other pages in their original portrait layout.',
  },
  {
    question: 'Are my confidential documents uploaded to any server?',
    answer: 'No. The entire rotation is executed directly in your browser memory using WebAssembly and pdf-lib. Your files never leave your device.',
  },
]

type RotationAngle = 90 | 180 | 270
type PageScope = 'all' | 'odd' | 'even' | 'custom'

export default function PdfRotator() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [angle, setAngle] = useState<RotationAngle>(90)
  const [scope, setScope] = useState<PageScope>('all')
  const [customRange, setCustomRange] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; size: number; pagesRotated: number } | null>(null)
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
    try {
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const count = doc.getPageCount()
      setPageCount(count)
      setCustomRange(`1-${count}`)
    } catch {
      alert('Could not open PDF. Please verify that the file is not password-protected.')
    }
  }, [])

  const parseTargetPages = (max: number): number[] => {
    if (scope === 'all') {
      return Array.from({ length: max }, (_, i) => i + 1)
    }
    if (scope === 'odd') {
      const odds: number[] = []
      for (let i = 1; i <= max; i += 2) odds.push(i)
      return odds
    }
    if (scope === 'even') {
      const evens: number[] = []
      for (let i = 2; i <= max; i += 2) evens.push(i)
      return evens
    }
    // custom range
    const pages = new Set<number>()
    customRange.split(',').forEach(part => {
      const trimmed = part.trim()
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number)
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.max(1, s); i <= Math.min(max, e); i++) {
            pages.add(i)
          }
        }
      } else {
        const n = Number(trimmed)
        if (!isNaN(n) && n >= 1 && n <= max) pages.add(n)
      }
    })
    return Array.from(pages).sort((a, b) => a - b)
  }

  const targetPages = parseTargetPages(pageCount)

  const rotatePdf = useCallback(async () => {
    if (!file || isProcessing || pageCount === 0) return
    if (targetPages.length === 0) {
      alert('No valid pages selected to rotate.')
      return
    }

    setIsProcessing(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(buffer)
      const pages = pdf.getPages()

      for (const pNum of targetPages) {
        const idx = pNum - 1
        if (idx >= 0 && idx < pages.length) {
          const page = pages[idx]
          const currentRotation = page.getRotation().angle
          page.setRotation(degrees((currentRotation + angle) % 360))
        }
      }

      const rotatedBytes = await pdf.save()
      const blob = new Blob([rotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'rotate-pdf',
        toolName: 'Rotate PDF',
        category: 'pdf',
        action: `Rotated ${targetPages.length} pages by ${angle}°`,
        details: `File: ${file.name}, Scope: ${scope}`,
        originalSize: file.size,
        compressedSize: rotatedBytes.length,
        method: 'Client PDF-Lib Page Rotation',
      })

      setResult({
        blob,
        size: rotatedBytes.length,
        pagesRotated: targetPages.length,
      })
    } catch (err) {
      alert('Failed to rotate PDF. Please check your document and try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, pageCount, targetPages, angle, scope])

  const reset = () => {
    setFile(null)
    setPageCount(0)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/rotate-pdf"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/rotate-pdf`,
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
          <ToolVisualBadge category="pdf" slug="rotate-pdf" name="Rotate PDF" icon="🔄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Rotate PDF Pages Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Rotate misaligned or upside-down PDF pages 90°, 180°, or 270° permanently. Safe, instantaneous in-browser processing with zero quality loss.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Permanent Orientation Save
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Zero Server Uploads
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Vector Quality
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
              icon="🔄"
              title="Drop your PDF here to rotate, or click to browse"
              subtitle="Rotate landscape scans or upside-down pages • Runs privately in your browser"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="rotate-pdf" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatFileSize(file.size)} • {pageCount} pages
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

              {/* Rotation Angle Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Select Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAngle(90)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      angle === 90
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">↷</div>
                    <div className="text-sm font-bold">90° Right</div>
                    <div className="text-xs text-surface-500">Clockwise</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAngle(180)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      angle === 180
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">↻</div>
                    <div className="text-sm font-bold">180° Flip</div>
                    <div className="text-xs text-surface-500">Upside Down</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAngle(270)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      angle === 270
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="text-2xl mb-1">↶</div>
                    <div className="text-sm font-bold">90° Left</div>
                    <div className="text-xs text-surface-500">Counter-Clockwise</div>
                  </button>
                </div>
              </div>

              {/* Page Scope Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Apply Rotation To
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      scope === 'all'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    All Pages ({pageCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('odd')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      scope === 'odd'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    Odd Pages Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('even')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      scope === 'even'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    Even Pages Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('custom')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      scope === 'custom'
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Custom Range Input (if active) */}
              {scope === 'custom' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                    Custom Page Numbers
                  </label>
                  <input
                    type="text"
                    value={customRange}
                    onChange={e => setCustomRange(e.target.value)}
                    placeholder="e.g. 1-3, 5, 8"
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm text-surface-800"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    Targeting {targetPages.length} of {pageCount} pages: [{targetPages.join(', ')}]
                  </p>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={rotatePdf}
                disabled={isProcessing || targetPages.length === 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rotating Pages...
                  </span>
                ) : (
                  `🔄 Rotate ${targetPages.length} ${
                    targetPages.length === 1 ? 'Page' : 'Pages'
                  } by ${angle}°`
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
              PDF Rotated Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Rotated {result.pagesRotated} {result.pagesRotated === 1 ? 'page' : 'pages'} by {angle}°.
              Orientation changes have been permanently applied.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Pages Rotated</div>
                <div className="text-xl font-bold text-surface-900">{result.pagesRotated}</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">File Size</div>
                <div className="text-xl font-bold text-surface-900">{formatFileSize(result.size)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `rotated_${angle}deg_${file?.name || 'document.pdf'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Rotated PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Rotate Another PDF
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Rotate PDF Pages Permanently Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Scanned a document upside-down or have a landscape spreadsheet mixed in with portrait pages? PDFCompress Pro lets you rotate any PDF document clockwise (90°), upside-down (180°), or counter-clockwise (270°).
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Unlike simple browser viewer zoom tricks that revert as soon as you close the tab, PDFCompress Pro updates the internal page geometry metadata. Your orientation fix remains permanently baked into the PDF when downloaded, sent via email, or printed.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="rotate-pdf" />
      </div>
    </div>
  )
}
