import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
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

const tool = getToolBySlug('pdf-to-jpg') || {
  slug: 'pdf-to-jpg',
  name: 'PDF to JPG Converter',
  shortName: 'PDF to JPG',
  description: 'Convert PDF pages to high-resolution JPG or PNG images directly in your browser. 100% free, private, and supports up to 300 DPI print quality.',
  metaTitle: 'PDF to JPG Converter Online Free — High Quality 300 DPI Images',
  metaDescription: 'Convert PDF to JPG online for free. Render pages into high-resolution JPG or PNG pictures at up to 300 DPI. 100% secure with zero file uploads.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['pdf to jpg', 'convert pdf to jpg', 'pdf to image', 'pdf to png', 'extract images from pdf'],
  icon: '📄',
}

const faqItems = [
  {
    question: 'How are the PDF pages converted into JPG images?',
    answer: 'Each PDF page is rendered using PDF.js onto an HTML5 Canvas at your chosen DPI resolution, then encoded into high-quality JPEG or PNG image bytes.',
  },
  {
    question: 'Which DPI setting should I choose?',
    answer: 'Standard (72 DPI) is great for quick online sharing or emails. High (150 DPI) is best for web presentations, and Ultra (300 DPI) produces crisp print-ready photos where small text remains sharp.',
  },
  {
    question: 'Can I download all converted pages at once?',
    answer: 'Yes! Click the "Download All Pages" button, and your browser will save each page sequentially to your downloads folder.',
  },
  {
    question: 'Are my confidential documents uploaded to any server?',
    answer: 'No. All rendering and image encoding happen directly on your device inside your web browser memory. Your documents never touch external servers.',
  },
]

interface ConvertedPage {
  blob: Blob
  url: string
  name: string
  pageNumber: number
  width: number
  height: number
  size: number
}

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg')
  const [dpi, setDpi] = useState<number>(2.0) // scale factor
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pages, setPages] = useState<ConvertedPage[]>([])
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (pages.length > 0) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [pages])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setPages([])
    setProgress(0)
  }, [])

  const convertPdfToJpg = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    setPages([])
    setProgress(5)

    try {
      const bytes = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: bytes })
      const pdf = await loadingTask.promise
      const totalPages = pdf.numPages
      const results: ConvertedPage[] = []

      const ext = format === 'image/png' ? 'png' : 'jpg'
      const mime = format === 'image/png' ? 'image/png' : 'image/jpeg'

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: dpi })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!

        await (page.render as any)({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            b => (b ? resolve(b) : reject(new Error('Canvas encoding failed'))),
            mime,
            0.92
          )
        })

        const url = URL.createObjectURL(blob)
        const baseName = file.name.replace(/\.pdf$/i, '')

        results.push({
          blob,
          url,
          name: `${baseName}_page_${i}.${ext}`,
          pageNumber: i,
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
          size: blob.size,
        })

        setProgress(Math.round(5 + (i / totalPages) * 95))
      }

      trackToolUsage({
        toolId: 'pdf-to-jpg',
        toolName: 'PDF to JPG Converter',
        category: 'pdf',
        action: `Converted ${file.name} to ${results.length} images`,
        details: `Scale: ${dpi}x, Format: ${ext.toUpperCase()}`,
        originalSize: file.size,
        compressedSize: results.reduce((acc, curr) => acc + curr.size, 0),
        method: 'Client PDF.js High-DPI Renderer',
      })

      setPages(results)
    } catch (err) {
      alert('Failed to convert PDF. Please ensure the document is not password-protected.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, dpi, format])

  const downloadAll = () => {
    pages.forEach((p, idx) => {
      setTimeout(() => {
        downloadBlob(p.blob, p.name)
      }, idx * 300)
    })
  }

  const reset = () => {
    pages.forEach(p => URL.revokeObjectURL(p.url))
    setFile(null)
    setPages([])
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/pdf-to-jpg"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/pdf-to-jpg`,
          applicationCategory: 'MultimediaApplication',
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
          <ToolVisualBadge category="pdf" slug="pdf-to-jpg" name="PDF to JPG" icon="📄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            PDF to JPG Converter Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert every page of your PDF into high-definition JPG or PNG pictures. Customize output DPI up to 300 DPI for ultra-crisp print quality. 100% private in-browser rendering.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Up to 300 DPI Print Clarity
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private In-Browser
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Sequential Batch Download
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
              title="Drop your PDF here to convert to JPG, or click to browse"
              subtitle="Renders pages directly on your device memory without remote uploads"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="pdf-to-jpg" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Rendering Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-surface-50 border border-surface-200">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5">
                    Image Quality / Resolution
                  </label>
                  <select
                    value={dpi}
                    onChange={e => setDpi(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-300 text-xs font-semibold bg-white"
                  >
                    <option value={1.2}>Standard Web (72 DPI) — Smallest Size</option>
                    <option value={2.0}>High Quality (150 DPI) — Recommended</option>
                    <option value={3.5}>Ultra Print Sharp (300 DPI) — Maximum Detail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1.5">
                    Output Format
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('image/jpeg')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        format === 'image/jpeg'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-surface-200 text-surface-700'
                      }`}
                    >
                      JPG (Photos & Documents)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('image/png')}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        format === 'image/png'
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-surface-200 text-surface-700'
                      }`}
                    >
                      PNG (Lossless Graphics)
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar (if processing) */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-surface-700">
                    <span>Rendering PDF Pages...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {pages.length === 0 && (
                <button
                  onClick={convertPdfToJpg}
                  disabled={isProcessing}
                  className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  {isProcessing ? '⏳ Converting Pages...' : '🖼️ Convert PDF to JPG Images'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        {pages.length > 0 && (
          <div ref={resultRef} className="card-premium p-6 sm:p-10 mb-8 border-2 border-emerald-500/30 scroll-mt-24">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-surface-900 mb-2">
                Converted {pages.length} {pages.length === 1 ? 'Page' : 'Pages'} to Images!
              </h3>
              <p className="text-sm text-surface-500">
                Total size: {formatFileSize(pages.reduce((acc, curr) => acc + curr.size, 0))}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto mb-8">
              <button
                onClick={downloadAll}
                className="btn-success w-full py-3.5 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download All ({pages.length} Images)
              </button>
              <button onClick={reset} className="btn-secondary w-full py-3.5 text-base font-semibold">
                🔄 Convert Another PDF
              </button>
            </div>

            {/* Page Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pages.map(p => (
                <div
                  key={p.pageNumber}
                  className="p-3 bg-surface-50 rounded-2xl border border-surface-200 flex flex-col justify-between"
                >
                  <div className="relative overflow-hidden rounded-xl bg-white border border-surface-200 aspect-3/4 mb-3">
                    <img
                      src={p.url}
                      alt={`Page ${p.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                      Page {p.pageNumber}
                    </span>
                  </div>

                  <div className="text-left text-xs mb-3">
                    <p className="font-semibold text-surface-900 truncate">{p.name}</p>
                    <p className="text-surface-500 text-[10px]">
                      {p.width} × {p.height} px • {formatFileSize(p.size)}
                    </p>
                  </div>

                  <button
                    onClick={() => downloadBlob(p.blob, p.name)}
                    className="w-full py-2 rounded-lg bg-white border border-surface-200 hover:border-primary-400 hover:bg-primary-50 text-primary-700 text-xs font-bold transition-colors"
                  >
                    Download Page {p.pageNumber}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Convert PDF Pages to JPG Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to extract pictures or pages from a PDF to post onto social media, insert into a presentation, or send via messaging apps? PDFCompress Pro transforms every page into a crisp, high-resolution JPEG or PNG file.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Unlike other conversion sites that degrade image quality, our engine lets you select up to 300 DPI ultra-high definition rendering. All computation runs inside your web browser without uploading your sensitive files.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="pdf-to-jpg" />
      </div>
    </div>
  )
}
