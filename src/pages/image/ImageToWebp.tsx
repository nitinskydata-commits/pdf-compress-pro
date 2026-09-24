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

interface ImageToWebpProps {
  initialSourceFormat?: 'jpg' | 'png' | 'any'
}

export default function ImageToWebp({ initialSourceFormat = 'any' }: ImageToWebpProps) {
  const currentSlug = initialSourceFormat === 'png' ? 'png-to-webp' : initialSourceFormat === 'jpg' ? 'jpg-to-webp' : 'convert-to-webp'
  const tool = getToolBySlug(currentSlug) || {
    slug: currentSlug,
    name: initialSourceFormat === 'png' ? 'PNG to WebP Converter' : initialSourceFormat === 'jpg' ? 'JPG to WebP Converter' : 'Image to WebP Converter',
    metaTitle: 'Image to WebP Converter — Next-Gen Compression with Alpha Transparency',
    metaDescription: 'Convert JPG, JPEG, and PNG images into modern WebP format. Reduce image weights by up to 80% while retaining sharp quality and transparency.',
    category: 'image',
    categoryLabel: 'Image Tools',
    keywords: ['image to webp', 'convert to webp', 'jpg to webp', 'png to webp', 'next-gen image compression'],
    icon: '🖼️',
  }

  const faqItems = [
    {
      question: 'What is WebP and why use it?',
      answer: 'WebP is a modern image format developed by Google that provides superior lossless and lossy compression for web images. WebP images are 26% smaller than PNGs and 25-34% smaller than comparable JPEGs.',
    },
    {
      question: 'Does WebP support transparency like PNG?',
      answer: 'Yes! WebP provides full 8-bit alpha channel transparency just like PNG, but at a fraction of the file size.',
    },
    {
      question: 'Is WebP supported on all major web browsers?',
      answer: 'Yes. Modern versions of Google Chrome, Apple Safari (iOS & macOS), Mozilla Firefox, Microsoft Edge, and Opera all have 100% native WebP support.',
    },
  ]

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [quality, setQuality] = useState(82)
  const [scale, setScale] = useState(100)
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number; reduction: number } | null>(null)
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

  const convertToWebp = useCallback(async () => {
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

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('WebP encoding failed'))),
          'image/webp',
          quality / 100
        )
      })

      const saved = Math.max(0, file.size - blob.size)
      const reduction = Math.round((saved / file.size) * 100)

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        width: targetW,
        height: targetH,
        reduction,
      })

      trackToolUsage({
        toolId: currentSlug,
        toolName: tool.name,
        category: 'image',
        action: `Converted ${file.name} to WebP (${reduction}% reduction)`,
        details: `Quality: ${quality}%, Scale: ${scale}%`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas WebP Encoder',
      })
    } catch {
      alert('Could not convert image. Please ensure file is a valid image.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, quality, scale, currentSlug, tool.name])

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${currentSlug}`}
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/${currentSlug}`,
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
          <ToolVisualBadge category="image" slug={currentSlug} name={tool.name} icon="🖼️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            {tool.name}
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert standard JPG and PNG photos into lightweight, next-generation Google WebP files. Improve website loading speeds and SEO PageSpeed rankings instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 30–80% Smaller Files
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Alpha Transparency Preserved
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Client-Side GPU Accelerated
            </span>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept="image/*,.jpg,.jpeg,.png,.webp,.bmp"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="🖼️"
              title="Drop your image here to convert to WebP"
              subtitle="Files are processed 100% locally in your browser memory"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="image" slug={currentSlug} name="IMG" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">{file.name}</p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)} • Source Image</p>
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
                <div className="p-4 rounded-2xl bg-surface-100 border border-surface-200 flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
                  {preview && (
                    <img
                      src={preview}
                      alt="Source Preview"
                      className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm"
                    />
                  )}
                  <span className="text-[11px] text-surface-500 font-medium mt-2">Source Image Preview</span>
                </div>

                {/* Configuration Panel */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">WebP Compression Options</h4>

                  {/* Quality Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-surface-700">
                      <span>Compression Quality</span>
                      <span>{quality}% {quality >= 80 ? '(Recommended)' : '(High Compression)'}</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={quality}
                      onChange={e => setQuality(parseInt(e.target.value))}
                      className="w-full accent-primary-600 cursor-pointer"
                    />
                  </div>

                  {/* Scale */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-surface-700">
                      <span>Dimension Scale</span>
                      <span>{scale}%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 75, 50, 25].map(s => (
                        <button
                          key={s}
                          onClick={() => setScale(s)}
                          className={`py-1.5 rounded-xl text-xs font-bold border transition-colors ${
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

                  <button
                    onClick={convertToWebp}
                    disabled={isProcessing}
                    className="btn-primary w-full py-3.5 text-base font-bold shadow-md cursor-pointer"
                  >
                    {isProcessing ? 'Encoding WebP...' : 'Convert to Modern WebP →'}
                  </button>
                </div>
              </div>

              {/* Conversion Result Card */}
              {result && (
                <div ref={resultRef} className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                  <span className="text-3xl block">🚀</span>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">WebP Conversion Complete!</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      New Size: <strong>{formatFileSize(result.blob.size)}</strong> (Saved {result.reduction}% vs {formatFileSize(file.size)}) • {result.width} × {result.height}px
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^/.]+$/, '')}.webp`)}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-md"
                    >
                      <span>⬇️</span> Download WebP Image
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
            <span className="text-2xl mb-2 block">⚡</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Boost SEO & Core Web Vitals</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Google PageSpeed Insights directly recommends WebP format to accelerate Largest Contentful Paint (LCP).
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">💎</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Sharp Vector & Alpha Alpha</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              WebP combines the small file sizes of JPG with the full transparency capabilities of PNG.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">🔒</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Browser Sandbox Privacy</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Images are encoded locally in your browser memory without third-party server exposure.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-premium p-6 sm:p-8 mb-12">
          <h2 className="text-xl font-bold text-surface-900 mb-6">Frequently Asked Questions</h2>
          <FAQ items={faqItems} />
        </div>

        {/* Related Tools */}
        <RelatedTools currentSlug={currentSlug} />
      </div>
    </div>
  )
}
