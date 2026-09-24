import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('jpg-to-png') || {
  slug: 'jpg-to-png',
  name: 'JPG to PNG Converter',
  metaTitle: 'JPG to PNG Converter — 100% Free, Private & High-Fidelity',
  metaDescription: 'Convert JPG photos and images to lossless PNG format in your browser. 100% private, transparent background support, and zero file uploads.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: ['jpg to png', 'convert jpg to png', 'jpeg to png converter', 'free online png converter', 'lossless image conversion'],
  icon: '🖼️',
}

const faqItems = [
  {
    question: 'Why convert JPG to PNG?',
    answer: 'PNG is a lossless compression format that preserves sharp line art, typography, and logos without the compression artifacts common in JPG files. It also allows adding transparent backgrounds.',
  },
  {
    question: 'Will converting from JPG to PNG improve image quality?',
    answer: 'Converting will not magically restore data lost in original JPG compression, but saving as PNG ensures that no further quality degradation occurs during future edits, saves, and web uploads.',
  },
  {
    question: 'Are my photos uploaded to any remote server?',
    answer: 'No. The entire conversion runs locally inside your browser via HTML5 Canvas. Your photos never leave your device.',
  },
  {
    question: 'Can I make a solid white background transparent?',
    answer: 'Yes! Our advanced converter includes an optional "Make White Background Transparent" toggle that detects background pixels and renders them as clear alpha transparency.',
  },
]

export default function JpgToPng() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [makeTransparent, setMakeTransparent] = useState(false)
  const [transparencyThreshold, setTransparencyThreshold] = useState(240)
  const [scale, setScale] = useState(100)
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setPreview(URL.createObjectURL(f))
  }, [])

  const convertToPng = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)

    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const targetW = Math.round((img.naturalWidth * scale) / 100)
      const targetH = Math.round((img.naturalHeight * scale) / 100)

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetW, targetH)

      // Optional White to Transparent Alpha Filter
      if (makeTransparent) {
        const imgData = ctx.getImageData(0, 0, targetW, targetH)
        const d = imgData.data
        const th = transparencyThreshold
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          if (r >= th && g >= th && b >= th) {
            d[i + 3] = 0 // transparent
          }
        }
        ctx.putImageData(imgData, 0, 0)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('PNG conversion failed'))),
          'image/png'
        )
      })

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        width: targetW,
        height: targetH,
      })

      trackToolUsage({
        toolId: 'jpg-to-png',
        toolName: 'JPG to PNG Converter',
        category: 'image',
        action: `Converted ${file.name} to PNG (${targetW}x${targetH})`,
        details: `Make Transparent: ${makeTransparent}, Scale: ${scale}%`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas Lossless PNG',
      })
    } catch {
      alert('Could not convert image. Please ensure file is a valid image.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, makeTransparent, transparencyThreshold, scale])

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/jpg-to-png"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/jpg-to-png`,
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
          <Link to="/#category-catalog">Image Tools</Link>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="image" slug="jpg-to-png" name="JPG to PNG" icon="🖼️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            JPG to PNG Converter
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert JPG, JPEG, and WebP camera photos into lossless, sharp PNG graphics. 100% private in-browser rendering with optional white-background transparency removal.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Lossless Quality
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Alpha Transparency Support
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> No File Limits
            </span>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="🖼️"
              title="Drop your JPG or JPEG image here, or click to browse"
              subtitle="Files are processed 100% locally in your browser memory"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="image" slug="jpg-to-png" name="JPG" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">{file.name}</p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)} • Source JPG</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setResult(null); setPreview(null) }}
                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors"
                >
                  Choose Another Image
                </button>
              </div>

              {/* Conversion Controls & Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Preview Box with Checkerboard Background */}
                <div className="p-4 rounded-2xl bg-surface-100 border border-surface-200 flex flex-col items-center justify-center min-h-[260px] overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                  {preview && (
                    <img
                      src={preview}
                      alt="Source Preview"
                      className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm"
                    />
                  )}
                  <span className="text-[11px] text-surface-500 font-medium mt-2">Original JPG Image</span>
                </div>

                {/* Configuration Panel */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">Output Settings</h4>

                  {/* Resolution Scale */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-surface-700">
                      <span>Output Resolution Scale</span>
                      <span>{scale}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 75, 50, 25].map(s => (
                        <button
                          key={s}
                          onClick={() => setScale(s)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                            scale === s
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                          }`}
                        >
                          {s}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transparency Extraction Toggle */}
                  <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={makeTransparent}
                        onChange={e => setMakeTransparent(e.target.checked)}
                        className="w-4 h-4 rounded text-primary-600 accent-primary-600"
                      />
                      <span className="text-xs font-bold text-surface-800">
                        Make White Background Transparent
                      </span>
                    </label>
                    <p className="text-[11px] text-surface-500 leading-tight">
                      Automatically detects solid white backgrounds (e.g. logos or product photos) and removes them for PNG transparency.
                    </p>

                    {makeTransparent && (
                      <div className="space-y-1 pt-2 border-t border-surface-200">
                        <div className="flex justify-between text-[11px] font-semibold text-surface-600">
                          <span>White Sensitivity Threshold</span>
                          <span>{transparencyThreshold}</span>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="255"
                          value={transparencyThreshold}
                          onChange={e => setTransparencyThreshold(parseInt(e.target.value))}
                          className="w-full accent-primary-600"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={convertToPng}
                    disabled={isProcessing}
                    className="btn-primary w-full py-3.5 text-base font-bold shadow-md cursor-pointer"
                  >
                    {isProcessing ? 'Encoding Lossless PNG...' : 'Convert to Lossless PNG →'}
                  </button>
                </div>
              </div>

              {/* Conversion Result Card */}
              {result && (
                <div ref={resultRef} className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                  <span className="text-3xl block">🎉</span>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">Lossless PNG Created!</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      Dimensions: {result.width} × {result.height}px • Output Size: {formatFileSize(result.blob.size)}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^/.]+$/, '')}.png`)}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-md"
                    >
                      <span>⬇️</span> Download PNG Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informational Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center sm:text-left">
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">🎯</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Zero Compression Artifacts</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              PNG preserves sharp edges, crisp vector rasterization, and saturated colors without blocking or ringing noise.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">🔒</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Private Client Canvas</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Everything happens directly inside your web browser’s GPU memory without sending photos over public networks.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">⚡</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Instant Re-Export</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              High-resolution RGBA conversion produces standard PNG files compatible with all graphic editors and websites.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-premium p-6 sm:p-8 mb-12">
          <h2 className="text-xl font-bold text-surface-900 mb-6">Frequently Asked Questions</h2>
          <FAQ items={faqItems} />
        </div>

        {/* Related Tools */}
        <RelatedTools currentSlug="jpg-to-png" />
      </div>
    </div>
  )
}
