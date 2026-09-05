import { useState, useCallback } from 'react'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('image-resizer')!
const presets = [
  { label: 'Instagram Post', w: 1080, h: 1080 }, { label: 'Instagram Story', w: 1080, h: 1920 },
  { label: 'Facebook Cover', w: 820, h: 312 }, { label: 'Twitter Header', w: 1500, h: 500 },
  { label: 'LinkedIn Banner', w: 1584, h: 396 }, { label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { label: 'HD (1280×720)', w: 1280, h: 720 }, { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
]
const faqItems = [
  { question: 'Can I resize to exact dimensions?', answer: 'Yes! Enter custom width and height, or choose from preset sizes for popular social media platforms.' },
  { question: 'Will resizing reduce quality?', answer: 'Minimal quality loss when downsizing. When upsizing, some interpolation blur may occur. We use high-quality bicubic rendering.' },
]

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [origW, setOrigW] = useState(0)
  const [origH, setOrigH] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lockAspect, setLockAspect] = useState(true)
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null)

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return; setFile(f); setResult(null)
    const img = new Image(); img.src = URL.createObjectURL(f)
    img.onload = () => { setOrigW(img.naturalWidth); setOrigH(img.naturalHeight); setWidth(img.naturalWidth); setHeight(img.naturalHeight) }
  }, [])

  const updateWidth = (w: number) => { setWidth(w); if (lockAspect && origW) setHeight(Math.round((w / origW) * origH)) }
  const updateHeight = (h: number) => { setHeight(h); if (lockAspect && origH) setWidth(Math.round((h / origH) * origW)) }
  const applyPreset = (w: number, h: number) => { setWidth(w); setHeight(h); setLockAspect(false) }

  const resize = useCallback(async () => {
    if (!file) return
    const img = new Image(); img.src = URL.createObjectURL(file)
    await new Promise(r => { img.onload = r })
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
    const ctx = canvas.getContext('2d')!; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, width, height)
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(), 'image/jpeg', 0.92))
    setResult({ blob, url: URL.createObjectURL(blob) })
    trackToolUsage({
      toolId: 'image-resizer',
      toolName: 'Image Resizer',
      category: 'image',
      action: `Resized ${file.name} to ${width}x${height}px`,
      details: `Dimensions adjusted from ${origW}x${origH} to ${width}x${height}px`,
      originalSize: file.size,
      compressedSize: blob.size,
      method: 'Client Canvas',
    })
  }, [file, width, height, origW, origH])

  const reset = () => { setFile(null); setResult(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && <FileUploader accept="image/*" onFiles={handleFile} icon="📐" title="Drop your image to resize" />}

      {file && !result && (
        <div className="card-premium p-6 space-y-4">
          <p className="text-sm text-surface-500">Original: {origW} × {origH} px</p>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => <button key={p.label} onClick={() => applyPreset(p.w, p.h)} className="text-xs px-3 py-1.5 rounded-full border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">{p.label}</button>)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Width (px)</label><input type="number" value={width} onChange={e => updateWidth(Number(e.target.value))} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Height (px)</label><input type="number" value={height} onChange={e => updateHeight(Number(e.target.value))} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lockAspect} onChange={e => setLockAspect(e.target.checked)} className="accent-primary-500" /> Lock aspect ratio</label>
          <button onClick={resize} className="btn-primary w-full py-4">📐 Resize Image</button>
        </div>
      )}

      {result && (
        <div className="card-premium p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">Image Resized to {width} × {height} px</h3>
          <img src={result.url} alt="Resized" className="max-h-48 mx-auto rounded-lg mb-4" />
          <button onClick={() => downloadBlob(result.blob, `resized_${width}x${height}.jpg`)} className="btn-success w-full py-4 mb-3">📥 Download</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Resize Another</button>
        </div>
      )}

      <section className="content-section mt-8"><h2>How to Resize Images</h2><p>Upload your image, enter custom dimensions or choose a social media preset, and download the resized result instantly. Processing uses the Canvas API in your browser — no upload required.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="image-resizer" />
    </div>
  )
}
