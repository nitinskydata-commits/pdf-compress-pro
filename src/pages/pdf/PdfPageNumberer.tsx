import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('pdf-page-numbering') || {
  slug: 'pdf-page-numbering',
  name: 'PDF Page Numbering',
  shortName: 'Page Numbering',
  description: 'Add page numbers to PDF documents with customizable formatting, position, and font size. 100% free, private browser-based tool.',
  metaTitle: 'Add Page Numbers to PDF Online Free — Header & Footer Numbering',
  metaDescription: 'Add page numbers to PDF online for free. Choose positions (bottom-center, bottom-right, header), formats (Page X of Y), and skip cover pages. 100% private.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['add page numbers to pdf', 'number pdf pages', 'pdf pagination', 'page numbering online free', 'pdf header footer numbering'],
  icon: '📄',
}

type NumberFormat = 'page-of-total' | 'simple-of' | 'page-num' | 'just-num' | 'dash-num'
type Position = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right'

const faqItems = [
  {
    question: 'Can I skip adding a page number to the cover page?',
    answer: 'Yes! Simply check "Skip First Page (Cover Page)", and numbering will begin on page 2 while keeping the title page clean.',
  },
  {
    question: 'What formatting options are available?',
    answer: 'You can choose between "Page 1 of 10", "1 / 10", "Page 1", plain "1", or decorative "- 1 -". You can also change the starting index if your document starts at a higher chapter number.',
  },
  {
    question: 'Where can I place the page numbers?',
    answer: 'You can position the numbers at the Bottom Center, Bottom Right, Bottom Left, Top Center, or Top Right, with automatic margin offsets.',
  },
  {
    question: 'Is my PDF uploaded to any server?',
    answer: 'No. All PDF processing is performed directly in your web browser memory using pdf-lib. Your documents remain 100% private.',
  },
]

export default function PdfPageNumberer() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [format, setFormat] = useState<NumberFormat>('page-of-total')
  const [position, setPosition] = useState<Position>('bottom-center')
  const [skipFirstPage, setSkipFirstPage] = useState(false)
  const [startNumber, setStartNumber] = useState(1)
  const [fontSize, setFontSize] = useState(10)
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
    try {
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      setPageCount(doc.getPageCount())
    } catch {
      alert('Could not open PDF file. Please ensure it is not password-protected.')
    }
  }, [])

  const formatText = (current: number, total: number): string => {
    switch (format) {
      case 'page-of-total':
        return `Page ${current} of ${total}`
      case 'simple-of':
        return `${current} / ${total}`
      case 'page-num':
        return `Page ${current}`
      case 'just-num':
        return `${current}`
      case 'dash-num':
        return `- ${current} -`
    }
  }

  const addPageNumbers = useCallback(async () => {
    if (!file || isProcessing || pageCount === 0) return
    setIsProcessing(true)

    try {
      const buffer = await file.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      const totalToCount = skipFirstPage ? pageCount - 1 : pageCount

      let pageIndex = 0
      for (let i = 0; i < pages.length; i++) {
        if (i === 0 && skipFirstPage) continue

        const page = pages[i]
        const { width, height } = page.getSize()
        const currentNum = startNumber + pageIndex
        const text = formatText(currentNum, totalToCount)
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        const margin = 30

        let x = (width - textWidth) / 2
        let y = margin

        if (position === 'bottom-right') {
          x = width - textWidth - margin
          y = margin
        } else if (position === 'bottom-left') {
          x = margin
          y = margin
        } else if (position === 'top-center') {
          x = (width - textWidth) / 2
          y = height - margin - fontSize
        } else if (position === 'top-right') {
          x = width - textWidth - margin
          y = height - margin - fontSize
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.2, 0.2, 0.2),
        })

        pageIndex++
      }

      const outputBytes = await doc.save()
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'pdf-page-numbering',
        toolName: 'PDF Page Numbering',
        category: 'pdf',
        action: `Numbered ${file.name} (${pageCount} pages)`,
        details: `Format: ${format}, Position: ${position}, SkipFirst: ${skipFirstPage}`,
        originalSize: file.size,
        compressedSize: outputBytes.length,
        method: 'Client PDF-Lib Vector Typography',
      })

      setResult({
        blob,
        size: outputBytes.length,
      })
    } catch (err) {
      alert('Failed to add page numbers. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, pageCount, format, position, skipFirstPage, startNumber, fontSize])

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
        canonical="/pdf-page-numbering"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/pdf-page-numbering`,
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
          <ToolVisualBadge category="pdf" slug="pdf-page-numbering" name="Page Numbers" icon="📄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Add Page Numbers to PDF
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Insert professional headers or footers with page numbers into your PDF documents. Choose positions, formats, and skip cover pages. 100% private in your browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Multiple Number Formats
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Header & Footer Placements
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
              icon="📄"
              title="Drop your PDF here to add page numbers, or click to browse"
              subtitle="Files are processed directly in your browser memory"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="pdf-page-numbering" name="PDF" size="md" />
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

              {/* Number Format Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Number Format Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'page-of-total', label: 'Page 1 of 10' },
                    { id: 'simple-of', label: '1 / 10' },
                    { id: 'page-num', label: 'Page 1' },
                    { id: 'just-num', label: '1' },
                    { id: 'dash-num', label: '- 1 -' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormat(item.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        format === item.id
                          ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                          : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Position on Page
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'bottom-center', label: 'Bottom Center (Standard)' },
                    { id: 'bottom-right', label: 'Bottom Right' },
                    { id: 'bottom-left', label: 'Bottom Left' },
                    { id: 'top-center', label: 'Top Center (Header)' },
                    { id: 'top-right', label: 'Top Right' },
                  ].map(pos => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        position === pos.id
                          ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                          : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{pos.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options: Skip First Page, Starting Number, Font Size */}
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipFirstPage}
                    onChange={e => setSkipFirstPage(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-600 accent-primary-600"
                  />
                  <span className="text-xs font-semibold text-surface-800">
                    Skip First Page (Do not number cover page)
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-surface-200">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Start Numbering At
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={e => setStartNumber(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-bold text-center bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Font Size
                    </label>
                    <select
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                    >
                      <option value="9">9 pt (Small)</option>
                      <option value="10">10 pt (Default)</option>
                      <option value="12">12 pt (Large)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={addPageNumbers}
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Numbering Pages...
                  </span>
                ) : (
                  `🔢 Add Page Numbers to ${pageCount} Pages`
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
              Page Numbers Added Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              All {pageCount} pages have been numbered ({formatFileSize(result.size)}).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `numbered_${file?.name || 'document.pdf'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Numbered PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Number Another PDF
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Add Page Numbers to PDF Files
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to prepare an academic report, business contract, or legal brief? PDFCompress Pro lets you add clean page numbers to headers or footers with a single click.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Choose whether to start numbering after a cover page, adjust font sizing, or select between format standards like "Page 1 of 12" or simple numbers. All rendering is 100% private and happens directly in your browser.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="pdf-page-numbering" />
      </div>
    </div>
  )
}
