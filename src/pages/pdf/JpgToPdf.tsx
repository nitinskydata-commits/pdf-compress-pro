import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('jpg-to-pdf') || {
  slug: 'jpg-to-pdf',
  name: 'JPG to PDF Converter',
  shortName: 'JPG to PDF',
  description: 'Convert JPG, JPEG, PNG, and WebP images into a single organized PDF document. 100% free, private browser-based tool with zero server uploads.',
  metaTitle: 'JPG to PDF Converter Online Free — Convert Images to PDF',
  metaDescription: 'Convert JPG to PDF online for free. Combine multiple photos into one clean PDF document. Reorder images, customize page orientation and margins.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['jpg to pdf', 'convert jpg to pdf', 'images to pdf', 'png to pdf', 'photo to pdf converter online'],
  icon: '📄',
}

const faqItems = [
  {
    question: 'Can I combine multiple pictures into one PDF file?',
    answer: 'Yes! Select as many JPG, PNG, or WebP pictures as you want. Each image will be converted into a page in your combined PDF in the order you specify.',
  },
  {
    question: 'How do I change the page order before converting?',
    answer: 'Use the Up (↑) and Down (↓) arrow buttons on each image card in the workspace to arrange the pages in your desired sequence.',
  },
  {
    question: 'Can I set standard A4 dimensions or add white borders?',
    answer: 'Yes! You can choose between "Fit to Image" (which sets the page size exactly to your photo dimensions), "Standard A4", or "US Letter", and add small or normal white margins.',
  },
  {
    question: 'Are my private photos uploaded to any external server?',
    answer: 'No. All image processing and PDF compilation execute 100% locally inside your web browser via pdf-lib. Your photos never leave your device.',
  },
]

type PageLayout = 'fit' | 'a4' | 'letter'
type PageOrientation = 'auto' | 'portrait' | 'landscape'
type PageMargin = 'none' | 'small' | 'normal'

interface ImageItem {
  file: File
  preview: string
  width: number
  height: number
}

export default function JpgToPdf() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [layout, setLayout] = useState<PageLayout>('fit')
  const [orientation, setOrientation] = useState<PageOrientation>('auto')
  const [margin, setMargin] = useState<PageMargin>('none')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; pages: number; size: number } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const addFiles = useCallback(async (newFiles: File[]) => {
    const valid = newFiles.filter(f => f.type.startsWith('image/'))
    if (valid.length === 0) return

    const loadedItems: ImageItem[] = []
    for (const f of valid) {
      const url = URL.createObjectURL(f)
      await new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          loadedItems.push({
            file: f,
            preview: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
          resolve()
        }
        img.onerror = () => resolve()
        img.src = url
      })
    }

    setImages(prev => [...prev, ...loadedItems])
    setResult(null)
  }, [])

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const moveImage = (from: number, to: number) => {
    setImages(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
    setResult(null)
  }

  const convertToPdf = useCallback(async () => {
    if (images.length === 0 || isProcessing) return
    setIsProcessing(true)

    try {
      const doc = await PDFDocument.create()

      for (const item of images) {
        let imgBytes: ArrayBuffer
        let isPng = item.file.type.includes('png')

        // If WebP or other format, transcode via canvas to clean JPEG
        if (item.file.type.includes('webp') || (!item.file.type.includes('jpeg') && !isPng)) {
          const canvas = document.createElement('canvas')
          canvas.width = item.width
          canvas.height = item.height
          const ctx = canvas.getContext('2d')!
          const img = new Image()
          img.src = item.preview
          await new Promise<void>(res => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0)
              res()
            }
          })
          const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.95))
          imgBytes = await blob.arrayBuffer()
          isPng = false
        } else {
          imgBytes = await item.file.arrayBuffer()
        }

        const embedded = isPng
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes)

        // Calculate page dimension
        let pageW = embedded.width
        let pageH = embedded.height

        if (layout === 'a4') {
          // Standard A4 points (595.28 x 841.89)
          pageW = 595.28
          pageH = 841.89
        } else if (layout === 'letter') {
          // Standard US Letter points (612 x 792)
          pageW = 612
          pageH = 792
        }

        if (orientation === 'landscape' && pageH > pageW) {
          const temp = pageW
          pageW = pageH
          pageH = temp
        } else if (orientation === 'portrait' && pageW > pageH) {
          const temp = pageW
          pageW = pageH
          pageH = temp
        } else if (orientation === 'auto' && layout !== 'fit') {
          if (embedded.width > embedded.height && pageH > pageW) {
            const temp = pageW
            pageW = pageH
            pageH = temp
          }
        }

        let marginPts = 0
        if (margin === 'small') marginPts = 20
        if (margin === 'normal') marginPts = 40

        const availW = Math.max(10, pageW - marginPts * 2)
        const availH = Math.max(10, pageH - marginPts * 2)

        const scale = Math.min(availW / embedded.width, availH / embedded.height, layout === 'fit' ? 1 : 999)
        const drawW = embedded.width * scale
        const drawH = embedded.height * scale

        const finalPageW = layout === 'fit' ? drawW + marginPts * 2 : pageW
        const finalPageH = layout === 'fit' ? drawH + marginPts * 2 : pageH

        const page = doc.addPage([finalPageW, finalPageH])
        const x = (finalPageW - drawW) / 2
        const y = (finalPageH - drawH) / 2

        page.drawImage(embedded, {
          x,
          y,
          width: drawW,
          height: drawH,
        })
      }

      const outputBytes = await doc.save()
      const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

      trackToolUsage({
        toolId: 'jpg-to-pdf',
        toolName: 'JPG to PDF Converter',
        category: 'pdf',
        action: `Converted ${images.length} images to PDF`,
        details: `Layout: ${layout}, Orientation: ${orientation}, Margins: ${margin}`,
        originalSize: images.reduce((acc, curr) => acc + curr.file.size, 0),
        compressedSize: outputBytes.length,
        method: 'Client PDF-Lib Multi-Image Compiler',
      })

      setResult({
        blob,
        pages: images.length,
        size: outputBytes.length,
      })
    } catch (err) {
      alert('Failed to generate PDF. Please ensure all image files are valid.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [images, isProcessing, layout, orientation, margin])

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/jpg-to-pdf"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/jpg-to-pdf`,
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
          <ToolVisualBadge category="pdf" slug="jpg-to-pdf" name="JPG to PDF" icon="📄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            JPG to PDF Converter Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert JPG, PNG, and WebP photos into clean, organized PDF documents. Reorder pages, customize orientation, and download instantly without quality loss.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Original Image Resolution
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Multi-Image Page Reordering
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% In-Browser Privacy
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          <FileUploader
            accept="image/*,.jpg,.jpeg,.png,.webp"
            multiple
            onFiles={addFiles}
            maxSizeMB={50}
            icon="📄"
            title="Drop images here to convert to PDF, or click to browse"
            subtitle="Select multiple JPG, PNG, or WebP photos • Processed 100% in your browser"
          />

          {images.length > 0 && (
            <div className="mt-8 space-y-6">
              {/* Header and Clear All */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-surface-900">
                    Selected Images ({images.length})
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">
                    {images.length} {images.length === 1 ? 'Page' : 'Pages'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-danger-600 hover:text-danger-700 font-semibold"
                >
                  Clear All
                </button>
              </div>

              {/* Page Layout Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-50 border border-surface-200">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">
                    Page Size
                  </label>
                  <select
                    value={layout}
                    onChange={e => setLayout(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                  >
                    <option value="fit">Fit to Image (No Borders)</option>
                    <option value="a4">Standard A4 (Print)</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">
                    Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={e => setOrientation(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                  >
                    <option value="auto">Auto (Match Image)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">
                    Margins
                  </label>
                  <select
                    value={margin}
                    onChange={e => setMargin(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-300 text-xs font-semibold bg-white"
                  >
                    <option value="none">No Margin</option>
                    <option value="small">Small Margin (10mm)</option>
                    <option value="normal">Normal Margin (20mm)</option>
                  </select>
                </div>
              </div>

              {/* Reorderable Thumbnail Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                {images.map((item, idx) => (
                  <div
                    key={`${item.file.name}-${idx}`}
                    className="p-2.5 bg-surface-50 rounded-xl border border-surface-200 relative group flex flex-col justify-between"
                  >
                    <div className="relative overflow-hidden rounded-lg bg-surface-200 mb-2 aspect-4/3">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="text-left">
                      <p className="font-semibold text-xs text-surface-900 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-[10px] text-surface-500">
                        {item.width} × {item.height} px
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-200">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Move Left"
                          className="w-6 h-6 rounded bg-white hover:bg-surface-200 text-surface-700 disabled:opacity-30 text-xs font-bold flex items-center justify-center border border-surface-200"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(idx, idx + 1)}
                          disabled={idx === images.length - 1}
                          title="Move Right"
                          className="w-6 h-6 rounded bg-white hover:bg-surface-200 text-surface-700 disabled:opacity-30 text-xs font-bold flex items-center justify-center border border-surface-200"
                        >
                          →
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="text-danger-600 hover:text-danger-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-danger-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={convertToPdf}
                disabled={isProcessing}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Assembling Document...
                  </span>
                ) : (
                  `📑 Create PDF Document (${images.length} ${
                    images.length === 1 ? 'Page' : 'Pages'
                  })`
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
              PDF Document Created Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Combined {result.pages} {result.pages === 1 ? 'image' : 'images'} into a single PDF ({formatFileSize(result.size)}).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `converted_images_${images.length}pages.pdf`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download PDF Document
              </button>
              <button onClick={clearAll} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Convert More Images
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Convert JPG and PNG Images to PDF Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to combine passport scans, receipts, photo albums, or presentation slides into one easy-to-share PDF? PDFCompress Pro lets you drop multiple pictures, rearrange them into your preferred reading order, and select standard A4 or full-bleed page dimensions.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            The conversion engine builds your PDF using client-side WebAssembly, ensuring that your confidential financial documents and family photos never leave your device.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="jpg-to-pdf" />
      </div>
    </div>
  )
}
