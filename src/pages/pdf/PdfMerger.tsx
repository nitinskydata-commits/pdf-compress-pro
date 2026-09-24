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

const tool = getToolBySlug('pdf-merger') || {
  slug: 'pdf-merger',
  name: 'Merge PDF Online',
  shortName: 'Merge PDF',
  description: 'Combine multiple PDF files into a single organized document in seconds. 100% free, private browser-based processing with zero server uploads.',
  metaTitle: 'Merge PDF Online Free — Combine Multiple PDF Files Instantly',
  metaDescription: 'Merge PDF files online for free. Combine multiple PDFs into one document directly in your browser. Fast, 100% secure, and preserves original quality.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['merge pdf', 'combine pdf', 'join pdf files', 'merge pdf online free', 'pdf joiner'],
  icon: '📑',
}

const faqItems = [
  {
    question: 'How many PDF files can I merge together?',
    answer: 'There is no strict limit! You can merge as many PDF files as your computer memory can handle. Whether you need to join 2 documents or 50 invoices, the browser handles it smoothly.',
  },
  {
    question: 'Is my data secure when merging PDFs?',
    answer: 'Yes, 100% secure. All PDF processing executes strictly inside your browser using pdf-lib. Your documents are never uploaded to any remote server or cloud storage.',
  },
  {
    question: 'Can I change the order of the merged PDF pages?',
    answer: 'Yes! Use the Up (↑) and Down (↓) buttons on each file card to arrange the documents in the exact order you want them to appear in the combined PDF.',
  },
  {
    question: 'Does merging reduce document quality or remove bookmarks?',
    answer: 'No. Merging copies the exact vector streams, fonts, and images from each source page without re-encoding or compressing them. The quality remains identical to the original files.',
  },
]

interface MergedFileInfo {
  file: File
  pageCount?: number
}

export default function PdfMerger() {
  const [fileList, setFileList] = useState<MergedFileInfo[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; pageCount: number; size: number } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  // Extract page count asynchronously for each file
  const inspectFilePages = async (file: File): Promise<number> => {
    try {
      const buffer = await file.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      return doc.getPageCount()
    } catch {
      return 1
    }
  }

  const addFiles = useCallback(async (newFiles: File[]) => {
    const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length === 0) return

    // Immediately add files with undefined page count
    const initialItems: MergedFileInfo[] = pdfs.map(f => ({ file: f }))
    setFileList(prev => [...prev, ...initialItems])
    setResult(null)

    // Then resolve page counts asynchronously
    for (const file of pdfs) {
      const pages = await inspectFilePages(file)
      setFileList(prev =>
        prev.map(item => (item.file === file ? { ...item, pageCount: pages } : item))
      )
    }
  }, [])

  const removeFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index))
  }

  const moveFile = (from: number, to: number) => {
    setFileList(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const clearAll = () => {
    setFileList([])
    setResult(null)
  }

  const totalPages = fileList.reduce((sum, item) => sum + (item.pageCount || 1), 0)
  const totalOriginalSize = fileList.reduce((sum, item) => sum + item.file.size, 0)

  const mergePdfs = useCallback(async () => {
    if (fileList.length < 2 || isProcessing) return
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const item of fileList) {
        const bytes = await item.file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }

      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'pdf-merger',
        toolName: 'PDF Merger',
        category: 'pdf',
        action: `Merged ${fileList.length} PDF files`,
        details: `${mergedPdf.getPageCount()} total pages (${formatFileSize(mergedBytes.length)})`,
        compressedSize: mergedBytes.length,
        method: 'Client PDF-Lib Merge',
      })

      setResult({
        blob,
        pageCount: mergedPdf.getPageCount(),
        size: mergedBytes.length,
      })
    } catch (err) {
      alert('Failed to merge PDFs. Please ensure all files are valid, uncorrupted PDFs.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [fileList, isProcessing])

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/pdf-merger"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/pdf-merger`,
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
          <ToolVisualBadge category="pdf" slug="pdf-merger" name="PDF Merge" icon="📑" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Merge PDF Files Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Combine multiple PDF files into one clean document in your browser. Reorder files freely, preview page counts, and download instantly without quality loss.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Client-Side Privacy
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Original Vector Quality
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Unlimited Documents
            </span>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          <FileUploader
            accept=".pdf,application/pdf"
            multiple
            onFiles={addFiles}
            maxSizeMB={100}
            icon="📑"
            title="Drop multiple PDF files here, or click to browse"
            subtitle="Select 2 or more PDFs to combine • Processed securely in your browser"
          />

          {fileList.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-surface-900 text-base">
                    Documents to Merge ({fileList.length})
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                    ~{totalPages} Total Pages
                  </span>
                  <span className="text-xs text-surface-400">
                    ({formatFileSize(totalOriginalSize)})
                  </span>
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-danger-600 hover:text-danger-700 font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Reorderable File List */}
              <div className="space-y-2.5">
                {fileList.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="p-3.5 bg-surface-50 hover:bg-surface-100/80 rounded-xl border border-surface-200 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-surface-200 text-surface-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <ToolVisualBadge category="pdf" slug="pdf-merger" name="PDF" size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                          {item.file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-surface-500">
                          <span>{formatFileSize(item.file.size)}</span>
                          <span>•</span>
                          <span className="font-medium text-surface-700">
                            {item.pageCount ? `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}` : 'Analyzing...'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => moveFile(idx, idx - 1)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="w-8 h-8 rounded-lg bg-surface-200/80 hover:bg-surface-300 disabled:opacity-30 disabled:pointer-events-none text-surface-700 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFile(idx, idx + 1)}
                        disabled={idx === fileList.length - 1}
                        title="Move Down"
                        className="w-8 h-8 rounded-lg bg-surface-200/80 hover:bg-surface-300 disabled:opacity-30 disabled:pointer-events-none text-surface-700 font-bold text-xs flex items-center justify-center transition-colors"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeFile(idx)}
                        title="Remove"
                        className="w-8 h-8 rounded-lg bg-danger-50 hover:bg-danger-100 text-danger-600 font-bold text-xs flex items-center justify-center transition-colors ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={mergePdfs}
                  disabled={fileList.length < 2 || isProcessing}
                  className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Combining Documents...
                    </span>
                  ) : fileList.length < 2 ? (
                    'Add at least 2 PDF files to merge'
                  ) : (
                    `📑 Merge ${fileList.length} PDFs into One Document`
                  )}
                </button>
              </div>
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
              PDFs Combined Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Your new combined document is ready. All pages have been merged in your designated order.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Total Pages</div>
                <div className="text-xl font-bold text-surface-900">{result.pageCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="text-xs text-surface-500 mb-1">Combined Size</div>
                <div className="text-xl font-bold text-surface-900">{formatFileSize(result.size)}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() => downloadBlob(result.blob, 'combined-document.pdf')}
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Merged PDF
              </button>
              <button
                onClick={clearAll}
                className="btn-secondary w-full py-4 text-base font-semibold"
              >
                🔄 Merge More Files
              </button>
            </div>
          </div>
        )}

        {/* Informational SEO Guide */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Combine Multiple PDF Files Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Combining PDF documents with PDFCompress Pro is fast, completely private, and effortless. Simply upload two or more PDF files into the dropzone. Arrange them using the intuitive Up and Down controls to match your desired reading order.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Once you click "Merge", our in-browser engine uses WebAssembly and <code>pdf-lib</code> to stitch each PDF page directly in your browser memory. Unlike other converters that upload your confidential contracts, medical records, or tax returns to remote cloud servers, PDFCompress Pro never transmits your documents over the internet.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="pdf-merger" />
      </div>
    </div>
  )
}
