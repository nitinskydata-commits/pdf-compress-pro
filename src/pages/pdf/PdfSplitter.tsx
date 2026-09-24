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

const tool = getToolBySlug('pdf-splitter') || {
  slug: 'pdf-splitter',
  name: 'Split PDF Online',
  shortName: 'Split PDF',
  description: 'Extract specific pages or page ranges from any PDF document. 100% free, browser-based, and zero server uploads.',
  metaTitle: 'Split PDF Online Free — Extract Specific Pages from PDF',
  metaDescription: 'Split PDF files online for free. Extract custom page ranges or separate individual pages directly in your browser. Fast, 100% secure, and lossless.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['split pdf', 'extract pdf pages', 'separate pdf pages', 'cut pdf', 'pdf page extractor'],
  icon: '✂️',
}

const faqItems = [
  {
    question: 'How do I specify which pages to extract?',
    answer: 'You can use custom ranges separated by commas, such as "1-3, 5, 8-10", or click any of the quick preset buttons (All Pages, Odd Pages, Even Pages). You can also click the page numbers directly to toggle them.',
  },
  {
    question: 'Can I split every page into a separate document?',
    answer: 'Yes! Select the "Extract to Individual Files" mode, and our browser engine will generate and download separate single-page PDF files.',
  },
  {
    question: 'Will splitting change the layout or quality of my PDF?',
    answer: 'No. Splitting simply extracts the raw PDF page streams, fonts, and vector elements. The resulting PDF looks identical to the original pages.',
  },
  {
    question: 'Are my confidential documents uploaded anywhere?',
    answer: 'No. Everything runs strictly in your web browser memory via pdf-lib. No files are ever sent across the network.',
  },
]

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [rangeInput, setRangeInput] = useState('')
  const [splitMode, setSplitMode] = useState<'single' | 'separate'>('single')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    blob?: Blob
    blobs?: { name: string; blob: Blob }[]
    pagesCount: number
    size: number
  } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const parseRanges = (input: string, max: number): number[] => {
    const pages = new Set<number>()
    input.split(',').forEach(part => {
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
        if (!isNaN(n) && n >= 1 && n <= max) {
          pages.add(n)
        }
      }
    })
    return Array.from(pages).sort((a, b) => a - b)
  }

  const selectedPagesList = parseRanges(rangeInput, pageCount)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    try {
      const bytes = await f.arrayBuffer()
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const count = pdf.getPageCount()
      setPageCount(count)
      setRangeInput(count > 1 ? `1-${Math.min(count, 5)}` : '1')
    } catch {
      alert('Could not read PDF. Please check if the document is password-protected or corrupted.')
    }
  }, [])

  const applyPreset = (type: 'all' | 'odd' | 'even' | 'first' | 'last') => {
    if (pageCount === 0) return
    if (type === 'all') {
      setRangeInput(`1-${pageCount}`)
    } else if (type === 'odd') {
      const odds = []
      for (let i = 1; i <= pageCount; i += 2) odds.push(i)
      setRangeInput(odds.join(', '))
    } else if (type === 'even') {
      const evens = []
      for (let i = 2; i <= pageCount; i += 2) evens.push(i)
      setRangeInput(evens.join(', '))
    } else if (type === 'first') {
      setRangeInput('1')
    } else if (type === 'last') {
      setRangeInput(`${pageCount}`)
    }
  }

  const togglePageNumber = (pageNumber: number) => {
    const current = new Set(selectedPagesList)
    if (current.has(pageNumber)) {
      current.delete(pageNumber)
    } else {
      current.add(pageNumber)
    }
    const arr = Array.from(current).sort((a, b) => a - b)
    setRangeInput(arr.join(', '))
  }

  const splitPdf = useCallback(async () => {
    if (!file || isProcessing || pageCount === 0) return
    if (selectedPagesList.length === 0) {
      alert('Please specify at least one valid page to extract.')
      return
    }

    setIsProcessing(true)
    try {
      const bytes = await file.arrayBuffer()
      const srcPdf = await PDFDocument.load(bytes)

      if (splitMode === 'single') {
        // Combined into single PDF
        const newPdf = await PDFDocument.create()
        const copied = await newPdf.copyPages(
          srcPdf,
          selectedPagesList.map(p => p - 1)
        )
        copied.forEach(page => newPdf.addPage(page))
        const newBytes = await newPdf.save()
        const blob = new Blob([newBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

        trackToolUsage({
          toolId: 'pdf-splitter',
          toolName: 'PDF Splitter',
          category: 'pdf',
          action: `Split ${file.name} (mode: combined)`,
          details: `Extracted ${selectedPagesList.length} pages of ${pageCount}`,
          originalSize: file.size,
          compressedSize: newBytes.length,
          method: 'Client PDF-Lib Split',
        })

        setResult({
          blob,
          pagesCount: selectedPagesList.length,
          size: newBytes.length,
        })
      } else {
        // Separate individual PDFs
        const baseName = file.name.replace(/\.pdf$/i, '')
        const separateList: { name: string; blob: Blob }[] = []
        let totalBytesLength = 0

        for (const p of selectedPagesList) {
          const singleDoc = await PDFDocument.create()
          const [copiedPage] = await singleDoc.copyPages(srcPdf, [p - 1])
          singleDoc.addPage(copiedPage)
          const singleBytes = await singleDoc.save()
          totalBytesLength += singleBytes.length
          separateList.push({
            name: `${baseName}_page_${p}.pdf`,
            blob: new Blob([singleBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
          })
        }

        trackToolUsage({
          toolId: 'pdf-splitter',
          toolName: 'PDF Splitter',
          category: 'pdf',
          action: `Split ${file.name} (mode: separate)`,
          details: `Extracted ${separateList.length} individual page files`,
          originalSize: file.size,
          compressedSize: totalBytesLength,
          method: 'Client PDF-Lib Split Separate',
        })

        setResult({
          blobs: separateList,
          pagesCount: separateList.length,
          size: totalBytesLength,
        })
      }
    } catch (err) {
      alert('Failed to split PDF. Please check your file and try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, pageCount, selectedPagesList, splitMode])

  const reset = () => {
    setFile(null)
    setPageCount(0)
    setRangeInput('')
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/pdf-splitter"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/pdf-splitter`,
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

        {/* Hero Section */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="pdf" slug="pdf-splitter" name="PDF Split" icon="✂️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Split PDF Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Extract custom pages or ranges into a new PDF document or download each page separately. 100% private, instant, and loss-free.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Zero Server Uploads
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Exact Page Range Selection
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Lossless Quality
            </span>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".pdf,application/pdf"
              onFiles={handleFile}
              maxSizeMB={100}
              icon="✂️"
              title="Drop your PDF here, or click to browse"
              subtitle="Files are split directly in your browser without uploading to any server"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="pdf-splitter" name="PDF" size="md" />
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

              {/* Extraction Mode */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Output Format Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSplitMode('single')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      splitMode === 'single'
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="text-sm font-semibold flex items-center justify-between">
                      <span>📄 Merge into Single PDF</span>
                      {splitMode === 'single' && <span className="text-primary-600">●</span>}
                    </div>
                    <div className="text-xs text-surface-500 mt-1">
                      Combine all chosen pages into one single extracted document.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMode('separate')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      splitMode === 'separate'
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <div className="text-sm font-semibold flex items-center justify-between">
                      <span>📑 Separate Individual Files</span>
                      {splitMode === 'separate' && <span className="text-primary-600">●</span>}
                    </div>
                    <div className="text-xs text-surface-500 mt-1">
                      Export each selected page as an individual standalone PDF.
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Quick Page Selectors
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    All Pages (1-{pageCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('odd')}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Odd Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('even')}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Even Pages
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('first')}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    First Page Only
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('last')}
                    className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-medium text-surface-700 transition-colors"
                  >
                    Last Page Only
                  </button>
                </div>
              </div>

              {/* Range Input Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Custom Page Range
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={e => setRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-10"
                  className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 text-sm font-medium transition-all"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
                  <span>Enter page numbers and ranges separated by commas (e.g. 1-4, 7, 9)</span>
                  <span className="font-semibold text-primary-600">
                    {selectedPagesList.length} of {pageCount} pages selected
                  </span>
                </div>
              </div>

              {/* Visual Page Chips (for docs up to 60 pages) */}
              {pageCount > 0 && pageCount <= 60 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                    Click to Toggle Pages
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-surface-50 rounded-xl border border-surface-200">
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(p => {
                      const isSelected = selectedPagesList.includes(p)
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => togglePageNumber(p)}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'bg-surface-200/80 text-surface-600 hover:bg-surface-300'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Split Action Button */}
              <button
                onClick={splitPdf}
                disabled={isProcessing || selectedPagesList.length === 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Extracting Pages...
                  </span>
                ) : (
                  `✂️ Split & Extract ${selectedPagesList.length} ${
                    selectedPagesList.length === 1 ? 'Page' : 'Pages'
                  }`
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
              PDF Pages Extracted Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              {splitMode === 'single'
                ? `Extracted ${result.pagesCount} pages into a single document.`
                : `Generated ${result.pagesCount} individual PDF documents.`}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">
                  {splitMode === 'single' ? 'Extracted Pages' : 'Files Created'}
                </div>
                <div className="text-xl font-bold text-surface-900">{result.pagesCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Total Size</div>
                <div className="text-xl font-bold text-surface-900">{formatFileSize(result.size)}</div>
              </div>
            </div>

            {/* Downloads */}
            {result.blob && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  onClick={() =>
                    downloadBlob(
                      result.blob!,
                      `split_${file?.name.replace(/\.pdf$/i, '') || 'extracted'}.pdf`
                    )
                  }
                  className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
                >
                  📥 Download Extracted PDF
                </button>
                <button
                  onClick={reset}
                  className="btn-secondary w-full py-4 text-base font-semibold"
                >
                  🔄 Split Another File
                </button>
              </div>
            )}

            {result.blobs && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-surface-50 rounded-xl border border-surface-200 text-left">
                  {result.blobs.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-surface-200 text-xs"
                    >
                      <span className="font-semibold text-surface-800 truncate max-w-[200px]">
                        {item.name}
                      </span>
                      <button
                        onClick={() => downloadBlob(item.blob, item.name)}
                        className="text-primary-600 hover:text-primary-700 font-bold px-2 py-1 rounded bg-primary-50 hover:bg-primary-100 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      result.blobs?.forEach((item, i) => {
                        setTimeout(() => downloadBlob(item.blob, item.name), i * 300)
                      })
                    }}
                    className="btn-success w-full py-3 text-sm font-bold"
                  >
                    📥 Download All ({result.blobs.length} Files)
                  </button>
                  <button onClick={reset} className="btn-secondary w-full py-3 text-sm font-semibold">
                    🔄 Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informational Section */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Extract and Split PDF Pages Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to pull a 3-page appendix out of an 80-page presentation or extract just page 1 of an agreement? PDFCompress Pro lets you define custom page ranges (like <code>1-3, 5, 8-12</code>) or use convenient quick selectors for odd and even pages.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Choose whether to merge those extracted pages into one clean document or download each individual page as its own standalone file. All processing is 100% private and happens directly inside your web browser.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="pdf-splitter" />
      </div>
    </div>
  )
}
