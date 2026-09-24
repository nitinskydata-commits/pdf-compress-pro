import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('extract-pdf-pages') || {
  slug: 'extract-pdf-pages',
  name: 'Extract PDF Pages',
  shortName: 'Extract Pages',
  description: 'Extract and save specific pages from any PDF document into a clean new file. 100% free, private browser-based tool with zero server uploads.',
  metaTitle: 'Extract PDF Pages Online Free — Save Specific Pages from PDF',
  metaDescription: 'Extract pages from PDF online for free. Choose exact page numbers, visual chips, or ranges. Instant, 100% private, and preserves original quality.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['extract pdf pages', 'save pages from pdf', 'pull pages from pdf', 'select pdf pages', 'export pdf pages'],
  icon: '📑',
}

const faqItems = [
  {
    question: 'How do I extract only specific pages from a PDF?',
    answer: 'Upload your PDF, click to toggle the exact page numbers you want to keep (or enter a range like 1-3, 5, 8), and click "Extract Pages". A new PDF containing only your selected pages will be generated instantly.',
  },
  {
    question: 'Does extracting pages lower the resolution or quality?',
    answer: 'No. The extracted pages are copied at the raw stream level. All vector art, fonts, annotations, and high-resolution images remain identical to the original file.',
  },
  {
    question: 'Can I extract non-consecutive pages?',
    answer: 'Yes! You can choose any combination of pages (for instance: pages 1, 4, 7, and 12-15). They will be cleanly assembled into your new PDF in order.',
  },
  {
    question: 'Is my PDF uploaded to any server?',
    answer: 'No. All processing is executed client-side inside your browser via pdf-lib. Your documents never touch external servers or cloud storage.',
  },
]

export default function PdfPageExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [rangeInput, setRangeInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; size: number; pageCount: number } | null>(null)
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
      const bytes = await f.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const count = doc.getPageCount()
      setPageCount(count)
      const initial = new Set<number>([1])
      setSelectedPages(initial)
      setRangeInput('1')
    } catch {
      alert('Could not open PDF. Please verify that the file is not password-protected.')
    }
  }, [])

  const syncSetToInput = (set: Set<number>) => {
    const sorted = Array.from(set).sort((a, b) => a - b)
    setRangeInput(sorted.join(', '))
  }

  const togglePage = (pageNum: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev)
      if (next.has(pageNum)) {
        next.delete(pageNum)
      } else {
        next.add(pageNum)
      }
      syncSetToInput(next)
      return next
    })
  }

  const selectAll = () => {
    const all = new Set(Array.from({ length: pageCount }, (_, i) => i + 1))
    setSelectedPages(all)
    syncSetToInput(all)
  }

  const selectNone = () => {
    setSelectedPages(new Set())
    setRangeInput('')
  }

  const selectOdd = () => {
    const odds = new Set<number>()
    for (let i = 1; i <= pageCount; i += 2) odds.add(i)
    setSelectedPages(odds)
    syncSetToInput(odds)
  }

  const selectEven = () => {
    const evens = new Set<number>()
    for (let i = 2; i <= pageCount; i += 2) evens.add(i)
    setSelectedPages(evens)
    syncSetToInput(evens)
  }

  const handleRangeInputChange = (val: string) => {
    setRangeInput(val)
    const pages = new Set<number>()
    val.split(',').forEach(part => {
      const trimmed = part.trim()
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number)
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.max(1, s); i <= Math.min(pageCount, e); i++) {
            pages.add(i)
          }
        }
      } else {
        const n = Number(trimmed)
        if (!isNaN(n) && n >= 1 && n <= pageCount) pages.add(n)
      }
    })
    setSelectedPages(pages)
  }

  const extractPages = useCallback(async () => {
    if (!file || isProcessing || selectedPages.size === 0) return
    setIsProcessing(true)
    try {
      const bytes = await file.arrayBuffer()
      const srcDoc = await PDFDocument.load(bytes)
      const newDoc = await PDFDocument.create()

      const sortedIndices = Array.from(selectedPages)
        .sort((a, b) => a - b)
        .map(p => p - 1)

      const copiedPages = await newDoc.copyPages(srcDoc, sortedIndices)
      copiedPages.forEach(p => newDoc.addPage(p))

      const outputBytes = await newDoc.save()
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'extract-pdf-pages',
        toolName: 'Extract PDF Pages',
        category: 'pdf',
        action: `Extracted ${selectedPages.size} pages from ${file.name}`,
        details: `Pages: [${Array.from(selectedPages).sort((a,b)=>a-b).join(', ')}]`,
        originalSize: file.size,
        compressedSize: outputBytes.length,
        method: 'Client PDF-Lib Page Extraction',
      })

      setResult({
        blob,
        size: outputBytes.length,
        pageCount: selectedPages.size,
      })
    } catch (err) {
      alert('Failed to extract pages. Please check your document and try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, selectedPages])

  const reset = () => {
    setFile(null)
    setPageCount(0)
    setSelectedPages(new Set())
    setRangeInput('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/extract-pdf-pages"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/extract-pdf-pages`,
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
          <ToolVisualBadge category="pdf" slug="extract-pdf-pages" name="Extract Pages" icon="📑" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Extract PDF Pages Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Select and save specific pages into a brand new PDF document. Simple, secure, and private browser processing with zero quality degradation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Visual Page Picker
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private in Browser
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Original Vector Resolution
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
              icon="📑"
              title="Drop your PDF here to extract pages, or click to browse"
              subtitle="Pick specific pages or chapters • Processed 100% in your browser"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="extract-pdf-pages" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatFileSize(file.size)} • <span className="font-semibold text-surface-800">{pageCount} total pages</span>
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

              {/* Selection Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={selectOdd}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Odd Pages
                  </button>
                  <button
                    type="button"
                    onClick={selectEven}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Even Pages
                  </button>
                  <button
                    type="button"
                    onClick={selectNone}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <span className="text-xs font-bold text-primary-600">
                  {selectedPages.size} of {pageCount} pages selected
                </span>
              </div>

              {/* Range Input Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-1">
                  Page Selection Range
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={e => handleRangeInputChange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 8-10"
                  className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm text-surface-800"
                />
              </div>

              {/* Visual Page Grid */}
              {pageCount > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                    Click Pages to Include / Exclude
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-64 overflow-y-auto p-3 bg-surface-50 rounded-2xl border border-surface-200">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => {
                      const isSelected = selectedPages.has(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePage(p)}
                          className={`h-16 rounded-xl border flex flex-col items-center justify-center p-2 text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-500/30'
                              : 'bg-white text-surface-600 border-surface-200 hover:border-surface-400 hover:bg-surface-100'
                          }`}
                        >
                          <span className="text-[10px] opacity-75 uppercase">Page</span>
                          <span className="text-base font-extrabold">{p}</span>
                          <span className="text-[9px] mt-0.5">{isSelected ? '✓' : '+'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={extractPages}
                disabled={isProcessing || selectedPages.size === 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting Pages...
                  </span>
                ) : (
                  `📑 Extract ${selectedPages.size} ${
                    selectedPages.size === 1 ? 'Page' : 'Pages'
                  } into New PDF`
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
              Pages Extracted Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Extracted {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} into a brand-new PDF document.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Pages Extracted</div>
                <div className="text-xl font-bold text-surface-900">{result.pageCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Output Size</div>
                <div className="text-xl font-bold text-surface-900">{formatFileSize(result.size)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `extracted_${file?.name || 'pages.pdf'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Extracted PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Extract More Pages
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            Why Extract PDF Pages with PDFCompress Pro?
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Standard PDF reader applications often lack an easy way to pull out only the pages you need without paying for expensive desktop software licenses. PDFCompress Pro provides a visual page grid where you can simply click on the pages you want or enter custom ranges.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Because everything is computed in your browser using pure JavaScript and WebAssembly, your documents are never uploaded to any third-party server, guaranteeing absolute confidentiality for sensitive financial, legal, or personal records.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="extract-pdf-pages" />
      </div>
    </div>
  )
}
