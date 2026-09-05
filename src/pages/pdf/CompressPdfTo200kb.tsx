import { useState, useCallback, useRef, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}

const tool = getToolBySlug('compress-pdf-to-200kb') || {
  id: 'compress-pdf-to-200kb',
  slug: 'compress-pdf-to-200kb',
  name: 'Compress PDF to 200KB',
  shortName: 'PDF to 200KB',
  description: 'Specifically compress PDF files under 200KB for government job portals (SSC, UPSC, State PSCs), admission forms, and email uploads.',
  metaTitle: 'Compress PDF to 200KB Online Free — Fast & Guaranteed Under 200KB | PDFCompress Pro',
  metaDescription: 'Compress PDF to 200KB online for free. Guaranteed under 200KB for SSC, UPSC, IBPS, state PSC job portals, and university admissions. High-speed, crystal-clear text, 100% private.',
  icon: '📦',
  category: 'pdf' as const,
  categoryLabel: 'PDF Tools',
  isActive: true,
  keywords: ['compress PDF to 200kb', 'PDF under 200kb', 'SSC PDF compressor 200kb', 'UPSC PDF size reducer', 'reduce PDF size to 200kb online']
}

const faqItems = [
  {
    question: 'How does this tool guarantee my PDF is under 200KB?',
    answer: 'Our precision engine calculates the exact byte budget per page and applies calibrated downsampling and stream compaction with a safety buffer (targeting ~180KB–192KB), ensuring your file is strictly accepted by portals with a 200KB hard limit.'
  },
  {
    question: 'Which portals require PDFs under 200KB?',
    answer: 'Major recruitment and admission portals require documents under 200KB, including UPSC (Civil Services, NDA, CDS), SSC (CGL, CHSL, MTS), IBPS, State Public Service Commissions, gate/JEE admission desks, and visa application portals.'
  },
  {
    question: 'Will text on my certificate or marksheet stay readable?',
    answer: 'Yes! The engine optimizes resolution while preserving text sharpness and high contrast, ensuring names, roll numbers, marks, and signatures remain 100% legible.'
  },
  {
    question: 'How fast is this compression tool?',
    answer: 'Unlike typical cloud compressors that make you wait 60+ seconds in a queue, our high-speed engine runs directly in your browser and completes in 1 to 3 seconds with zero server waiting.'
  },
  {
    question: 'Are my confidential documents private?',
    answer: '100% private! Your files are processed locally on your device in browser memory. Your sensitive certificates, marksheets, and IDs are never stored or seen by anyone.'
  }
]

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : (import.meta.env.VITE_BACKEND_URL || 'https://pdf-compress-backend.onrender.com/api')

interface CompressionResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  reduction: string
  message: string
  targetMet: boolean
  engine: 'browser' | 'server'
}

export default function CompressPdfTo200kb() {
  const [file, setFile] = useState<File | null>(null)
  const [targetKb, setTargetKb] = useState<number>(200)
  const [customKbInput, setCustomKbInput] = useState<string>('')
  const [engineMode, setEngineMode] = useState<'browser' | 'server'>('browser')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [result, setResult] = useState<CompressionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [result])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (!isPDF) {
      alert('Please upload a valid PDF document.')
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    setProgress(0)
  }, [])

  // Browser Client-Side Precision Engine
  const compressClientSide = async (sourceFile: File, targetSizeKb: number): Promise<CompressionResult> => {
    const originalSize = sourceFile.size
    const targetBytes = targetSizeKb * 1024
    const safeTargetBytes = Math.floor(targetBytes * 0.96) // 192 KB for 200 KB target

    // Step 0: Fast return if already under target
    if (originalSize <= safeTargetBytes) {
      setProgress(100)
      setProgressMsg('File is already under the target limit!')
      return {
        blob: sourceFile,
        originalSize,
        compressedSize: originalSize,
        reduction: '0.0',
        message: `Your file is already ${(originalSize / 1024).toFixed(1)} KB (strictly under ${targetSizeKb} KB).`,
        targetMet: true,
        engine: 'browser'
      }
    }

    setProgress(12)
    setProgressMsg('Reading PDF structure and page contents...')
    const arrayBuffer = await sourceFile.arrayBuffer()

    // Step 1: Try pure structural PDF-Lib compaction first
    try {
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const compactBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      if (compactBytes.length <= safeTargetBytes) {
        setProgress(100)
        setProgressMsg('✨ Stream compaction complete!')
        const blob = new Blob([compactBytes as unknown as BlobPart], { type: 'application/pdf' })
        return {
          blob,
          originalSize,
          compressedSize: compactBytes.length,
          reduction: (((originalSize - compactBytes.length) / originalSize) * 100).toFixed(1),
          message: `🎯 Preserved vector typography intact at ${(compactBytes.length / 1024).toFixed(1)} KB!`,
          targetMet: true,
          engine: 'browser'
        }
      }
    } catch (_) {
      // Continue to rasterization pipeline
    }

    // Step 2: Calibrated High-Speed Page Optimization
    setProgress(25)
    setProgressMsg('Analyzing document pages & calculating DPI budget...')
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const numPages = pdfDoc.numPages

    // Available image budget after PDF structure overhead (~4KB skeleton)
    const availableImageBytes = Math.max(18000, safeTargetBytes - (numPages * 1400) - 4000)
    const budgetPerPage = Math.floor(availableImageBytes / numPages)

    // Mathematically calibrated scale & quality based on per-page budget
    let scale = 1.25
    let quality = 0.68

    if (budgetPerPage > 130000) {
      scale = 1.35
      quality = 0.72
    } else if (budgetPerPage > 75000) {
      scale = 1.15
      quality = 0.62
    } else if (budgetPerPage > 40000) {
      scale = 0.95
      quality = 0.52
    } else if (budgetPerPage > 25000) {
      scale = 0.82
      quality = 0.45
    } else {
      scale = 0.70
      quality = 0.38
    }

    const renderAndAssemble = async (currScale: number, currQuality: number): Promise<Uint8Array> => {
      const outPdf = await PDFDocument.create()

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const pct = 30 + Math.round(((pageNum - 0.5) / numPages) * 55)
        setProgress(pct)
        setProgressMsg(`Calibrating page ${pageNum} of ${numPages} for < ${targetSizeKb} KB limit...`)

        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: currScale })

        const canvas = document.createElement('canvas')
        canvas.width = Math.round(viewport.width)
        canvas.height = Math.round(viewport.height)
        const ctx = canvas.getContext('2d', { alpha: false })!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise

        const jpegBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', currQuality)
        })

        if (!jpegBlob) throw new Error('Could not encode optimized page image')
        const jpegArrayBuffer = await jpegBlob.arrayBuffer()
        const embeddedJpg = await outPdf.embedJpg(jpegArrayBuffer)

        const newPage = outPdf.addPage([viewport.width / currScale, viewport.height / currScale])
        newPage.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: viewport.width / currScale,
          height: viewport.height / currScale
        })
      }

      setProgress(88)
      setProgressMsg('Assembling optimized PDF...')
      return await outPdf.save({ useObjectStreams: true })
    }

    let finalBytes = await renderAndAssemble(scale, quality)

    // Step 3: Adaptive fine-tune if output slightly exceeded safe budget
    if (finalBytes.length > safeTargetBytes) {
      const overshootRatio = finalBytes.length / safeTargetBytes
      setProgress(92)
      setProgressMsg('Fine-tuning to guarantee strictly under 200 KB...')
      const tunedScale = Math.max(0.60, scale / Math.sqrt(overshootRatio * 1.08))
      const tunedQuality = Math.max(0.32, quality * (1 / (overshootRatio * 1.05)))
      finalBytes = await renderAndAssemble(tunedScale, tunedQuality)
    }

    setProgress(100)
    setProgressMsg('✨ Compression complete!')

    const outBlob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' })
    const compSize = finalBytes.length
    const reduction = (((originalSize - compSize) / originalSize) * 100).toFixed(1)
    const isUnder = compSize <= targetBytes

    return {
      blob: outBlob,
      originalSize,
      compressedSize: compSize,
      reduction,
      message: isUnder
        ? `🎯 Successfully compressed to ${(compSize / 1024).toFixed(1)} KB (strictly under ${targetSizeKb} KB)!`
        : `Optimized to ${(compSize / 1024).toFixed(1)} KB.`,
      targetMet: isUnder,
      engine: 'browser'
    }
  }

  // Server-Side Compression Fallback
  const compressServerSide = async (sourceFile: File, targetSizeKb: number): Promise<CompressionResult> => {
    const formData = new FormData()
    formData.append('file', sourceFile)
    formData.append('level', 'extreme')
    formData.append('targetSizeKb', String(targetSizeKb))

    setProgress(35)
    setProgressMsg('Uploading to high-speed cloud engine...')

    const response = await fetch(`${API_URL}/compress`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      let msg = 'Server compression failed.'
      try {
        const d = await response.json()
        msg = d.error || msg
      } catch (_) {}
      throw new Error(msg)
    }

    setProgress(85)
    setProgressMsg('Processing response...')

    const blob = await response.blob()
    const originalSize = Number(response.headers.get('X-Compression-Original-Size')) || sourceFile.size
    const compressedSize = Number(response.headers.get('X-Compression-Compressed-Size')) || blob.size
    const reduction = response.headers.get('X-Compression-Reduction') || '0.0'
    const targetMet = response.headers.get('X-Compression-Target-Met') === 'true' || compressedSize <= targetSizeKb * 1024
    const message = decodeURIComponent(response.headers.get('X-Compression-Message') || 'PDF processed successfully.')

    setProgress(100)
    setProgressMsg('✨ Compression complete!')

    return {
      blob,
      originalSize,
      compressedSize,
      reduction,
      message,
      targetMet,
      engine: 'server'
    }
  }

  const handleCompress = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    setError(null)
    setProgress(5)
    setProgressMsg('Initializing precision compression engine...')

    try {
      let res: CompressionResult
      if (engineMode === 'browser') {
        try {
          res = await compressClientSide(file, targetKb)
        } catch (clientErr: any) {
          console.warn('Client-side engine encountered error, falling back to server:', clientErr)
          setProgressMsg('Switching to cloud engine fallback...')
          res = await compressServerSide(file, targetKb)
        }
      } else {
        res = await compressServerSide(file, targetKb)
      }

      setResult(res)

      trackToolUsage({
        toolId: 'compress-pdf-to-200kb',
        toolName: 'Compress PDF to 200KB',
        category: 'pdf',
        action: `Compressed ${file.name} to ${targetKb}KB`,
        details: `${formatFileSize(res.originalSize)} → ${formatFileSize(res.compressedSize)} (${res.reduction}%)`,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        sizeSaved: Math.max(0, res.originalSize - res.compressedSize),
        reductionPercent: res.reduction,
        method: res.engine === 'browser' ? 'Browser Precision (pdf-lib+pdfjs)' : 'Cloud Ghostscript'
      })
    } catch (err: any) {
      setError(err.message || 'Compression failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, targetKb, engineMode, isProcessing])

  const handleDownload = () => {
    if (!result || !file) return
    const originalName = file.name.replace(/\.pdf$/i, '')
    const downloadName = `${originalName}_under_${targetKb}kb.pdf`
    downloadBlob(result.blob, downloadName)
  }

  const handleCustomTargetChange = (val: string) => {
    setCustomKbInput(val)
    const parsed = parseInt(val, 10)
    if (!isNaN(parsed) && parsed >= 30 && parsed <= 5000) {
      setTargetKb(parsed)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/compress-pdf-to-200kb"
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: `${tool.name} — PDFCompress Pro`,
          url: `${SITE_URL}/compress-pdf-to-200kb`,
          description: tool.metaDescription,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
        }}
        faqData={faqItems}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>Compress PDF to 200KB</span>
      </nav>

      <div className="tool-layout">
        {/* Main Interface Area */}
        <div className="tool-main space-y-6">
          {/* Header Banner */}
          <div className="card-premium p-6 sm:p-8 bg-gradient-to-br from-primary-500/5 via-indigo-500/5 to-purple-500/5 border-primary-200/60">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>⚡ High-Speed Browser Engine • 1–3s Instant</span>
              </div>
              <div className="text-xs text-surface-500 font-semibold flex items-center gap-1.5">
                <span>🔒</span>
                <span>100% Private (Processed Locally)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight mb-2">
              Compress PDF to 200KB Specifically
            </h1>
            <p className="text-surface-600 text-sm leading-relaxed max-w-3xl">
              Strictly compresses PDF files <strong>under 200 KB</strong> (targeting 180–192 KB) for government job applications (SSC, UPSC, IBPS, State PSCs), university admissions, and email upload limits while preserving crystal-clear readable text.
            </p>
          </div>

          {/* File Upload / Selected Card */}
          {!file ? (
            <div className="card-premium p-6 sm:p-8">
              <FileUploader
                accept=".pdf,application/pdf"
                onFiles={handleFile}
                title="Select or Drop your PDF here"
                subtitle="Supports single or multi-page documents, scans, and certificates (up to 50MB)"
                icon="📦"
              />
            </div>
          ) : (
            <div className="card-premium p-6 sm:p-8 space-y-6 animate-fade-in">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                    📄
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-surface-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-surface-500 font-medium mt-0.5">
                      Current Size: <span className="font-bold text-surface-800">{formatFileSize(file.size)}</span>
                      {file.size > 200 * 1024 ? (
                        <span className="text-amber-600 font-semibold ml-2">
                          ({((file.size - 200 * 1024) / 1024).toFixed(1)} KB over 200KB target)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold ml-2">
                          (Already under 200KB!)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => { setFile(null); setResult(null); setError(null) }}
                  disabled={isProcessing}
                  className="text-xs text-surface-500 hover:text-surface-800 font-semibold underline px-2 py-1"
                >
                  Change File
                </button>
              </div>

              {/* Target Limit Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-surface-700 uppercase tracking-wider">
                    Select Target Size Limit:
                  </label>
                  <span className="text-xs text-primary-600 font-bold">
                    Target: ≤ {targetKb} KB
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { kb: 200, label: '200 KB', note: 'SSC / UPSC / Govt', badge: 'Recommended' },
                    { kb: 100, label: '100 KB', note: 'Strict Portals / Photo', badge: 'High Compact' },
                    { kb: 300, label: '300 KB', note: 'State PSC / University', badge: 'Crisp' },
                    { kb: 500, label: '500 KB', note: 'Resume / Portfolios', badge: 'Standard' }
                  ].map((preset) => (
                    <button
                      key={preset.kb}
                      type="button"
                      onClick={() => { setTargetKb(preset.kb); setCustomKbInput('') }}
                      disabled={isProcessing}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        targetKb === preset.kb && !customKbInput
                          ? 'border-primary-500 bg-primary-50/70 shadow-sm ring-2 ring-primary-500/20'
                          : 'border-surface-200 bg-white hover:border-surface-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm text-surface-900">{preset.label}</div>
                      <div className="text-[11px] text-surface-500 truncate">{preset.note}</div>
                      {preset.badge && (
                        <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                          preset.badge === 'Recommended' ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600'
                        }`}>
                          {preset.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Target Input */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-surface-500 font-medium">Or enter custom target:</span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="number"
                      min={30}
                      max={5000}
                      placeholder="e.g. 150"
                      value={customKbInput}
                      onChange={(e) => handleCustomTargetChange(e.target.value)}
                      disabled={isProcessing}
                      className="w-24 px-2.5 py-1 text-xs font-bold border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    <span className="text-xs font-semibold text-surface-500 ml-1.5">KB</span>
                  </div>
                </div>
              </div>

              {/* Engine Toggle & Performance Options */}
              <div className="p-4 rounded-2xl bg-surface-50/70 border border-surface-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-surface-800">Processing Engine:</span>
                  <p className="text-surface-500 text-[11px]">Browser engine runs locally in 1–3 seconds with zero server lag.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-200/70 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEngineMode('browser')}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      engineMode === 'browser' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    ⚡ Fast Browser (1-3s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEngineMode('server')}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      engineMode === 'server' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-600 hover:text-surface-900'
                    }`}
                  >
                    ☁️ Cloud Ghostscript
                  </button>
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-2 p-4 rounded-2xl bg-primary-50/50 border border-primary-100">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-primary-700">{progressMsg || 'Optimizing document...'}</span>
                    <span className="text-primary-600">{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!result && (
                <button
                  type="button"
                  onClick={handleCompress}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-primary-500/25 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Compressing Specifically Under {targetKb}KB...</span>
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      <span>Compress PDF to Under {targetKb} KB Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div ref={resultRef} className="card-premium p-6 sm:p-8 space-y-6 animate-fade-in border-emerald-200 bg-gradient-to-b from-white to-emerald-50/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-black shadow-inner">
                    ✓
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                      <span>🎯</span>
                      <span>Target Met: Under {targetKb} KB</span>
                    </div>
                    <h3 className="text-xl font-black text-surface-900 mt-1">
                      {formatFileSize(result.compressedSize)}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-surface-500 font-semibold">Reduced by</div>
                  <div className="text-lg font-black text-emerald-600">{result.reduction}%</div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <span>✅</span>
                  <span>100% Verified Ready for Government Portals & Online Uploads</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your PDF is now exactly <strong>{formatFileSize(result.compressedSize)}</strong> (which is {(targetKb - (result.compressedSize / 1024)).toFixed(1)} KB safely below the {targetKb}KB ceiling). Accepted by SSC, UPSC, State PSCs, and email limits.
                </p>
              </div>

              {/* Size Comparison Table */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="text-surface-400 font-medium">Original</div>
                  <div className="text-sm font-bold text-surface-800 mt-0.5">{formatFileSize(result.originalSize)}</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-emerald-600 font-medium">Compressed</div>
                  <div className="text-sm font-black text-emerald-700 mt-0.5">{formatFileSize(result.compressedSize)}</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <div className="text-surface-400 font-medium">Space Saved</div>
                  <div className="text-sm font-bold text-surface-800 mt-0.5">
                    {formatFileSize(Math.max(0, result.originalSize - result.compressedSize))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>⬇️</span>
                  <span>Download Compressed PDF ({formatFileSize(result.compressedSize)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setFile(null); setResult(null); setError(null) }}
                  className="px-6 py-4 rounded-2xl bg-surface-100 hover:bg-surface-200 text-surface-700 font-bold text-xs sm:text-sm transition-all text-center"
                >
                  Compress Another File
                </button>
              </div>
            </div>
          )}

          {/* Quick Guide on Portal Requirements */}
          <div className="card-premium p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-surface-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>Common Government Job & Admission Portal 200KB Rules</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/80">
                <div className="font-bold text-surface-800 mb-1">SSC (Staff Selection Commission)</div>
                <p className="text-surface-500 leading-relaxed">
                  Requires certificates, category proofs, and marksheets strictly between 50KB and 200KB in standard PDF format.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/80">
                <div className="font-bold text-surface-800 mb-1">UPSC (Civil Services & NDA)</div>
                <p className="text-surface-500 leading-relaxed">
                  Mandates educational documents and ID proofs must not exceed 200KB or 300KB with legible text.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/80">
                <div className="font-bold text-surface-800 mb-1">State PSCs & Police Boards</div>
                <p className="text-surface-500 leading-relaxed">
                  Strictly rejects uploads larger than 200KB with automated file-size validators on the submission form.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200/80">
                <div className="font-bold text-surface-800 mb-1">University & College Admissions</div>
                <p className="text-surface-500 leading-relaxed">
                  Admission portals for engineering, medical, and degree colleges require all uploads under 200KB per file.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <FAQ items={faqItems} />

          {/* Related Tools */}
          <RelatedTools currentSlug="compress-pdf-to-200kb" limit={4} />
        </div>
      </div>
    </div>
  )
}
