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

const tool = getToolBySlug('image-resizer') || {
  slug: 'image-resizer',
  name: 'Image Resizer Online',
  shortName: 'Image Resizer',
  description: 'Resize image dimensions in pixels, percentage, or social media presets. High-fidelity bicubic interpolation with 100% private in-browser processing.',
  metaTitle: 'Image Resizer Online Free — Resize Photos in Pixels & Inches',
  metaDescription: 'Resize image dimensions online for free. Convert photos to exact width and height, social presets (Instagram, YouTube), or passport sizes with zero quality loss.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: ['image resizer', 'resize photo', 'resize image online free', 'change image dimensions', 'resize picture to pixels'],
  icon: '📐',
}

interface PresetItem {
  category: 'social' | 'official' | 'display'
  label: string
  w: number
  h: number
  desc: string
}

const PRESETS: PresetItem[] = [
  // Social Media
  { category: 'social', label: 'Instagram Square', w: 1080, h: 1080, desc: '1:1 Post' },
  { category: 'social', label: 'Instagram Story', w: 1080, h: 1920, desc: '9:16 Reel / Story' },
  { category: 'social', label: 'YouTube Thumbnail', w: 1280, h: 720, desc: '16:9 Cover' },
  { category: 'social', label: 'Facebook Post', w: 1200, h: 630, desc: 'Landscape' },
  { category: 'social', label: 'LinkedIn Banner', w: 1584, h: 396, desc: 'Cover Art' },
  { category: 'social', label: 'Twitter/X Post', w: 1600, h: 900, desc: 'Header' },

  // Official / Passports / Print
  { category: 'official', label: 'Passport Photo (3.5×4.5 cm)', w: 413, h: 531, desc: 'Govt Standard' },
  { category: 'official', label: 'US Visa (2×2 in)', w: 600, h: 600, desc: 'Square Photo' },
  { category: 'official', label: 'A4 Document Print', w: 2480, h: 3508, desc: '300 DPI' },

  // Standard Screen Displays
  { category: 'display', label: '4K Ultra HD', w: 3840, h: 2160, desc: '3840×2160' },
  { category: 'display', label: 'Full HD 1080p', w: 1920, h: 1080, desc: '1920×1080' },
  { category: 'display', label: 'HD 720p', w: 1280, h: 720, desc: '1280×720' },
]

const PERCENTAGE_PRESETS = [25, 50, 75, 125, 150, 200]

const faqItems = [
  {
    question: 'How do I resize an image without distorting its proportions?',
    answer: 'Keep the "Lock Aspect Ratio" toggle switched on. When you change the width, the height will automatically calculate to match the original proportions perfectly.',
  },
  {
    question: 'Does resizing an image reduce its clarity or quality?',
    answer: 'Downscaling an image to smaller dimensions preserves crispness and actually sharpens pixels. Upscaling to significantly larger dimensions uses high-grade bicubic smoothing to prevent pixelation.',
  },
  {
    question: 'Can I change the file format while resizing?',
    answer: 'Yes! You can choose to export as JPEG, lossless PNG, or modern WebP, and adjust the output compression quality slider.',
  },
  {
    question: 'Are my photos ever uploaded to a server?',
    answer: 'Never. All processing happens entirely inside your web browser using HTML5 Canvas rendering. Your files stay on your computer or mobile device.',
  },
]

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [origW, setOrigW] = useState(0)
  const [origH, setOrigH] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lockAspect, setLockAspect] = useState(true)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')
  const [quality, setQuality] = useState(92)
  const [activeTab, setActiveTab] = useState<'social' | 'official' | 'display'>('social')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    blob: Blob
    url: string
    w: number
    h: number
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

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)

    const img = new Image()
    img.src = url
    img.onload = () => {
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
    }
  }, [])

  const updateWidth = (newW: number) => {
    setWidth(newW)
    if (lockAspect && origW > 0) {
      setHeight(Math.max(1, Math.round((newW / origW) * origH)))
    }
  }

  const updateHeight = (newH: number) => {
    setHeight(newH)
    if (lockAspect && origH > 0) {
      setWidth(Math.max(1, Math.round((newH / origH) * origW)))
    }
  }

  const applyPreset = (presetW: number, presetH: number) => {
    setWidth(presetW)
    setHeight(presetH)
    setLockAspect(false)
  }

  const applyPercent = (pct: number) => {
    if (origW > 0 && origH > 0) {
      const newW = Math.max(1, Math.round((origW * pct) / 100))
      const newH = Math.max(1, Math.round((origH * pct) / 100))
      setWidth(newW)
      setHeight(newH)
      setLockAspect(true)
    }
  }

  const resizeImage = useCallback(async () => {
    if (!file || isProcessing || width <= 0 || height <= 0) return
    setIsProcessing(true)

    try {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = objectUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
      }
      ctx.drawImage(img, 0, 0, width, height)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))),
          format,
          quality / 100
        )
      })

      URL.revokeObjectURL(objectUrl)
      const resUrl = URL.createObjectURL(blob)

      trackToolUsage({
        toolId: 'image-resizer',
        toolName: 'Image Resizer',
        category: 'image',
        action: `Resized ${file.name} to ${width}x${height}`,
        details: `From ${origW}x${origH} to ${width}x${height} (${format}, q:${quality}%)`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas High-Quality Bicubic',
      })

      setResult({
        blob,
        url: resUrl,
        w: width,
        h: height,
        size: blob.size,
      })
    } catch (err) {
      alert('Failed to resize image. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, width, height, format, quality, origW, origH])

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setOrigW(0)
    setOrigH(0)
  }

  const getExtension = () => {
    if (format === 'image/png') return 'png'
    if (format === 'image/webp') return 'webp'
    return 'jpg'
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/image-resizer"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/image-resizer`,
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

        {/* Hero */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="image" slug="image-resizer" name="Resize" icon="📐" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Image Resizer Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Resize photos to exact width and height, scale by percentage, or choose one-click presets for social media, YouTube, and passport applications.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> High-Fidelity Bicubic Filtering
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Social & Passport Presets
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private In-Browser
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept="image/*"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="📐"
              title="Drop your photo here to resize, or click to browse"
              subtitle="Supports JPG, PNG, WebP, GIF, and SVG • Instant in-browser scaling"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded-xl border border-surface-200 shadow-xs"
                    />
                  ) : (
                    <ToolVisualBadge category="image" slug="image-resizer" name="IMG" size="md" />
                  )}
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      Original: <span className="font-semibold text-surface-800">{origW} × {origH} px</span> • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change Image
                </button>
              </div>

              {/* Dimensions Input Panel */}
              <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                    Target Dimensions
                  </label>
                  <button
                    type="button"
                    onClick={() => setLockAspect(!lockAspect)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      lockAspect
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-surface-200 text-surface-600 border border-surface-300'
                    }`}
                  >
                    <span>{lockAspect ? '🔗 Aspect Ratio Locked' : '🔓 Aspect Ratio Free'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Width (pixels)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={width}
                      onChange={e => updateWidth(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-bold text-surface-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-700 mb-1">
                      Height (pixels)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={height}
                      onChange={e => updateHeight(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-bold text-surface-900 text-sm"
                    />
                  </div>
                </div>

                {/* Percentage Quick Scale */}
                <div>
                  <div className="text-xs font-semibold text-surface-500 mb-2">
                    Or Scale by Percentage:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PERCENTAGE_PRESETS.map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyPercent(pct)}
                        className="px-3 py-1 rounded-lg bg-white border border-surface-200 hover:border-primary-300 hover:bg-primary-50 text-xs font-semibold text-surface-700 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                    One-Click Dimension Presets
                  </label>
                  <div className="flex gap-1">
                    {(['social', 'official', 'display'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                          activeTab === tab
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESETS.filter(p => p.category === activeTab).map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.w, p.h)}
                      className="p-3 rounded-xl border border-surface-200 bg-white hover:border-primary-400 hover:bg-primary-50/50 text-left transition-all"
                    >
                      <div className="font-bold text-xs text-surface-900 truncate">{p.label}</div>
                      <div className="text-[11px] text-primary-600 font-semibold mt-0.5">
                        {p.w} × {p.h} px
                      </div>
                      <div className="text-[10px] text-surface-400 truncate">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Output Format and Quality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-sm font-semibold bg-white"
                  >
                    <option value="image/jpeg">JPG / JPEG (Standard)</option>
                    <option value="image/png">PNG (Lossless Sharpness)</option>
                    <option value="image/webp">WebP (Modern Smallest Size)</option>
                  </select>
                </div>

                {format !== 'image/png' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-surface-700">
                        Export Quality
                      </label>
                      <span className="text-xs font-bold text-primary-600">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={quality}
                      onChange={e => setQuality(Number(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={resizeImage}
                disabled={isProcessing || width <= 0 || height <= 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rendering High-DPI Pixels...
                  </span>
                ) : (
                  `📐 Resize Image to ${width} × ${height} px`
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
              Image Resized to {result.w} × {result.h} px!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              New file size: {formatFileSize(result.size)}
            </p>

            <div className="max-w-md mx-auto mb-8 p-3 rounded-2xl bg-surface-100 border border-surface-200">
              <img
                src={result.url}
                alt="Resized Result"
                className="max-h-72 mx-auto rounded-xl object-contain shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `resized_${result.w}x${result.h}_${file?.name.replace(/\.[^/.]+$/, '')}.${getExtension()}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Resized Image
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Resize Another
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Resize Photos and Graphics Online for Free
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to prepare an image for your social media channels or shrink a large camera photo to fit within an email attachment? PDFCompress Pro lets you define custom width and height in pixels or scale by percentage while preserving your exact aspect ratio.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Our tool operates entirely in your browser using high-precision bicubic interpolation, ensuring crisp text and sharp lines without blurriness or compression noise. Best of all, your images are never uploaded to any cloud server, keeping your personal photos 100% private.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="image-resizer" />
      </div>
    </div>
  )
}
