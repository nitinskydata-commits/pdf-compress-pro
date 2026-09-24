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

const tool = getToolBySlug('image-compressor') || {
  slug: 'image-compressor',
  name: 'Image Compressor — Compress JPG, PNG & WebP Online',
  shortName: 'Image Compressor',
  description: 'Compress images up to 90% while maintaining crisp visual quality. Convert formats, scale dimensions, and optimize files with 100% private in-browser canvas rendering.',
  metaTitle: 'Image Compressor Online Free — Reduce JPG, PNG & WebP Size',
  metaDescription: 'Compress JPG, PNG, and WebP images online for free. Adjust quality, compare before/after file sizes, and scale dimensions. 100% private in-browser processing.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: ['image compressor', 'compress jpg online', 'reduce image size', 'compress png without quality loss', 'webp compressor'],
  icon: '🖼️',
}

const faqItems = [
  {
    question: 'How much can images be compressed without visible loss?',
    answer: 'Most JPEG and WebP photos can be reduced by 60% to 85% with virtually imperceptible differences to the human eye. PNG graphics with flat colors or transparencies often compress 40% to 70%.',
  },
  {
    question: 'Is compression executed completely inside my web browser?',
    answer: 'Yes! We harness the HTML5 Canvas API and WebAssembly image encoders directly on your device. None of your photos, screenshots, or graphics are ever uploaded to any cloud server.',
  },
  {
    question: 'Can I convert image formats during compression?',
    answer: 'Yes! You can maintain the original format or instantly convert between JPEG, WebP, and PNG while compressing.',
  },
  {
    question: 'What is the advantage of converting to WebP?',
    answer: 'WebP is Google\'s modern web format designed specifically for the internet. It provides superior lossless and lossy compression, resulting in file sizes that are 25% to 34% smaller than comparable JPEG or PNG files.',
  },
]

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [quality, setQuality] = useState(75)
  const [format, setFormat] = useState<'original' | 'jpeg' | 'webp' | 'png'>('original')
  const [scalePct, setScalePct] = useState(100)
  const [result, setResult] = useState<{
    blob: Blob
    url: string
    width: number
    height: number
    originalSize: number
    compressedSize: number
    reduction: number
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
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
    setFile(f)
    setResult(null)
    setPreview(URL.createObjectURL(f))
  }, [])

  const compress = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const targetWidth = Math.round((img.naturalWidth * scalePct) / 100)
      const targetHeight = Math.round((img.naturalHeight * scalePct) / 100)

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')!

      // If output format is JPEG and image has transparency, paint white background
      let targetMime = 'image/jpeg'
      if (format === 'original') {
        targetMime = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
      } else {
        targetMime = `image/${format}`
      }

      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, targetWidth, targetHeight)
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
          targetMime,
          quality / 100
        )
      })

      const saved = Math.max(0, file.size - blob.size)
      const reduction = Math.round((saved / file.size) * 100)

      const resUrl = URL.createObjectURL(blob)
      setResult({
        blob,
        url: resUrl,
        width: targetWidth,
        height: targetHeight,
        originalSize: file.size,
        compressedSize: blob.size,
        reduction,
      })

      trackToolUsage({
        toolId: 'image-compressor',
        toolName: 'Image Compressor',
        category: 'image',
        action: `Compressed ${file.name}`,
        details: `${formatFileSize(file.size)} → ${formatFileSize(blob.size)} (${reduction}% reduction)`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas API',
      })
    } catch {
      alert('Failed to compress image. Please ensure the file is a valid image.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, format, quality, scalePct])

  const handleDownload = () => {
    if (!result || !file) return
    const origBase = file.name.replace(/\.[^.]+$/, '')
    let ext = 'jpg'
    if (format === 'webp' || (format === 'original' && file.type === 'image/webp')) ext = 'webp'
    else if (format === 'png' || (format === 'original' && file.type === 'image/png')) ext = 'png'

    downloadBlob(result.blob, `${origBase}-compressed.${ext}`)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/${tool.slug}`,
          description: tool.metaDescription,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link>
        <span>/</span>
        <span className="text-surface-700 font-medium">{tool.shortName}</span>
      </nav>

      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-6 rounded-2xl border border-orange-500/20">
        <ToolVisualBadge category="image" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
              📉 Up to 90% Size Reduction
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              ⚡ WebP, JPG & PNG Support
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              🔍 Live Before & After Previews
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
        {!file ? (
          <FileUploader
            accept="image/jpeg,image/png,image/webp"
            onFiles={handleFile}
            icon="🖼️📦"
            title="Drop JPG, PNG, or WebP image here"
            subtitle="Or click to select an image from your device"
          />
        ) : (
          <div className="space-y-6">
            {/* File Info Bar */}
            <div className="p-4 bg-surface-50 rounded-xl border border-surface-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-surface-200 shadow-xs"
                  />
                )}
                <div>
                  <div className="font-bold text-surface-900 text-sm">{file.name}</div>
                  <div className="text-xs text-surface-500">
                    Original Size: <span className="font-bold text-surface-700">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={reset}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
              >
                Choose Another Image
              </button>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-surface-50/50 rounded-xl border border-surface-200">
              {/* Quality Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-700">
                    Compression Quality: {quality}%
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                    {quality >= 85 ? 'High Quality' : quality >= 65 ? 'Recommended' : quality >= 40 ? 'Medium' : 'Extreme'}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                {/* Presets */}
                <div className="flex gap-1.5 mt-2">
                  {[
                    { label: '90%', val: 90 },
                    { label: '75%', val: 75 },
                    { label: '50%', val: 50 },
                    { label: '30%', val: 30 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => setQuality(p.val)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition font-medium ${
                        quality === p.val
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-surface-600 border-surface-200 hover:bg-surface-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'original' as const, label: 'Keep Original' },
                    { id: 'webp' as const, label: 'WebP (Smallest)' },
                    { id: 'jpeg' as const, label: 'JPEG' },
                    { id: 'png' as const, label: 'PNG' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setFormat(fmt.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition text-left ${
                        format === fmt.id
                          ? 'border-orange-500 bg-orange-50 text-orange-900 ring-1 ring-orange-500/20'
                          : 'border-surface-200 bg-white text-surface-600 hover:bg-surface-50'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension Scale */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-700 mb-2">
                  Dimension Scale: {scalePct}%
                </label>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="25"
                  value={scalePct}
                  onChange={(e) => setScalePct(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-surface-400 mt-1 font-medium">
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100% (Original)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={compress}
              disabled={isProcessing}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition transform active:scale-[0.99] flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {isProcessing ? '⏳ Compressing Image...' : '⚡ Compress Image Now'}
            </button>
          </div>
        )}
      </div>

      {/* Results Card */}
      {result && (
        <div ref={resultRef} className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-100">
            <div>
              <h3 className="text-xl font-black text-surface-900">Compression Completed!</h3>
              <p className="text-xs text-surface-500">Your optimized image is ready for download</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              {result.reduction}% Reduction
            </span>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface-50 rounded-xl p-3.5 border border-surface-200 text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase">Original Size</div>
              <div className="text-lg font-black text-surface-800 mt-1">
                {formatFileSize(result.originalSize)}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-center">
              <div className="text-[11px] font-bold text-emerald-700 uppercase">Compressed Size</div>
              <div className="text-lg font-black text-emerald-800 mt-1">
                {formatFileSize(result.compressedSize)}
              </div>
            </div>
            <div className="bg-surface-50 rounded-xl p-3.5 border border-surface-200 text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase">Data Saved</div>
              <div className="text-lg font-black text-surface-800 mt-1">
                {formatFileSize(Math.max(0, result.originalSize - result.compressedSize))}
              </div>
            </div>
            <div className="bg-surface-50 rounded-xl p-3.5 border border-surface-200 text-center">
              <div className="text-[11px] font-bold text-surface-500 uppercase">Resolution</div>
              <div className="text-lg font-black text-surface-800 mt-1">
                {result.width} × {result.height}
              </div>
            </div>
          </div>

          {/* Side by Side Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-surface-200 rounded-xl p-3 bg-surface-50/50">
              <div className="text-xs font-bold text-surface-500 mb-2">Original Preview</div>
              {preview && (
                <img
                  src={preview}
                  alt="Original"
                  className="w-full h-56 object-contain rounded-lg bg-surface-100"
                />
              )}
            </div>
            <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/30">
              <div className="text-xs font-bold text-emerald-800 mb-2">Compressed Output ({result.reduction}% smaller)</div>
              <img
                src={result.url}
                alt="Compressed"
                className="w-full h-56 object-contain rounded-lg bg-surface-100"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-surface-100">
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition inline-flex items-center gap-2 text-sm"
            >
              📥 Download Compressed Image
            </button>
            <button
              onClick={reset}
              className="text-xs text-surface-500 hover:text-surface-800 font-semibold"
            >
              Compress Another Image
            </button>
          </div>
        </div>
      )}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About Free Online Image Compression</h2>
        <p>
          High-resolution photos from modern smartphones and digital cameras can easily exceed 5MB to 20MB.
          Uploading uncompressed images leads to slow website loading times, high bandwidth consumption, and rejected job or visa portal submissions.
        </p>

        <h3>Why In-Browser Compression Is Superior</h3>
        <p>
          Unlike legacy web tools that require uploading your personal images to a remote server, our utility processes your photos 100% locally via the browser's native Canvas hardware acceleration.
          Your private photos, personal identification documents, and sensitive creative work never touch the cloud.
        </p>

        <h3>Key Capabilities</h3>
        <ul>
          <li><strong>Smart Lossy Compression:</strong> Removes redundant color and pixel frequency data imperceptible to human vision.</li>
          <li><strong>Modern Format Transcoding:</strong> Convert legacy JPEG and PNG images to ultra-compact Google WebP format.</li>
          <li><strong>Geometric Downscaling:</strong> Proportionally scale large 4K or 8K images down to 75%, 50%, or 25% for instant web performance gains.</li>
          <li><strong>Zero Watermarks or Artificial Limits:</strong> 100% free with unlimited image optimizations.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="image-compressor" />
    </div>
  )
}
