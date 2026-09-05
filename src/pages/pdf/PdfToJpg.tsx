import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const tool = getToolBySlug('pdf-to-jpg')!
const faqItems = [
  { question: 'How is each page converted?', answer: 'Each PDF page is rendered to an HTML5 Canvas using PDF.js at high resolution, then exported as a JPEG image. The result is a pixel-perfect representation of each page.' },
  { question: 'Can I choose the image quality?', answer: 'Yes! You can select the output quality (standard 150 DPI or high-quality 300 DPI) and JPEG quality level.' },
  { question: 'Are my files processed locally?', answer: 'Yes, 100%! PDF.js renders pages in your browser. Your PDF never leaves your device.' },
]

export default function PdfToJpg() {
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<{ url: string; name: string }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scale, setScale] = useState(2)

  const handleFile = useCallback((files: File[]) => { setFile(files[0]); setImages([]); setProgress(0) }, [])

  const convert = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true); setImages([])
    try {
      const bytes = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
      const totalPages = pdf.numPages
      const results: { url: string; name: string }[] = []

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise
        const url = canvas.toDataURL('image/jpeg', 0.92)
        results.push({ url, name: `page_${i}.jpg` })
        setProgress(Math.round((i / totalPages) * 100))
      }
      setImages(results)
      trackToolUsage({
        toolId: 'pdf-to-jpg',
        toolName: 'PDF to JPG Converter',
        category: 'pdf',
        action: `Converted ${file.name} to ${results.length} JPG images`,
        details: `${results.length} pages rendered at ${scale * 100}% resolution`,
        originalSize: file.size,
        method: 'Client PDF.js',
      })
    } catch (err) { alert('Failed to convert PDF.'); console.error(err) }
    finally { setIsProcessing(false) }
  }, [file, isProcessing, scale])

  const downloadAll = () => {
    images.forEach((img, i) => {
      setTimeout(() => {
        const link = document.createElement('a')
        link.href = img.url; link.download = img.name
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
      }, i * 300)
    })
  }

  const reset = () => { setFile(null); setImages([]); setProgress(0) }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && images.length === 0 && <FileUploader accept=".pdf" onFiles={handleFile} icon="🖼️" title="Drop your PDF to convert to images" />}

      {file && images.length === 0 && (
        <div className="card-premium p-6 space-y-4">
          <div className="flex justify-between items-center"><p className="font-semibold text-surface-800">{file.name}</p><button onClick={reset} className="text-sm text-danger-500">Remove</button></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Quality</label>
            <select value={scale} onChange={e => setScale(Number(e.target.value))} className="w-full px-4 py-3 border border-surface-300 rounded-xl">
              <option value={1.5}>Standard (150 DPI)</option><option value={2}>High (200 DPI)</option><option value={3}>Ultra (300 DPI)</option>
            </select>
          </div>
          {isProcessing && <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>}
          <button onClick={convert} disabled={isProcessing} className="btn-primary w-full py-4">{isProcessing ? `⏳ Converting... ${progress}%` : '🖼️ Convert to JPG'}</button>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold text-surface-800">{images.length} pages converted</h3>
            <div className="flex gap-2"><button onClick={downloadAll} className="btn-success">📥 Download All</button><button onClick={reset} className="btn-secondary">🔄 New</button></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <div key={i} className="card-premium overflow-hidden">
                <img src={img.url} alt={`Page ${i + 1}`} className="w-full h-auto" />
                <div className="p-3 flex justify-between items-center"><span className="text-xs text-surface-500">Page {i + 1}</span>
                  <a href={img.url} download={img.name} className="text-xs text-primary-500 hover:underline">Download</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <section className="content-section mt-8"><h2>How PDF to JPG Conversion Works</h2><p>PDF.js renders each page of your PDF to a high-resolution HTML5 Canvas, then exports the canvas as a JPEG image. This process happens entirely in your browser — your PDF file never leaves your device. Choose higher DPI settings for print-quality images.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="pdf-to-jpg" />
    </div>
  )
}
