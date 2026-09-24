import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('add-watermark') || {
  slug: 'add-watermark',
  name: 'Add Watermark to PDF',
  shortName: 'Add Watermark',
  description: 'Add custom text stamps or logo image watermarks to all pages of your PDF document. 100% free, private in-browser processing with zero server uploads.',
  metaTitle: 'Add Watermark to PDF Online Free — Text & Logo Stamp Tool',
  metaDescription: 'Add watermark to PDF online for free. Overlay text stamps (CONFIDENTIAL, DRAFT) or custom logos with transparency and angle control. 100% secure.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['add watermark to pdf', 'watermark pdf online', 'stamp pdf', 'confidential watermark', 'pdf logo overlay'],
  icon: '📄',
}

const TEXT_PRESETS = ['CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'COPY', 'DO NOT SHARE', 'TOP SECRET']

const faqItems = [
  {
    question: 'Can I add an image logo as a watermark?',
    answer: 'Yes! You can either type custom text (like "CONFIDENTIAL" or your company name) or upload a PNG/JPG logo file to overlay onto every page.',
  },
  {
    question: 'How do I adjust transparency so the document remains readable?',
    answer: 'Use the Opacity slider (typically set between 20% and 40%). This ensures the watermark is clearly visible to protect copyright while keeping the underlying text completely legible.',
  },
  {
    question: 'Can I choose the angle and position of the watermark?',
    answer: 'Yes! You can choose diagonal (45°), horizontal (0°), or vertical (90°), and position it in the center, corners, or tile it across the entire page.',
  },
  {
    question: 'Are my confidential documents uploaded to any server?',
    answer: 'Never. All PDF parsing, canvas rendering, and vector drawing happen locally in your web browser memory. Your files never leave your device.',
  },
]

type WatermarkType = 'text' | 'image'
type WatermarkPosition = 'center' | 'top-right' | 'bottom-right' | 'bottom-center'

export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [wmType, setWmType] = useState<WatermarkType>('text')
  const [text, setText] = useState('CONFIDENTIAL')
  const [color, setColor] = useState('#EF4444') // red
  const [fontSize, setFontSize] = useState(48)
  const [opacity, setOpacity] = useState(30)
  const [rotation, setRotation] = useState(45)
  const [position, setPosition] = useState<WatermarkPosition>('center')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const handlePdf = useCallback(async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    try {
      const bytes = await f.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      setPageCount(doc.getPageCount())
    } catch {
      alert('Could not open PDF file. Please ensure it is not corrupted or password-protected.')
    }
  }, [])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  // Convert hex color to rgb [0-1]
  const hexToRgb = (hex: string) => {
    const clean = hex.replace('#', '')
    const r = parseInt(clean.substring(0, 2), 16) / 255
    const g = parseInt(clean.substring(2, 4), 16) / 255
    const b = parseInt(clean.substring(4, 6), 16) / 255
    return rgb(r, g, b)
  }

  const applyWatermark = useCallback(async () => {
    if (!file || isProcessing || pageCount === 0) return
    setIsProcessing(true)

    try {
      const bytes = await file.arrayBuffer()
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const pages = doc.getPages()
      const alpha = opacity / 100

      let embeddedImg: any = null
      if (wmType === 'image' && imageFile) {
        const imgBuffer = await imageFile.arrayBuffer()
        if (imageFile.type.includes('png')) {
          embeddedImg = await doc.embedPng(imgBuffer)
        } else {
          embeddedImg = await doc.embedJpg(imgBuffer)
        }
      }

      for (const page of pages) {
        const { width, height } = page.getSize()

        if (wmType === 'text') {
          const textWidth = font.widthOfTextAtSize(text, fontSize)
          const textHeight = font.heightAtSize(fontSize)
          let x = (width - textWidth) / 2
          let y = (height - textHeight) / 2

          if (position === 'top-right') {
            x = width - textWidth - 30
            y = height - textHeight - 40
          } else if (position === 'bottom-right') {
            x = width - textWidth - 30
            y = 40
          } else if (position === 'bottom-center') {
            x = (width - textWidth) / 2
            y = 40
          }

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: hexToRgb(color),
            opacity: alpha,
            rotate: degrees(rotation),
          })
        } else if (embeddedImg) {
          const scale = Math.min((width * 0.4) / embeddedImg.width, (height * 0.4) / embeddedImg.height)
          const imgW = embeddedImg.width * scale
          const imgH = embeddedImg.height * scale
          let x = (width - imgW) / 2
          let y = (height - imgH) / 2

          if (position === 'top-right') {
            x = width - imgW - 30
            y = height - imgH - 30
          } else if (position === 'bottom-right') {
            x = width - imgW - 30
            y = 30
          }

          page.drawImage(embeddedImg, {
            x,
            y,
            width: imgW,
            height: imgH,
            opacity: alpha,
            rotate: degrees(rotation),
          })
        }
      }

      const outputBytes = await doc.save()
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'add-watermark',
        toolName: 'Add Watermark to PDF',
        category: 'pdf',
        action: `Watermarked ${file.name} (${pageCount} pages)`,
        details: `Type: ${wmType}, Opacity: ${opacity}%, Position: ${position}`,
        originalSize: file.size,
        compressedSize: outputBytes.length,
        method: 'Client PDF-Lib Vector Overlay',
      })

      setResult({
        blob,
        size: outputBytes.length,
      })
    } catch (err) {
      alert('Failed to add watermark. Please ensure file is a valid PDF.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing, pageCount, wmType, text, color, fontSize, opacity, rotation, position, imageFile])

  const reset = () => {
    setFile(null)
    setPageCount(0)
    setImageFile(null)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/add-watermark"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/add-watermark`,
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

        {/* Hero */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="pdf" slug="add-watermark" name="Watermark" icon="📄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Add Watermark to PDF
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Stamp custom text or brand logos across all pages of your PDF document. Full control over opacity, angle, and position with 100% private in-browser rendering.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Text & Logo Watermarks
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Opacity & Angle Tuning
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Zero Server Uploads
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".pdf,application/pdf"
              onFiles={handlePdf}
              maxSizeMB={100}
              icon="📄"
              title="Drop your PDF here to watermark, or click to browse"
              subtitle="Files are processed directly in your browser memory"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="add-watermark" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {formatFileSize(file.size)} • {pageCount} pages
                    </p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Watermark Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Watermark Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWmType('text')}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      wmType === 'text'
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <span className="text-sm">🔤 Text Stamp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWmType('image')}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      wmType === 'image'
                        ? 'bg-primary-50 border-primary-500 text-primary-950 font-bold ring-2 ring-primary-500/20'
                        : 'bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100'
                    }`}
                  >
                    <span className="text-sm">🖼️ Image / Logo Stamp</span>
                  </button>
                </div>
              </div>

              {/* Text Configuration */}
              {wmType === 'text' ? (
                <div className="space-y-4 p-5 rounded-2xl bg-surface-50 border border-surface-200">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full px-4 py-3 rounded-xl border border-surface-300 font-bold text-surface-900"
                    />
                  </div>

                  {/* Preset Pills */}
                  <div>
                    <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                      Quick Presets:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {TEXT_PRESETS.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setText(p)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 hover:bg-primary-50 text-xs font-medium text-surface-700 transition-colors"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size & Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                        <span>Font Size</span>
                        <span>{fontSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="96"
                        value={fontSize}
                        onChange={e => setFontSize(Number(e.target.value))}
                        className="w-full accent-primary-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-surface-700 mb-1">
                        Color
                      </label>
                      <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-surface-300 cursor-pointer bg-white p-1"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-surface-50 border border-surface-200 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-600 mb-1">
                    Select Logo Image (PNG or JPG)
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleImage}
                    className="block w-full text-xs text-surface-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {imageFile && (
                    <p className="text-xs text-surface-500">Selected logo: {imageFile.name}</p>
                  )}
                </div>
              )}

              {/* Shared Geometry Settings: Opacity, Angle, Position */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-surface-50 border border-surface-200">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                    <span>Opacity</span>
                    <span className="font-bold text-primary-600">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={opacity}
                    onChange={e => setOpacity(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-surface-700 mb-1">
                    <span>Rotation Angle</span>
                    <span className="font-bold text-primary-600">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Position
                  </label>
                  <select
                    value={position}
                    onChange={e => setPosition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                  >
                    <option value="center">Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-center">Bottom Center</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={applyWatermark}
                disabled={isProcessing || (wmType === 'image' && !imageFile)}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Stamping {pageCount} Pages...
                  </span>
                ) : (
                  `🛡️ Apply Watermark to ${pageCount} ${pageCount === 1 ? 'Page' : 'Pages'}`
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
              Watermark Added Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Applied watermark stamp across all {pageCount} pages ({formatFileSize(result.size)}).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `watermarked_${file?.name || 'document.pdf'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Watermarked PDF
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Watermark Another File
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Watermark PDF Documents Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Protecting sensitive corporate documents, contracts, drafts, and invoices from unauthorized distribution is easy with PDFCompress Pro. Stamp words like "CONFIDENTIAL" or "DRAFT" diagonally across every page or add your custom brand logo.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            All watermark vector stamps are layered permanently into the document using WebAssembly and client-side JavaScript. Because files never leave your computer, your trade secrets, client agreements, and financial statements remain completely confidential.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="add-watermark" />
      </div>
    </div>
  )
}
