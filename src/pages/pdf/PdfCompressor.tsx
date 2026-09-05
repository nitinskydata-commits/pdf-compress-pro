import { useState, useCallback } from 'react'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'

const tool = getToolBySlug('pdf-compressor')!

type CompressionLevel = 'low' | 'medium' | 'high' | 'extreme'

const levels: { id: CompressionLevel; label: string; badge: string; desc: string; dpi: string; color: string }[] = [
  { id: 'low', label: '🟢 Low', badge: 'High Quality', desc: 'Minimal compression. Preserves high-res scans and photos.', dpi: '200+ DPI • Q 85%', color: 'border-green-300 bg-green-50' },
  { id: 'medium', label: '🟡 Medium', badge: 'Recommended', desc: 'Balanced reduction for resumes, legal docs, and sharing.', dpi: '150 DPI • Sharp Text', color: 'border-yellow-300 bg-yellow-50' },
  { id: 'high', label: '🔴 High', badge: 'Strong', desc: 'Strong compression for email attachments and web uploads.', dpi: '110 DPI • Readable', color: 'border-red-300 bg-red-50' },
  { id: 'extreme', label: '⚫ Extreme', badge: 'Smallest', desc: 'Maximum reduction for strict portal limits (< 1MB).', dpi: '75 DPI • Max Compact', color: 'border-gray-300 bg-gray-50' },
]

const faqItems = [
  { question: 'How do I compress a PDF online?', answer: 'Upload your PDF file, choose a compression level (Low, Medium, High, or Extreme), and click Compress. Your optimized PDF is ready to download in seconds.' },
  { question: 'Which PDF files compress the most?', answer: 'Scanned PDFs, photo-heavy portfolios, and presentation decks compress the most (often 60%–80%) because their embedded high-resolution images can be downsampled efficiently.' },
  { question: 'Will compressing my PDF make text blurry?', answer: 'No. PDFCompress Pro retains vector fonts and typography intact. Only embedded images are calibrated to target DPI, ensuring text remains sharp on all screens.' },
  { question: 'Are my files safe and private?', answer: 'Yes. Documents are processed in isolated temporary memory and permanently deleted immediately after processing. We never store, inspect, or share your files.' },
  { question: 'Can I compress PDFs on my phone?', answer: 'Yes! Works seamlessly on Android (Chrome) and iOS (Safari). Compressed PDFs open natively on mobile devices.' },
  { question: 'What is the maximum file size?', answer: 'You can upload PDF files up to 50MB. For larger files, consider splitting them first using our PDF Splitter tool.' },
]

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : (import.meta.env.VITE_BACKEND_URL || 'https://pdf-compress-backend.onrender.com/api')

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [level, setLevel] = useState<CompressionLevel>('medium')
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; compressedSize: number; reduction: string; message: string; optimized: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!isPDF) { alert('Please select a valid PDF file.'); return }
    setFile(f)
    setResult(null)
    setError(null)
  }, [])

  const startDynamicProgress = useCallback(() => {
    let pct = 15
    const interval = setInterval(() => {
      if (pct < 95) {
        const step = Math.max(0.18, (95 - pct) * 0.038)
        pct = Math.min(95, pct + step)
        setProgress(Math.round(pct))
        if (pct < 35) setProgressMsg('Uploading to secure engine (SSL)...')
        else if (pct < 55) setProgressMsg('Downsampling images & bicubic resampling...')
        else if (pct < 75) setProgressMsg('Subsetting fonts & compressing streams...')
        else if (pct < 88) setProgressMsg('Ghostscript distillation & linearization...')
        else setProgressMsg('Finalizing compressed PDF...')
      }
    }, 220)
    return interval
  }, [])

  const compress = useCallback(async () => {
    if (!file || isCompressing) return
    setIsCompressing(true)
    setError(null)
    setProgress(10)
    setProgressMsg('Analyzing PDF structure...')

    const timer = startDynamicProgress()

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('level', level)

      const response = await fetch(`${API_URL}/compress`, { method: 'POST', body: formData })

      clearInterval(timer)

      if (!response.ok) {
        let msg = 'Compression failed.'
        try { const d = await response.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }

      setProgress(98)
      setProgressMsg('Validating output integrity...')

      const blob = await response.blob()
      const originalSize = Number(response.headers.get('X-Compression-Original-Size')) || file.size
      const compressedSize = Number(response.headers.get('X-Compression-Compressed-Size')) || blob.size
      const reduction = response.headers.get('X-Compression-Reduction') || '0.0'
      const optimized = response.headers.get('X-Compression-Optimized') === 'true'
      const message = decodeURIComponent(response.headers.get('X-Compression-Message') || 'PDF processed successfully.')

      setProgress(100)
      setProgressMsg('✨ Compression complete!')
      await new Promise(r => setTimeout(r, 400))

      setResult({ blob, originalSize, compressedSize, reduction, message, optimized })
    } catch (err: unknown) {
      clearInterval(timer)
      const msg = err instanceof Error ? err.message : 'Compression failed.'
      setError(msg.includes('fetch') ? 'Connecting to backend engine... Please try again in a few seconds.' : msg)
    } finally {
      clearInterval(timer)
      setIsCompressing(false)
    }
  }, [file, level, isCompressing, startDynamicProgress])

  const reset = () => { setFile(null); setResult(null); setError(null); setProgress(0) }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org', '@type': 'WebApplication',
          name: `${tool.name} — PDFCompress Pro`, url: `${SITE_URL}/${tool.slug}`,
          description: tool.metaDescription, applicationCategory: 'BusinessApplication',
          operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span>
      </nav>

      <div className="tool-layout">
        {/* Main Tool Area */}
        <div>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
            <p className="text-surface-500">{tool.description}</p>
          </div>

          {/* Step 1: Upload */}
          {!file && !result && (
            <FileUploader accept=".pdf" onFiles={handleFile} icon="📄📦" title="Drag & Drop your PDF here, or click to browse" />
          )}

          {/* Step 2: File info + Level selection */}
          {file && !result && !isCompressing && (
            <div className="space-y-6">
              <div className="card-premium p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-surface-800">{file.name}</p>
                  <p className="text-sm text-surface-500">Original: {formatFileSize(file.size)}</p>
                </div>
                <button onClick={reset} className="text-sm text-danger-500 hover:underline">Remove</button>
              </div>

              <div className="card-premium p-6">
                <h3 className="font-bold text-surface-800 mb-1">Select Compression Level</h3>
                <p className="text-sm text-surface-500 mb-4">Choose the balance between visual quality and file size reduction:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {levels.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`level-card text-left ${level === l.id ? 'active' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-surface-800">{l.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${l.id === 'medium' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'}`}>
                          {l.badge}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 mb-1">{l.desc}</p>
                      <span className="text-xs font-medium text-surface-400">{l.dpi}</span>
                    </button>
                  ))}
                </div>
                <button onClick={compress} className="btn-primary w-full mt-6 text-base py-4">
                  ⚡ Compress PDF Now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Progress */}
          {isCompressing && (
            <div className="card-premium p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full" style={{ animation: 'spin-slow 1s linear infinite' }} />
              </div>
              <div className="progress-track mb-4">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm font-medium text-surface-600">{progress}% — {progressMsg}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card-premium p-6 border-danger-200 bg-danger-50/50">
              <p className="text-danger-500 font-semibold mb-2">❌ Error</p>
              <p className="text-sm text-surface-600">{error}</p>
              <button onClick={reset} className="btn-secondary mt-4">Try Again</button>
            </div>
          )}

          {/* Step 4: Result */}
          {result && (
            <div className="card-premium p-8 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-surface-800 mb-2">Compression Complete!</h3>
              <p className="text-surface-500 text-sm mb-6">{result.message}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="result-card">
                  <div className="text-xs text-surface-500 mb-1">Original</div>
                  <div className="font-bold text-surface-800">{formatFileSize(result.originalSize)}</div>
                </div>
                <div className="result-card">
                  <div className="text-xs text-surface-500 mb-1">Compressed</div>
                  <div className="font-bold text-surface-800">{formatFileSize(result.compressedSize)}</div>
                </div>
                <div className="result-card highlight">
                  <div className="text-xs text-surface-500 mb-1">Saved</div>
                  <div className="font-bold text-success-600">{result.reduction}%</div>
                </div>
              </div>

              <button onClick={() => downloadBlob(result.blob, `compressed_${file!.name}`)} className="btn-success w-full text-base py-4 mb-3">
                📥 Download Compressed PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full">🔄 Compress Another PDF</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="card-premium p-5">
            <h4 className="font-bold text-surface-800 mb-3">💡 Optimization Tips</h4>
            <ul className="space-y-2 text-sm text-surface-600">
              <li>• <strong>Medium</strong> is ideal for 90% of documents</li>
              <li>• Scanned PDFs yield 60–80% reduction</li>
              <li>• Text stays sharp — never rasterized</li>
              <li>• Files auto-deleted after processing</li>
              <li>• Works on iOS & Android natively</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Educational Content */}
      <section className="content-section mt-8">
        <h2>How PDF Compression Works</h2>
        <p>A PDF file combines vector typography, structural dictionaries, and bitmap imagery. Over time, documents accumulate uncompressed objects, redundant font libraries, and high-DPI photos that inflate file size.</p>
        <p>PDFCompress Pro applies a multi-stage pipeline: <strong>font subsetting</strong> removes unused characters, <strong>calibrated image resampling</strong> downsamples photos to optimal DPI, and <strong>stream compression</strong> compacts dictionary objects using Flate encoding.</p>
        <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
          <p className="text-sm text-primary-800"><strong>Vector Text Preservation:</strong> Unlike basic tools that rasterize entire pages, we preserve vector text and fonts as scalable typography — your text remains selectable, searchable, and crisp on Retina displays.</p>
        </div>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="pdf-compressor" />
    </div>
  )
}
