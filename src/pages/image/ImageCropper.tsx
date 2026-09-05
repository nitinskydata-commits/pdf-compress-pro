import { useState, useCallback, useRef, useEffect } from 'react'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'

const tool = getToolBySlug('image-cropper')!
const ratios = [{ label: 'Free', v: 0 }, { label: '1:1', v: 1 }, { label: '4:3', v: 4/3 }, { label: '3:2', v: 3/2 }, { label: '16:9', v: 16/9 }, { label: '9:16', v: 9/16 }]
const faqItems = [
  { question: 'Can I crop to a specific aspect ratio?', answer: 'Yes! Choose from preset ratios (1:1, 4:3, 16:9, etc.) or use free-form cropping.' },
  { question: 'Is cropping done locally?', answer: 'Yes, using Canvas API in your browser. Your image never leaves your device.' },
]

export default function ImageCropper() {
  const [file, setFile] = useState<File | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState(0)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null)
    const url = URL.createObjectURL(f); setImgUrl(url)
    const img = new Image(); img.src = url
    img.onload = () => { setImgSize({ w: img.naturalWidth, h: img.naturalHeight }); setCrop({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }) }
  }, [])

  useEffect(() => {
    if (ratio > 0 && imgSize.w > 0) {
      const maxW = imgSize.w, maxH = imgSize.h
      let cw = maxW, ch = maxW / ratio
      if (ch > maxH) { ch = maxH; cw = maxH * ratio }
      setCrop({ x: Math.floor((maxW - cw) / 2), y: Math.floor((maxH - ch) / 2), w: Math.floor(cw), h: Math.floor(ch) })
    }
  }, [ratio, imgSize])

  const doCrop = useCallback(async () => {
    if (!file || !imgUrl) return
    const img = new Image(); img.src = imgUrl
    await new Promise(r => { img.onload = r })
    const canvas = document.createElement('canvas'); canvas.width = crop.w; canvas.height = crop.h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.92))
    setResult({ blob, url: URL.createObjectURL(blob) })
  }, [file, imgUrl, crop])

  const reset = () => { setFile(null); setImgUrl(null); setResult(null) }

  const displayScale = imgSize.w > 0 ? Math.min(1, 600 / imgSize.w) : 1

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && <FileUploader accept="image/*" onFiles={handleFile} icon="✂️" title="Drop your image to crop" />}

      {file && !result && imgUrl && (
        <div className="card-premium p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {ratios.map(r => <button key={r.label} onClick={() => setRatio(r.v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${ratio === r.v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 hover:border-primary-300'}`}>{r.label}</button>)}
          </div>
          <div className="relative inline-block bg-gray-100 rounded-lg overflow-hidden" style={{ maxWidth: '100%' }}>
            <img ref={imgRef} src={imgUrl} alt="Source" className="block max-w-full" style={{ opacity: 0.4 }} />
            <div className="absolute border-2 border-primary-500 bg-transparent" style={{ left: crop.x * displayScale, top: crop.y * displayScale, width: crop.w * displayScale, height: crop.h * displayScale, backgroundImage: `url(${imgUrl})`, backgroundPosition: `-${crop.x * displayScale}px -${crop.y * displayScale}px`, backgroundSize: `${imgSize.w * displayScale}px ${imgSize.h * displayScale}px` }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className="text-xs text-surface-500">X</label><input type="number" value={crop.x} onChange={e => setCrop(c => ({ ...c, x: Number(e.target.value) }))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-surface-500">Y</label><input type="number" value={crop.y} onChange={e => setCrop(c => ({ ...c, y: Number(e.target.value) }))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-surface-500">Width</label><input type="number" value={crop.w} onChange={e => setCrop(c => ({ ...c, w: Number(e.target.value) }))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" /></div>
            <div><label className="text-xs text-surface-500">Height</label><input type="number" value={crop.h} onChange={e => setCrop(c => ({ ...c, h: Number(e.target.value) }))} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm" /></div>
          </div>
          <button onClick={doCrop} className="btn-primary w-full py-4">✂️ Crop Image</button>
        </div>
      )}

      {result && (
        <div className="card-premium p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">Image Cropped! ({crop.w} × {crop.h} px)</h3>
          <img src={result.url} alt="Cropped" className="max-h-64 mx-auto rounded-lg mb-4" />
          <button onClick={() => downloadBlob(result.blob, `cropped_${crop.w}x${crop.h}.jpg`)} className="btn-success w-full py-4 mb-3">📥 Download</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Crop Another</button>
        </div>
      )}

      <FAQ items={faqItems} /><RelatedTools currentSlug="image-cropper" />
    </div>
  )
}
