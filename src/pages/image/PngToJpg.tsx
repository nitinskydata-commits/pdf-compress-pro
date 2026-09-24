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

const tool = getToolBySlug('png-to-jpg') || {
  slug: 'png-to-jpg',
  name: 'PNG to JPG Converter',
  metaTitle: 'PNG to JPG Converter — Custom Transparency Background & Size Optimization',
  metaDescription: 'Convert PNG images with transparent backgrounds to high-quality JPG files. Select custom background fill color, adjust compression, and download instantly.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: ['png to jpg', 'convert png to jpg', 'png to jpeg', 'transparent png to jpg white background', 'free image converter'],
  icon: '🖼️',
}

const faqItems = [
  {
    question: 'What happens to transparent areas when converting PNG to JPG?',
    answer: 'Because the JPG format does not support transparency (alpha channels), transparent pixels must be filled with a solid color. By default, our tool cleanly fills transparency with crisp pure white, or you can choose any custom color.',
  },
  {
    question: 'How much smaller will the JPG file be compared to PNG?',
    answer: 'For photography and complex graphics, converting PNG to JPG typically reduces file size by 60% to 85% with virtually unnoticeable difference in visual quality.',
  },
  {
    question: 'Are my files private and secure?',
    answer: 'Yes! The entire process takes place 100% locally in your web browser. No photos or images are ever uploaded to an external server.',
  },
]

export default function PngToJpg() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState('#ffffff')
  const [quality, setQuality] = useState(88)
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

  const convertToJpg = useCallback(async () => {
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

      // 1. Fill solid background behind transparency
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, targetW, targetH)

      // 2. Draw PNG image on top
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetW, targetH)

      // 3. Export as JPG with chosen quality
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('JPG conversion failed'))),
          'image/jpeg',
          quality / 100
        )
      })

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        width: targetW,
        height: targetH,
      })

      const saved = Math.max(0, file.size - blob.size)
      const reduction = Math.round((saved / file.size) * 100)

      trackToolUsage({
        toolId: 'png-to-jpg',
        toolName: 'PNG to JPG Converter',
        category: 'image',
        action: `Converted ${file.name} to JPG (${reduction}% size reduction)`,
        details: `Background Color: ${bgColor}, Quality: ${quality}%, Scale: ${scale}%`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas PNG to JPG',
      })
    } catch {
      alert('Could not convert image. Please ensure file is a valid PNG.')
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, bgColor, quality, scale])

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/png-to-jpg"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/png-to-jpg`,
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
          <ToolVisualBadge category="image" slug="png-to-jpg" name="PNG to JPG" icon="🖼️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            PNG to JPG Converter
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert PNG graphics into lightweight JPG files. Choose a clean solid background color for transparent areas and adjust compression to minimize storage size.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Clean Alpha Fill (No Black Borders)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 60–85% Smaller File Size
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private in Browser
            </span>
          </div>
        </div>

        {/* Interactive Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".png,image/png"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="🖼️"
              title="Drop your PNG image here, or click to browse"
              subtitle="Files are processed 100% locally in your browser memory"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="image" slug="png-to-jpg" name="PNG" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">{file.name}</p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)} • Source PNG</p>
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
                {/* Live Preview Box with Selected Background Color */}
                <div
                  className="p-4 rounded-2xl border border-surface-200 flex flex-col items-center justify-center min-h-[260px] overflow-hidden transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  {preview && (
                    <img
                      src={preview}
                      alt="Source Preview"
                      className="max-h-[260px] w-auto object-contain rounded-lg shadow-sm"
                    />
                  )}
                  <span className={`text-[11px] font-semibold mt-2 px-2 py-0.5 rounded ${bgColor === '#000000' ? 'text-white bg-white/20' : 'text-surface-700 bg-surface-200/60'}`}>
                    Background Fill: {bgColor.toUpperCase()}
                  </span>
                </div>

                {/* Configuration Panel */}
                <div className="space-y-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500">Output Settings</h4>

                  {/* Transparency Background Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-700">Transparency Background Fill</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: 'White', color: '#ffffff' },
                        { label: 'Black', color: '#000000' },
                        { label: 'Light Gray', color: '#f1f5f9' },
                        { label: 'Cream', color: '#fffbeb' },
                      ].map(preset => (
                        <button
                          key={preset.color}
                          onClick={() => setBgColor(preset.color)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            bgColor === preset.color
                              ? 'bg-primary-50 border-primary-600 text-primary-700'
                              : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                          }`}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: preset.color }} />
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      {/* Custom Color Input */}
                      <label className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-surface-200 bg-surface-50 text-surface-700 hover:bg-surface-100 cursor-pointer flex items-center gap-1.5">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={e => setBgColor(e.target.value)}
                          className="w-4 h-4 rounded cursor-pointer border-none"
                        />
                        <span>Custom</span>
                      </label>
                    </div>
                  </div>

                  {/* JPG Compression Quality Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-surface-700">
                      <span>JPG Quality</span>
                      <span>{quality}% {quality >= 85 ? '(High Quality)' : quality >= 65 ? '(Balanced)' : '(Smallest Size)'}</span>
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

                  {/* Resolution Scale */}
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
                    onClick={convertToJpg}
                    disabled={isProcessing}
                    className="btn-primary w-full py-3.5 text-base font-bold shadow-md cursor-pointer"
                  >
                    {isProcessing ? 'Encoding JPG...' : 'Convert to JPG →'}
                  </button>
                </div>
              </div>

              {/* Conversion Result Card */}
              {result && (
                <div ref={resultRef} className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fade-in">
                  <span className="text-3xl block">🎉</span>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">JPG Successfully Created!</h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      Output Size: <strong>{formatFileSize(result.blob.size)}</strong> (Original was {formatFileSize(file.size)}) • {result.width} × {result.height}px
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => downloadBlob(result.blob, `${file.name.replace(/\.[^/.]+$/, '')}.jpg`)}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-md"
                    >
                      <span>⬇️</span> Download JPG Image
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
            <span className="text-2xl mb-2 block">📉</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Dramatic File Size Savings</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              JPG compression downsamples redundant chrominance signals, reducing document image sizes by up to 80%.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">🎨</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Custom Background Fill</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              Fill transparent areas with clean white, black, or custom branding colors without ugly black edges.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-surface-200">
            <span className="text-2xl mb-2 block">🌐</span>
            <h3 className="font-bold text-surface-900 text-sm mb-1">Universal Compatibility</h3>
            <p className="text-xs text-surface-600 leading-relaxed">
              JPG is universally supported on government portals, email clients, social platforms, and older mobile devices.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="card-premium p-6 sm:p-8 mb-12">
          <h2 className="text-xl font-bold text-surface-900 mb-6">Frequently Asked Questions</h2>
          <FAQ items={faqItems} />
        </div>

        {/* Related Tools */}
        <RelatedTools currentSlug="png-to-jpg" />
      </div>
    </div>
  )
}
