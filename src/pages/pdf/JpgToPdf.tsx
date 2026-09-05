import { useState, useCallback, useRef, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'

const tool = getToolBySlug('jpg-to-pdf')!
const faqItems = [
  { question: 'What image formats are supported?', answer: 'JPG/JPEG and PNG images. WebP images will be converted internally.' },
  { question: 'Can I combine multiple images into one PDF?', answer: 'Yes! Drop multiple images and reorder them. Each image becomes a page in the final PDF.' },
  { question: 'Is the conversion done locally?', answer: 'Yes, using pdf-lib directly in your browser. Your images never leave your device.' },
]

export default function JpgToPdf() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; pages: number; size: number } | null>(null)
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

  const addFiles = useCallback((newFiles: File[]) => {
    const imgs = newFiles.filter(f => f.type.startsWith('image/'))
    setFiles(prev => [...prev, ...imgs]); setResult(null)
  }, [])

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const convert = useCallback(async () => {
    if (files.length === 0 || isProcessing) return
    setIsProcessing(true)
    try {
      const pdf = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        let img
        if (file.type === 'image/png') img = await pdf.embedPng(bytes)
        else img = await pdf.embedJpg(bytes)
        const page = pdf.addPage([img.width, img.height])
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
      }
      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      setResult({ blob, pages: files.length, size: pdfBytes.length })
    } catch (err) { alert('Failed to create PDF.'); console.error(err) }
    finally { setIsProcessing(false) }
  }, [files, isProcessing])

  const reset = () => { setFiles([]); setResult(null) }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!result && (
        <>
          <FileUploader accept="image/jpeg,image/png,image/webp" multiple onFiles={addFiles} icon="📄" title="Drop images to convert to PDF" subtitle="Supports JPG, PNG • Multiple images become multiple pages" />
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-surface-800">Images ({files.length})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="relative group">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-24 object-cover rounded-lg border border-surface-200" />
                    <button onClick={() => removeFile(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    <p className="text-xs text-surface-500 truncate mt-1">{f.name}</p>
                  </div>
                ))}
              </div>
              <button onClick={convert} disabled={isProcessing} className="btn-primary w-full py-4 mt-4">{isProcessing ? '⏳ Creating PDF...' : `📄 Create PDF (${files.length} pages)`}</button>
            </div>
          )}
        </>
      )}

      {result && (
        <div ref={resultRef} className="card-premium p-8 text-center scroll-mt-24">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">PDF Created!</h3>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Pages</div><div className="font-bold">{result.pages}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Size</div><div className="font-bold">{formatFileSize(result.size)}</div></div>
          </div>
          <button onClick={() => downloadBlob(result.blob, 'images_to_pdf.pdf')} className="btn-success w-full py-4 mb-3">📥 Download PDF</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Convert More Images</button>
        </div>
      )}

      <section className="content-section mt-8"><h2>How to Convert Images to PDF</h2><p>Drop your JPG or PNG images, reorder them if needed, and create a PDF where each image becomes a full page. The conversion uses pdf-lib and runs entirely in your browser — no server upload required.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="jpg-to-pdf" />
    </div>
  )
}
