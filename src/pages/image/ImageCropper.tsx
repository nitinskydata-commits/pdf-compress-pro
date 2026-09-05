import { useState, useCallback, useRef, useEffect } from 'react'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob, formatFileSize } from '../../utils/fileUtils'

const tool = getToolBySlug('image-cropper')!
const ratios = [
  { label: 'Free (Flexible)', v: 0 },
  { label: '1:1 Square', v: 1 },
  { label: '4:3 Standard', v: 4 / 3 },
  { label: '16:9 Landscape', v: 16 / 9 },
  { label: '3:2 Classic', v: 3 / 2 },
  { label: '9:16 Story', v: 9 / 16 },
]

const faqItems = [
  { question: 'How do I resize or move the crop box?', answer: 'Drag anywhere inside the box to move it. Drag any of the 4 corner handles or edges to freely resize the crop area on mobile or desktop.' },
  { question: 'Is cropping locked to fixed ratios?', answer: 'No! By default it is in Free (Flexible) mode. You can drag the handles to any custom dimension, or choose a preset if you want exact proportions.' },
  { question: 'Does cropping reduce photo quality?', answer: 'No! The cropped area is extracted directly from the original image resolution without re-compression degradation.' },
]

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e'

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState(0) // 0 = Free/flexible
  const [result, setResult] = useState<{ blob: Blob; url: string; w: number; h: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    handle: DragHandle
    startX: number
    startY: number
    initialCrop: CropRect
    rect: DOMRect
  } | null>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setResult(null)
    const url = URL.createObjectURL(f)
    setImgUrl(url)

    const img = new Image()
    img.src = url
    img.onload = () => {
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      setImgSize({ w: naturalW, h: naturalH })
      // Initial default crop: 80% centered
      const initialW = Math.round(naturalW * 0.8)
      const initialH = Math.round(naturalH * 0.8)
      setCrop({
        x: Math.round((naturalW - initialW) / 2),
        y: Math.round((naturalH - initialH) / 2),
        w: initialW,
        h: initialH,
      })
    }
  }, [])

  // When aspect ratio preset changes
  useEffect(() => {
    if (ratio > 0 && imgSize.w > 0 && imgSize.h > 0) {
      let newW = crop.w
      let newH = Math.round(newW / ratio)
      if (newH > imgSize.h) {
        newH = imgSize.h
        newW = Math.round(newH * ratio)
      }
      const newX = Math.max(0, Math.min(crop.x, imgSize.w - newW))
      const newY = Math.max(0, Math.min(crop.y, imgSize.h - newH))
      setCrop({ x: newX, y: newY, w: newW, h: newH })
    }
  }, [ratio, imgSize])

  // Scroll to result when complete
  useEffect(() => {
    if (result) {
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 80)
    }
  }, [result])

  // Interactive Drag & Resize Handler (Pointer Events)
  const startDrag = (e: React.PointerEvent, handle: DragHandle) => {
    e.preventDefault()
    e.stopPropagation()
    if (!containerRef.current) return

    const target = e.currentTarget as HTMLElement
    try {
      target.setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }

    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      rect: containerRef.current.getBoundingClientRect(),
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || imgSize.w === 0 || imgSize.h === 0) return
    const { handle, startX, startY, initialCrop, rect } = dragRef.current

    const scaleX = imgSize.w / rect.width
    const scaleY = imgSize.h / rect.height

    const deltaX = (e.clientX - startX) * scaleX
    const deltaY = (e.clientY - startY) * scaleY

    let { x, y, w, h } = initialCrop

    if (handle === 'move') {
      x = Math.max(0, Math.min(initialCrop.x + deltaX, imgSize.w - initialCrop.w))
      y = Math.max(0, Math.min(initialCrop.y + deltaY, imgSize.h - initialCrop.h))
      setCrop({ ...initialCrop, x: Math.round(x), y: Math.round(y) })
      return
    }

    // Flexible resizing logic
    if (handle.includes('e')) {
      w = Math.max(30, Math.min(initialCrop.w + deltaX, imgSize.w - initialCrop.x))
    }
    if (handle.includes('s')) {
      h = Math.max(30, Math.min(initialCrop.h + deltaY, imgSize.h - initialCrop.y))
    }
    if (handle.includes('w')) {
      const maxDelta = initialCrop.w - 30
      const clampedDelta = Math.min(maxDelta, deltaX)
      x = Math.max(0, initialCrop.x + clampedDelta)
      w = initialCrop.w - (x - initialCrop.x)
    }
    if (handle.includes('n')) {
      const maxDelta = initialCrop.h - 30
      const clampedDelta = Math.min(maxDelta, deltaY)
      y = Math.max(0, initialCrop.y + clampedDelta)
      h = initialCrop.h - (y - initialCrop.y)
    }

    // If a fixed ratio is selected
    if (ratio > 0) {
      if (handle === 'e' || handle === 'w' || handle === 'se' || handle === 'sw') {
        h = Math.round(w / ratio)
        if (y + h > imgSize.h) {
          h = imgSize.h - y
          w = Math.round(h * ratio)
        }
      } else {
        w = Math.round(h * ratio)
        if (x + w > imgSize.w) {
          w = imgSize.w - x
          h = Math.round(w / ratio)
        }
      }
    }

    setCrop({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    })
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const doCrop = useCallback(async () => {
    if (!file || !imgUrl || crop.w <= 0 || crop.h <= 0) return
    setIsProcessing(true)
    try {
      const img = new Image()
      img.src = imgUrl
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
      })

      const canvas = document.createElement('canvas')
      canvas.width = crop.w
      canvas.height = crop.h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)

      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error('Crop failed'))), file.type || 'image/jpeg', 0.95)
      )
      setResult({ blob, url: URL.createObjectURL(blob), w: crop.w, h: crop.h })
    } catch (err) {
      alert('Failed to crop image.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, imgUrl, crop])

  const reset = () => {
    setFile(null)
    setImgUrl(null)
    setResult(null)
  }

  // Calculate percentage positions for responsive rendering
  const pctLeft = imgSize.w > 0 ? (crop.x / imgSize.w) * 100 : 0
  const pctTop = imgSize.h > 0 ? (crop.y / imgSize.h) * 100 : 0
  const pctWidth = imgSize.w > 0 ? (crop.w / imgSize.w) * 100 : 100
  const pctHeight = imgSize.h > 0 ? (crop.h / imgSize.h) * 100 : 100

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      <nav className="breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>{tool.shortName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && <FileUploader accept="image/*" onFiles={handleFile} icon="✂️" title="Drop your image to crop" />}

      {file && !result && imgUrl && (
        <div className="card-premium p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-surface-600 uppercase tracking-wider">
                Crop Ratio
              </label>
              <span className="text-xs font-medium text-primary-600">
                {crop.w} × {crop.h} px
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ratios.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setRatio(r.v)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-semibold ${
                    ratio === r.v
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs'
                      : 'border-surface-200 text-surface-600 hover:border-primary-300 bg-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Crop Canvas Area */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              className="relative select-none touch-none rounded-2xl overflow-hidden shadow-md bg-surface-900/5 inline-block max-w-full"
              style={{ maxHeight: '65vh' }}
            >
              {/* Base Image */}
              <img
                src={imgUrl}
                alt="Original"
                className="block max-w-full max-h-[65vh] object-contain pointer-events-none opacity-40"
              />

              {/* Highlighted Crop Area Box */}
              <div
                onPointerDown={(e) => startDrag(e, 'move')}
                className="absolute border-2 border-primary-500 cursor-move transition-[box-shadow] shadow-xl group"
                style={{
                  left: `${pctLeft}%`,
                  top: `${pctTop}%`,
                  width: `${pctWidth}%`,
                  height: `${pctHeight}%`,
                  backgroundImage: `url(${imgUrl})`,
                  backgroundPosition: `${(crop.x / (imgSize.w - crop.w || 1)) * 100}% ${(crop.y / (imgSize.h - crop.h || 1)) * 100}%`,
                  backgroundSize: `${(imgSize.w / crop.w) * 100}% ${(imgSize.h / crop.h) * 100}%`,
                }}
              >
                {/* Rule of Thirds Grid Lines */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                {/* 4 Corner Resize Handles */}
                <div
                  onPointerDown={(e) => startDrag(e, 'nw')}
                  className="absolute -top-2 -left-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-primary-600 rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 'ne')}
                  className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-primary-600 rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 'sw')}
                  className="absolute -bottom-2 -left-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-primary-600 rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 'se')}
                  className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-white border-2 border-primary-600 rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                />

                {/* 4 Edge Handles */}
                <div
                  onPointerDown={(e) => startDrag(e, 'n')}
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white border-2 border-primary-600 rounded-full cursor-ns-resize shadow-xs"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 's')}
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white border-2 border-primary-600 rounded-full cursor-ns-resize shadow-xs"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 'w')}
                  className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 bg-white border-2 border-primary-600 rounded-full cursor-ew-resize shadow-xs"
                />
                <div
                  onPointerDown={(e) => startDrag(e, 'e')}
                  className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 bg-white border-2 border-primary-600 rounded-full cursor-ew-resize shadow-xs"
                />
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-surface-400">
            💡 Drag inside the box to move • Drag corner and side handles to resize freely
          </p>

          {/* Dimension Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-surface-100">
            <div>
              <label className="text-xs font-semibold text-surface-500">X Position</label>
              <input
                type="number"
                min={0}
                max={imgSize.w - crop.w}
                value={crop.x}
                onChange={(e) => setCrop((c) => ({ ...c, x: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-500">Y Position</label>
              <input
                type="number"
                min={0}
                max={imgSize.h - crop.h}
                value={crop.y}
                onChange={(e) => setCrop((c) => ({ ...c, y: Math.max(0, Number(e.target.value)) }))}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-500">Width (px)</label>
              <input
                type="number"
                min={30}
                max={imgSize.w - crop.x}
                value={crop.w}
                onChange={(e) => setCrop((c) => ({ ...c, w: Math.max(30, Number(e.target.value)) }))}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-surface-500">Height (px)</label>
              <input
                type="number"
                min={30}
                max={imgSize.h - crop.y}
                value={crop.h}
                onChange={(e) => setCrop((c) => ({ ...c, h: Math.max(30, Number(e.target.value)) }))}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={doCrop}
              disabled={isProcessing}
              className="btn-primary flex-1 py-4 text-base font-bold shadow-md shadow-primary-500/20"
            >
              {isProcessing ? '⏳ Cropping...' : '✂️ Crop Image'}
            </button>
            <button onClick={reset} className="btn-secondary px-6 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div ref={resultRef} className="card-premium p-8 text-center scroll-mt-24 space-y-6">
          <div className="text-5xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold text-surface-800 mb-1">Image Cropped Successfully!</h3>
            <p className="text-xs text-surface-500">
              {result.w} × {result.h} px • {formatFileSize(result.blob.size)}
            </p>
          </div>

          <div className="flex justify-center">
            <img
              src={result.url}
              alt="Cropped"
              className="max-h-72 rounded-2xl shadow-lg border border-surface-200 object-contain"
            />
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <button
              onClick={() => downloadBlob(result.blob, `cropped_${result.w}x${result.h}.jpg`)}
              className="btn-success w-full py-4 text-base font-bold shadow-md shadow-emerald-500/20"
            >
              📥 Download Cropped Image
            </button>
            <button onClick={reset} className="btn-secondary w-full py-3 text-sm font-semibold">
              🔄 Crop Another Image
            </button>
          </div>
        </div>
      )}

      <section className="content-section mt-12">
        <h2>About Free Online Image Cropper</h2>
        <p>
          Crop photos with precision and flexibility. Whether you need a 1:1 square avatar for Instagram, a 16:9 banner for YouTube, or a custom free-form crop, our interactive cropper allows you to touch and drag handles directly on screen with 100% browser-based privacy.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="image-cropper" />
    </div>
  )
}
