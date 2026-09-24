import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob, formatFileSize } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('image-cropper') || {
  slug: 'image-cropper',
  name: 'Image Cropper Online',
  shortName: 'Image Cropper',
  description: 'Crop images online to custom dimensions or standard aspect ratios (1:1, 16:9, 4:3, 9:16). 100% free, private browser-based tool with zero server uploads.',
  metaTitle: 'Image Cropper Online Free — Crop Photos to Exact Aspect Ratios',
  metaDescription: 'Crop image online for free. Interactive visual crop box for Instagram, YouTube, and passports. Fast, 100% secure with zero file uploads.',
  category: 'image',
  categoryLabel: 'Image Tools',
  keywords: ['image cropper', 'crop photo', 'crop image online free', 'photo crop tool', 'square crop'],
  icon: '✂️',
}

const ratios = [
  { label: 'Free (Flexible)', v: 0, icon: '⛶' },
  { label: '1:1 Square', v: 1, icon: '◻' },
  { label: '16:9 Landscape', v: 16 / 9, icon: '▭' },
  { label: '9:16 Story / Reel', v: 9 / 16, icon: '▯' },
  { label: '4:3 Standard', v: 4 / 3, icon: '▱' },
  { label: '3:2 Classic', v: 3 / 2, icon: '▱' },
  { label: '2:3 Portrait', v: 2 / 3, icon: '▯' },
]

const faqItems = [
  {
    question: 'How do I move or resize the crop box?',
    answer: 'Drag directly inside the highlighted crop box to reposition it. Drag any of the 4 corner handles or border edge lines to resize the crop area on both desktop and touchscreens.',
  },
  {
    question: 'Can I crop without sticking to a fixed aspect ratio?',
    answer: 'Yes! Select the "Free (Flexible)" option, and you can freely drag the borders to any custom width and height without ratio constraints.',
  },
  {
    question: 'Does cropping reduce the resolution of the cropped area?',
    answer: 'No. The cropped portion is extracted from the original image at 100% full native resolution without artificial downsampling.',
  },
  {
    question: 'Are my private pictures uploaded to a cloud server?',
    answer: 'No. Everything is calculated and rendered directly in your browser memory via the HTML5 Canvas API. Your pictures never leave your device.',
  },
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
  const [ratio, setRatio] = useState(0) // 0 = Free
  const [rotationAngle, setRotationAngle] = useState(0) // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg')
  const [result, setResult] = useState<{ blob: Blob; url: string; w: number; h: number; size: number } | null>(null)
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
    setRotationAngle(0)
    setFlipH(false)
    const url = URL.createObjectURL(f)
    setImgUrl(url)

    const img = new Image()
    img.src = url
    img.onload = () => {
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      setImgSize({ w: naturalW, h: naturalH })
      // Initial default crop: 85% centered
      const initialW = Math.round(naturalW * 0.85)
      const initialH = Math.round(naturalH * 0.85)
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

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  // Dragging logic
  const startDrag = (e: React.PointerEvent, handle: DragHandle) => {
    e.stopPropagation()
    e.preventDefault()
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      rect,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current || imgSize.w === 0 || imgSize.h === 0) return

    const { handle, startX, startY, initialCrop, rect } = dragRef.current
    const scaleX = imgSize.w / rect.width
    const scaleY = imgSize.h / rect.height
    const dx = (e.clientX - startX) * scaleX
    const dy = (e.clientY - startY) * scaleY

    let { x, y, w, h } = initialCrop
    const minSize = 40

    if (handle === 'move') {
      x = Math.max(0, Math.min(x + dx, imgSize.w - w))
      y = Math.max(0, Math.min(y + dy, imgSize.h - h))
    } else {
      if (handle.includes('e')) {
        w = Math.max(minSize, Math.min(w + dx, imgSize.w - x))
      }
      if (handle.includes('s')) {
        h = Math.max(minSize, Math.min(h + dy, imgSize.h - y))
      }
      if (handle.includes('w')) {
        const maxDx = initialCrop.x + initialCrop.w - minSize
        const actualDx = Math.min(dx, maxDx)
        const finalX = Math.max(0, initialCrop.x + actualDx)
        w = initialCrop.x + initialCrop.w - finalX
        x = finalX
      }
      if (handle.includes('n')) {
        const maxDy = initialCrop.y + initialCrop.h - minSize
        const actualDy = Math.min(dy, maxDy)
        const finalY = Math.max(0, initialCrop.y + actualDy)
        h = initialCrop.y + initialCrop.h - finalY
        y = finalY
      }

      // Aspect ratio lock enforcement during resize
      if (ratio > 0) {
        if (handle === 'e' || handle === 'w') {
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
    }

    setCrop({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    })
  }

  const endDrag = (e: React.PointerEvent) => {
    if (dragRef.current) {
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // pointer capture fallback
      }
      dragRef.current = null
    }
  }

  const rotateLeft = () => setRotationAngle(prev => (prev + 270) % 360)
  const rotateRight = () => setRotationAngle(prev => (prev + 90) % 360)
  const toggleFlip = () => setFlipH(prev => !prev)

  // Execute Crop
  const executeCrop = useCallback(async () => {
    if (!file || !imgUrl || isProcessing || crop.w <= 0 || crop.h <= 0) return
    setIsProcessing(true)

    try {
      const img = new Image()
      img.src = imgUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image failed to load'))
      })

      // Step 1: Base crop canvas
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = crop.w
      cropCanvas.height = crop.h
      const cropCtx = cropCanvas.getContext('2d')!
      cropCtx.imageSmoothingQuality = 'high'
      cropCtx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)

      // Step 2: Handle rotation and flip if applied
      let finalCanvas = cropCanvas
      if (rotationAngle !== 0 || flipH) {
        finalCanvas = document.createElement('canvas')
        const isSwapped = rotationAngle === 90 || rotationAngle === 270
        finalCanvas.width = isSwapped ? crop.h : crop.w
        finalCanvas.height = isSwapped ? crop.w : crop.h
        const ctx = finalCanvas.getContext('2d')!
        ctx.imageSmoothingQuality = 'high'

        ctx.translate(finalCanvas.width / 2, finalCanvas.height / 2)
        ctx.rotate((rotationAngle * Math.PI) / 180)
        if (flipH) ctx.scale(-1, 1)
        ctx.drawImage(cropCanvas, -crop.w / 2, -crop.h / 2)
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))),
          format,
          0.92
        )
      })

      const croppedUrl = URL.createObjectURL(blob)

      trackToolUsage({
        toolId: 'image-cropper',
        toolName: 'Image Cropper',
        category: 'image',
        action: `Cropped ${file.name}`,
        details: `Dimensions: ${finalCanvas.width}x${finalCanvas.height}px, Ratio: ${ratio || 'Free'}`,
        originalSize: file.size,
        compressedSize: blob.size,
        method: 'Client Canvas Interactive Cropper',
      })

      setResult({
        blob,
        url: croppedUrl,
        w: finalCanvas.width,
        h: finalCanvas.height,
        size: blob.size,
      })
    } catch (err) {
      alert('Failed to crop image. Please try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, imgUrl, isProcessing, crop, rotationAngle, flipH, format, ratio])

  const reset = () => {
    setFile(null)
    setImgUrl(null)
    setResult(null)
    setImgSize({ w: 0, h: 0 })
    setRotationAngle(0)
    setFlipH(false)
  }

  // Calculate box position in percentages
  const leftPct = imgSize.w ? (crop.x / imgSize.w) * 100 : 0
  const topPct = imgSize.h ? (crop.y / imgSize.h) * 100 : 0
  const widthPct = imgSize.w ? (crop.w / imgSize.w) * 100 : 0
  const heightPct = imgSize.h ? (crop.h / imgSize.h) * 100 : 0

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/image-cropper"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/image-cropper`,
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
          <ToolVisualBadge category="image" slug="image-cropper" name="Crop" icon="✂️" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Image Cropper Online
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Crop photos to exact proportions, square avatars, social media stories, or custom framing with high-precision drag handles. 100% private in your browser.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Interactive Visual Framing
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Social Aspect Ratio Locks
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
              accept="image/*"
              onFiles={handleFile}
              maxSizeMB={50}
              icon="✂️"
              title="Drop your photo here to crop, or click to browse"
              subtitle="Supports JPG, PNG, WebP • Drag corners to frame your subject"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar & Toolbar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="image" slug="image-cropper" name="IMG" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">
                      Original: {imgSize.w} × {imgSize.h} px • Crop: <span className="font-bold text-primary-600">{crop.w} × {crop.h} px</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={rotateLeft}
                    title="Rotate 90° Left"
                    className="p-2 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-surface-700 text-xs font-bold transition-colors"
                  >
                    ↺ 90°
                  </button>
                  <button
                    type="button"
                    onClick={rotateRight}
                    title="Rotate 90° Right"
                    className="p-2 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-surface-700 text-xs font-bold transition-colors"
                  >
                    ↻ 90°
                  </button>
                  <button
                    type="button"
                    onClick={toggleFlip}
                    title="Flip Horizontal"
                    className="p-2 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-surface-700 text-xs font-bold transition-colors"
                  >
                    ⇄ Flip
                  </button>
                  <button
                    onClick={reset}
                    className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors ml-2"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  Select Crop Proportion
                </label>
                <div className="flex flex-wrap gap-2">
                  {ratios.map(r => (
                    <button
                      key={r.label}
                      type="button"
                      onClick={() => setRatio(r.v)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        ratio === r.v
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Cropper Canvas */}
              {imgUrl && (
                <div className="flex justify-center bg-surface-950/5 p-4 rounded-2xl border border-surface-200">
                  <div
                    ref={containerRef}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerLeave={endDrag}
                    className="relative select-none touch-none rounded-xl overflow-hidden shadow-sm inline-block max-w-full"
                    style={{ maxHeight: '60vh' }}
                  >
                    {/* Dimmed Base Image with rotation */}
                    <img
                      src={imgUrl}
                      alt="Crop Source"
                      className="block max-w-full max-h-[60vh] object-contain pointer-events-none opacity-40 transition-transform"
                      style={{
                        transform: `rotate(${rotationAngle}deg) ${flipH ? 'scaleX(-1)' : ''}`,
                      }}
                    />

                    {/* Highlighted Crop Area Box */}
                    <div
                      onPointerDown={e => startDrag(e, 'move')}
                      className="absolute border-2 border-primary-500 cursor-move shadow-2xl overflow-hidden"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                    >
                      {/* Fully bright image aligned inside the crop box */}
                      <img
                        src={imgUrl}
                        alt="Bright crop preview"
                        className="absolute pointer-events-none max-w-none transition-transform"
                        style={{
                          left: `-${leftPct * (100 / widthPct)}%`,
                          top: `-${topPct * (100 / heightPct)}%`,
                          width: `${(100 / widthPct) * 100}%`,
                          height: `${(100 / heightPct) * 100}%`,
                          transform: `rotate(${rotationAngle}deg) ${flipH ? 'scaleX(-1)' : ''}`,
                        }}
                      />

                      {/* Rule of Thirds Grid Overlay */}
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
                        <div className="border-r border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-r border-b border-white/30" />
                        <div className="border-b border-white/30" />
                        <div className="border-r border-white/30" />
                        <div className="border-r border-white/30" />
                        <div />
                      </div>

                      {/* Corner Handles */}
                      <div
                        onPointerDown={e => startDrag(e, 'nw')}
                        className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-nwse-resize shadow-sm"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 'ne')}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-nesw-resize shadow-sm"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 'sw')}
                        className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-nesw-resize shadow-sm"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-primary-500 border-2 border-white rounded-full cursor-nwse-resize shadow-sm"
                      />

                      {/* Side Handles */}
                      <div
                        onPointerDown={e => startDrag(e, 'n')}
                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary-500 border border-white rounded-full cursor-ns-resize"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 's')}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-primary-500 border border-white rounded-full cursor-ns-resize"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 'w')}
                        className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-primary-500 border border-white rounded-full cursor-ew-resize"
                      />
                      <div
                        onPointerDown={e => startDrag(e, 'e')}
                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-primary-500 border border-white rounded-full cursor-ew-resize"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Format Selection & Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-surface-700">Save As:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('image/jpeg')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        format === 'image/jpeg'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-surface-200 text-surface-700'
                      }`}
                    >
                      JPG
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('image/png')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        format === 'image/png'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-surface-200 text-surface-700'
                      }`}
                    >
                      PNG
                    </button>
                  </div>
                </div>

                <div className="text-xs font-semibold text-surface-500">
                  Target Dimensions: <span className="text-surface-900 font-bold">{crop.w} × {crop.h} px</span>
                </div>
              </div>

              {/* Crop Action Button */}
              <button
                onClick={executeCrop}
                disabled={isProcessing || crop.w <= 0 || crop.h <= 0}
                className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Cropping Canvas...
                  </span>
                ) : (
                  `✂️ Crop to ${crop.w} × ${crop.h} px`
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
              Photo Cropped Successfully!
            </h3>
            <p className="text-sm text-surface-500 mb-6">
              Final size: {result.w} × {result.h} px ({formatFileSize(result.size)})
            </p>

            <div className="max-w-md mx-auto mb-8 p-3 rounded-2xl bg-surface-100 border border-surface-200">
              <img
                src={result.url}
                alt="Cropped Output"
                className="max-h-72 mx-auto rounded-xl object-contain shadow-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.blob,
                    `cropped_${result.w}x${result.h}_${file?.name.replace(/\.[^/.]+$/, '')}.${format === 'image/png' ? 'png' : 'jpg'}`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Cropped Photo
              </button>
              <button onClick={reset} className="btn-secondary w-full py-4 text-base font-semibold">
                🔄 Crop Another Photo
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Crop Pictures Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to trim excess background from a portrait or cut an image to fit a 1:1 Instagram post or 16:9 YouTube video thumbnail? PDFCompress Pro gives you complete control over your photo framing.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Drag the corner handles to resize, drag the center of the box to position, and use the rotation tools to align your image before exporting. All processing happens in high-definition inside your browser with 100% data confidentiality.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="image-cropper" />
      </div>
    </div>
  )
}
