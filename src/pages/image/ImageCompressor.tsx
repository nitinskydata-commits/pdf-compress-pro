import { useState, useCallback, useRef, useEffect } from 'react'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('image-compressor')!
const faqItems = [
  { question: 'How much can images be compressed?', answer: 'Typically 60-90% depending on the image. JPEG photos compress the most, while PNGs with transparency may see 30-50% reduction.' },
  { question: 'Is compression done in my browser?', answer: 'Yes! We use the HTML5 Canvas API to re-encode images at your chosen quality level. Nothing is uploaded to any server.' },
  { question: 'Which formats are supported?', answer: 'JPG/JPEG, PNG, and WebP. You can also convert between formats during compression.' },
]

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [quality, setQuality] = useState(75)
  const [format, setFormat] = useState<'jpeg' | 'webp' | 'png'>('jpeg')
  const [result, setResult] = useState<{ blob: Blob; url: string; width: number; height: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 80)
    }
  }, [result])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]; if (!f) return
    setFile(f); setResult(null)
    setPreview(URL.createObjectURL(f))
  }, [])

  const compress = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    try {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const mimeType = `image/${format}`
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compression failed')), mimeType, quality / 100)
      })
      const saved = Math.max(0, file.size - blob.size)
      const reduction = Math.round((saved / file.size) * 100)
      trackToolUsage({
        toolId: 'image-compressor',
        toolName: 'Image Compressor',
        category: 'image',
        action: `Compressed ${file.name}`,
        details: `${formatFileSize(file.size)} → ${formatFileSize(blob.size)} (${reduction}%)`,
        originalSize: file.size,
        compressedSize: blob.size,
        sizeSaved: saved,
        reductionPercent: reduction,
        method: 'HTML5 Canvas',
      })

      setResult({ blob, url: URL.createObjectURL(blob), width: img.naturalWidth, height: img.naturalHeight })
    } catch (err) { alert('Compression failed.'); console.error(err) }
    finally { setIsProcessing(false) }
  }, [file, quality, format, isProcessing])

  const reset = () => { setFile(null); setResult(null); setPreview(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && <FileUploader accept="image/jpeg,image/png,image/webp" onFiles={handleFile} icon="🎨" title="Drop your image to compress" />}

      {file && !result && (
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center justify-between"><div><p className="font-semibold text-surface-800">{file.name}</p><p className="text-sm text-surface-500">{formatFileSize(file.size)}</p></div><button onClick={reset} className="text-sm text-danger-500">Remove</button></div>
          {preview && <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Quality: {quality}%</label>
            <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400"><span>Smallest</span><span>Best Quality</span></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Output Format</label>
            <select value={format} onChange={e => setFormat(e.target.value as 'jpeg' | 'webp' | 'png')} className="w-full px-4 py-3 border border-surface-300 rounded-xl">
              <option value="jpeg">JPEG (smallest for photos)</option><option value="webp">WebP (modern, small)</option><option value="png">PNG (lossless)</option>
            </select>
          </div>
          <button onClick={compress} disabled={isProcessing} className="btn-primary w-full py-4">{isProcessing ? '⏳ Compressing...' : '🎨 Compress Image'}</button>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="card-premium p-8 text-center scroll-mt-24">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">Image Compressed!</h3>
          <img src={result.url} alt="Compressed" className="max-h-48 mx-auto rounded-lg mb-4" />
          <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Original</div><div className="font-bold text-surface-800">{formatFileSize(file!.size)}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Compressed</div><div className="font-bold text-surface-800">{formatFileSize(result.blob.size)}</div></div>
            <div className="result-card highlight"><div className="text-xs text-surface-500 mb-1">Saved</div><div className="font-bold text-success-600">{Math.round((1 - result.blob.size / file!.size) * 100)}%</div></div>
          </div>
          <button onClick={() => downloadBlob(result.blob, `compressed.${format}`)} className="btn-success w-full py-4 mb-3">📥 Download Compressed Image</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Compress Another</button>
        </div>
      )}

      <section className="content-section mt-8"><h2>How Image Compression Works</h2><p>Our tool uses the HTML5 Canvas API to re-encode your image at a lower quality level. For JPEG and WebP formats, this means reducing the amount of detail stored in the file while maintaining visual appearance. The quality slider lets you find the perfect balance between file size and visual quality.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="image-compressor" />
    </div>
  )
}
