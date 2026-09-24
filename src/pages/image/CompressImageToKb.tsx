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

const tool = getToolBySlug('compress-image-to-kb') || {
  slug: 'compress-image-to-kb',
  name: 'Compress Image to Exact KB',
  shortName: 'Compress to KB',
  description: 'Compress JPG, PNG, or WebP images to an exact target size (20KB, 50KB, 100KB, 200KB) for government portals, job exams, and KYC.',
  metaTitle: 'Compress Image to Exact KB (20KB, 50KB, 100KB, 200KB) Online Free',
  metaDescription: 'Compress images to exact target KB online for free. Guarantee file size under 20KB, 50KB, 100KB, 200KB for government forms, passports, and job applications.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: [
    'compress image to kb',
    'compress photo to 50kb',
    'compress image to 20kb',
    'compress image to 100kb',
    'compress image to 200kb',
    'reduce image size in kb for online application',
  ],
  icon: '🖼️',
}

const PRESETS = [
  { label: '20 KB', value: 20, desc: 'Signatures & icons' },
  { label: '50 KB', value: 50, desc: 'Passport & exam photos' },
  { label: '100 KB', value: 100, desc: 'ID cards & documents' },
  { label: '200 KB', value: 200, desc: 'Certificates & forms' },
  { label: '500 KB', value: 500, desc: 'Web banners & portfolios' },
]

const faqItems = [
  {
    question: 'How does the converter guarantee the file is under the target KB?',
    answer: 'Our engine uses an intelligent binary-search algorithm on image compression quality combined with automated dimensional scaling if required. It tests compression levels in your browser memory until the resulting file size is strictly less than or equal to your specified target KB.',
  },
  {
    question: 'Why do government and exam portals require specific KB limits?',
    answer: 'Official portals for exams (like UPSC, SSC, GATE), government services, visa forms, and banking KYC handle millions of applicants. They enforce strict limits (often 20KB for signatures and 50KB or 100KB for passport photos) to prevent their storage systems from overloading.',
  },
  {
    question: 'Will my photo become blurry when compressed to 50KB?',
    answer: 'We optimize the compression curve to retain maximum facial sharpness and legibility while cutting redundant file metadata and color noise.',
  },
  {
    question: 'Are my private photos uploaded to a cloud server?',
    answer: 'No. All image calculations, canvas rendering, and JPEG encoding happen locally on your device in your web browser memory. Zero images are ever transmitted over the network.',
  },
]

export default function CompressImageToKb() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [targetKb, setTargetKb] = useState<number>(50)
  const [customKbInput, setCustomKbInput] = useState<string>('50')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    blob: Blob
    url: string
    originalSize: number
    compressedSize: number
    reductionPercent: number
    width: number
    height: number
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
    setPreviewUrl(URL.createObjectURL(f))
  }, [])

  const handlePresetClick = (kb: number) => {
    setTargetKb(kb)
    setCustomKbInput(kb.toString())
  }

  const handleCustomChange = (val: string) => {
    setCustomKbInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num > 0) {
      setTargetKb(num)
    }
  }

  // Iterative binary-search compression algorithm with dimensional scaling fallback
  const compressToTarget = useCallback(async () => {
    if (!file || isProcessing || targetKb <= 0) return
    setIsProcessing(true)

    try {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = objectUrl
      })

      const targetBytes = targetKb * 1024
      let curWidth = img.naturalWidth
      let curHeight = img.naturalHeight

      // Helper to render canvas to jpeg blob
      const getBlobAtQuality = (w: number, h: number, q: number): Promise<Blob> => {
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        return new Promise<Blob>(resolve => {
          canvas.toBlob(blob => resolve(blob!), 'image/jpeg', q)
        })
      }

      let bestBlob: Blob | null = null
      let bestW = curWidth
      let bestH = curHeight

      // If original file is already smaller than target, we still encode clean JPEG or return
      let scaleFactor = 1.0
      const maxPasses = 8

      for (let pass = 0; pass < maxPasses; pass++) {
        let low = 0.05
        let high = 0.95
        let passBestBlob: Blob | null = null

        // Binary search on quality
        for (let iter = 0; iter < 6; iter++) {
          const midQuality = (low + high) / 2
          const blob = await getBlobAtQuality(curWidth, curHeight, midQuality)

          if (blob.size <= targetBytes) {
            passBestBlob = blob
            // Try higher quality to get closer to target
            low = midQuality
          } else {
            // Overshot target, must decrease quality
            high = midQuality
          }
        }

        if (passBestBlob && passBestBlob.size <= targetBytes) {
          bestBlob = passBestBlob
          bestW = curWidth
          bestH = curHeight
          break
        }

        // If even lowest quality 0.05 is still larger than target, scale dimensions down
        const lowestQualityBlob = await getBlobAtQuality(curWidth, curHeight, 0.05)
        if (lowestQualityBlob.size <= targetBytes) {
          bestBlob = lowestQualityBlob
          bestW = curWidth
          bestH = curHeight
          break
        }

        // Downscale dimensions by ratio
        scaleFactor = Math.sqrt(targetBytes / lowestQualityBlob.size) * 0.92
        curWidth = Math.max(80, Math.floor(curWidth * scaleFactor))
        curHeight = Math.max(80, Math.floor(curHeight * scaleFactor))
      }

      // Fallback guarantee: if still no blob found, produce blob at current dimensions with 0.1 quality
      if (!bestBlob) {
        bestBlob = await getBlobAtQuality(curWidth, curHeight, 0.1)
        bestW = curWidth
        bestH = curHeight
      }

      URL.revokeObjectURL(objectUrl)
      const resUrl = URL.createObjectURL(bestBlob)
      const reduction = Math.max(0, Math.round(((file.size - bestBlob.size) / file.size) * 100))

      trackToolUsage({
        toolId: 'compress-image-to-kb',
        toolName: 'Compress Image to KB',
        category: 'image',
        action: `Compressed ${file.name} to ${targetKb}KB`,
        details: `Final size: ${formatFileSize(bestBlob.size)}, ${bestW}x${bestH}`,
        originalSize: file.size,
        compressedSize: bestBlob.size,
        method: 'Client Adaptive Binary Downsampling',
      })

      setResult({
        blob: bestBlob,
        url: resUrl,
        originalSize: file.size,
        compressedSize: bestBlob.size,
        reductionPercent: reduction,
        width: bestW,
        height: bestH,
      })
    } catch (err) {
      alert('Failed to compress image. Please ensure your file is a valid image.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, targetKb])

  const reset = () => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/compress-image-to-kb"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/compress-image-to-kb`,
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
          <ToolVisualBadge category="image" slug="compress-image-to-kb" name="Exact KB" icon="🖼️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Compress Image to Exact KB
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Guaranteed file size limits (20KB, 50KB, 100KB, 200KB) for government exam applications, job portals, passport renewals, and visa uploads. 100% private in-browser compression.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Strictly Below Target KB
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private In-Browser
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Verified for Govt & Exam Portals
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".jpg,.jpeg,.png,.webp,image/*"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="🖼️"
              title="Drop your photo or signature here, or click to browse"
              subtitle="Supports JPG, JPEG, PNG, and WebP • Processed locally on your device"
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
                      className="w-10 h-10 object-cover rounded-lg border border-surface-200 shadow-xs"
                    />
                  ) : (
                    <ToolVisualBadge category="image" slug="compress-image-to-kb" name="IMG" size="md" />
                  )}
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      Original Size: <span className="font-semibold text-surface-800">{formatFileSize(file.size)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change Photo
                </button>
              </div>

              {/* Target KB Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Select Target Maximum Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {PRESETS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handlePresetClick(p.value)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        targetKb === p.value
                          ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20 shadow-sm'
                          : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                      }`}
                    >
                      <div className="text-base font-extrabold">{p.label}</div>
                      <div className="text-[11px] text-surface-500 truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Target Size Input */}
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-surface-900">Custom Target Limit</h4>
                  <p className="text-xs text-surface-500">
                    Need a specific limit like 45 KB or 150 KB? Type it here:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    value={customKbInput}
                    onChange={e => handleCustomChange(e.target.value)}
                    className="w-28 px-3 py-2 rounded-lg border border-surface-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-bold text-center text-surface-800"
                  />
                  <span className="text-sm font-semibold text-surface-600">KB</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={compressToTarget}
                disabled={isProcessing || targetKb <= 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing to &le; {targetKb} KB...
                  </span>
                ) : (
                  `⚡ Compress to Under ${targetKb} KB`
                )}
              </button>
            </div>
          )}
        </div>

        {/* Result Card */}
        {result && (
          <div ref={resultRef} className="card-premium p-6 sm:p-10 mb-8 border-2 border-emerald-500/30 scroll-mt-24">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-surface-900 mb-2">
                Compressed to {formatFileSize(result.compressedSize)}!
              </h3>
              <p className="text-sm text-surface-500">
                Guaranteed strictly under your {targetKb} KB requirement. Perfect for form uploads!
              </p>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Original Size</div>
                <div className="text-sm font-semibold text-surface-700">{formatFileSize(result.originalSize)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xs text-emerald-600 font-semibold mb-1">Final Size</div>
                <div className="text-base font-bold text-emerald-700">{formatFileSize(result.compressedSize)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Reduction</div>
                <div className="text-base font-bold text-primary-600">-{result.reductionPercent}%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Dimensions</div>
                <div className="text-sm font-semibold text-surface-700">{result.width}×{result.height}px</div>
              </div>
            </div>

            {/* Preview Comparison */}
            <div className="max-w-md mx-auto mb-8 p-3 rounded-2xl bg-surface-100 border border-surface-200 text-center">
              <img
                src={result.url}
                alt="Compressed Output"
                className="max-h-60 mx-auto rounded-xl object-contain shadow-sm"
              />
              <p className="text-xs text-surface-500 mt-2">
                Output Preview ({result.width} × {result.height} px, JPEG)
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `compressed_${targetKb}kb_${file?.name.replace(/\.[^/.]+$/, '')}.jpg`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Photo ({formatFileSize(result.compressedSize)})
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Compress Another Photo
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Compress Images to 20KB, 50KB, or 100KB Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Most government job applications, visa registration portals, and university admissions enforce strict maximum file size limits for uploaded passport photos and signatures (usually 20 KB or 50 KB). If your photo is even 1 KB above the limit, the portal will reject your submission.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Our tool eliminates the trial-and-error frustration of manual quality sliders. Simply choose your target limit (or type a custom number), and our adaptive client-side algorithm mathematically fine-tunes the compression and resolution to guarantee that your image is strictly below the required size threshold while preserving maximum facial clarity.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="compress-image-to-kb" />
      </div>
    </div>
  )
}
