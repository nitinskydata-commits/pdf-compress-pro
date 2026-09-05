import { useState, useCallback, useRef, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('pdf-merger')!

const faqItems = [
  { question: 'How many PDFs can I merge?', answer: 'You can merge unlimited PDF files. Simply drag and drop or select multiple files, reorder them, and combine into one document.' },
  { question: 'Is the merging done in my browser?', answer: 'Yes! All PDF merging happens directly in your browser using pdf-lib. Your files never leave your device.' },
  { question: 'Can I reorder pages before merging?', answer: 'Yes! Drag and drop the files in the list to reorder them before merging. The final PDF will follow your specified order.' },
  { question: 'Will merging reduce quality?', answer: 'No. Merging simply combines pages without any re-encoding or compression. Quality remains identical to the originals.' },
]

export default function PdfMerger() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; pageCount: number; size: number } | null>(null)
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
    const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    setFiles(prev => [...prev, ...pdfs])
    setResult(null)
  }, [])

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index))
  const moveFile = (from: number, to: number) => {
    setFiles(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const merge = useCallback(async () => {
    if (files.length < 2 || isProcessing) return
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }
      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' })
      trackToolUsage({
        toolId: 'pdf-merger',
        toolName: 'PDF Merger',
        category: 'pdf',
        action: `Merged ${files.length} PDF files`,
        details: `${mergedPdf.getPageCount()} total pages (${formatFileSize(mergedBytes.length)})`,
        compressedSize: mergedBytes.length,
        method: 'pdf-lib',
      })
      setResult({ blob, pageCount: mergedPdf.getPageCount(), size: mergedBytes.length })
    } catch (err) {
      alert('Failed to merge PDFs. Please check your files and try again.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
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
          <FileUploader accept=".pdf" multiple onFiles={addFiles} icon="📑" title="Drop multiple PDF files here" subtitle="Select 2 or more PDFs to merge • Processed in your browser" />

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-surface-800">Files to merge ({files.length})</h3>
              {files.map((f, i) => (
                <div key={i} className="card-premium p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-surface-400 w-6 text-center">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-surface-700 truncate max-w-[200px] sm:max-w-none">{f.name}</p>
                      <p className="text-xs text-surface-400">{formatFileSize(f.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {i > 0 && <button onClick={() => moveFile(i, i - 1)} className="text-xs text-primary-500 hover:underline">↑</button>}
                    {i < files.length - 1 && <button onClick={() => moveFile(i, i + 1)} className="text-xs text-primary-500 hover:underline">↓</button>}
                    <button onClick={() => removeFile(i)} className="text-xs text-danger-500 hover:underline">✕</button>
                  </div>
                </div>
              ))}
              <button onClick={merge} disabled={files.length < 2 || isProcessing} className="btn-primary w-full mt-4 py-4">
                {isProcessing ? '⏳ Merging...' : `📑 Merge ${files.length} PDFs`}
              </button>
            </div>
          )}
        </>
      )}

      {result && (
        <div ref={resultRef} className="card-premium p-8 text-center mt-6 scroll-mt-24">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">PDFs Merged Successfully!</h3>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Pages</div><div className="font-bold text-surface-800">{result.pageCount}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Size</div><div className="font-bold text-surface-800">{formatFileSize(result.size)}</div></div>
          </div>
          <button onClick={() => downloadBlob(result.blob, 'merged.pdf')} className="btn-success w-full py-4 mb-3">📥 Download Merged PDF</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Merge More PDFs</button>
        </div>
      )}

      <section className="content-section mt-8">
        <h2>How to Merge PDF Files Online</h2>
        <p>Select or drag multiple PDF files into the upload area. Reorder them by using the arrow buttons — the final merged document will follow your specified order. Click "Merge" and your combined PDF is ready for download instantly.</p>
        <p>All processing happens directly in your browser using pdf-lib, a powerful JavaScript library. Your files never leave your device, ensuring complete privacy.</p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="pdf-merger" />
    </div>
  )
}
