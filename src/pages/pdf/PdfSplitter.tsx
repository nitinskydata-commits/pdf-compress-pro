import { useState, useCallback } from 'react'
import { PDFDocument } from 'pdf-lib'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'

const tool = getToolBySlug('pdf-splitter')!
const faqItems = [
  { question: 'How does PDF splitting work?', answer: 'Upload your PDF, specify which pages you want (e.g., 1-3, 5, 7-10), and download the extracted pages as a new PDF. Processing happens in your browser.' },
  { question: 'Can I split into individual pages?', answer: 'Yes! Click "Split All Pages" to create a separate PDF for each page, or specify custom ranges.' },
  { question: 'Does splitting reduce quality?', answer: 'No. Pages are extracted without any re-encoding. Quality is identical to the original document.' },
]

export default function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [rangeInput, setRangeInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ blob: Blob; pages: number; size: number } | null>(null)

  const handleFile = useCallback(async (files: File[]) => {
    const f = files[0]; if (!f) return
    setFile(f); setResult(null)
    const bytes = await f.arrayBuffer()
    const pdf = await PDFDocument.load(bytes)
    setPageCount(pdf.getPageCount())
    setRangeInput(`1-${pdf.getPageCount()}`)
  }, [])

  const parseRanges = (input: string, max: number): number[] => {
    const pages = new Set<number>()
    input.split(',').forEach(part => {
      const trimmed = part.trim()
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number)
        for (let i = Math.max(1, s); i <= Math.min(max, e); i++) pages.add(i)
      } else {
        const n = Number(trimmed)
        if (n >= 1 && n <= max) pages.add(n)
      }
    })
    return Array.from(pages).sort((a, b) => a - b)
  }

  const split = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    try {
      const bytes = await file.arrayBuffer()
      const srcPdf = await PDFDocument.load(bytes)
      const selectedPages = parseRanges(rangeInput, pageCount)
      if (selectedPages.length === 0) { alert('No valid pages selected.'); return }
      const newPdf = await PDFDocument.create()
      const copied = await newPdf.copyPages(srcPdf, selectedPages.map(p => p - 1))
      copied.forEach(page => newPdf.addPage(page))
      const newBytes = await newPdf.save()
      const blob = new Blob([newBytes as unknown as BlobPart], { type: 'application/pdf' })
      setResult({ blob, pages: selectedPages.length, size: newBytes.length })
    } catch (err) { alert('Failed to split PDF.'); console.error(err) }
    finally { setIsProcessing(false) }
  }, [file, rangeInput, pageCount, isProcessing])

  const reset = () => { setFile(null); setResult(null); setPageCount(0) }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'BusinessApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {!file && !result && <FileUploader accept=".pdf" onFiles={handleFile} icon="✂️" title="Drop your PDF to split" />}

      {file && !result && (
        <div className="card-premium p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="font-semibold text-surface-800">{file.name}</p><p className="text-sm text-surface-500">{formatFileSize(file.size)} • {pageCount} pages</p></div>
            <button onClick={reset} className="text-sm text-danger-500 hover:underline">Remove</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Pages to extract</label>
            <input type="text" value={rangeInput} onChange={e => setRangeInput(e.target.value)} placeholder="e.g., 1-3, 5, 7-10" className="w-full px-4 py-3 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all" />
            <p className="text-xs text-surface-400 mt-1">Use commas and ranges: 1-3, 5, 7-10</p>
          </div>
          <button onClick={split} disabled={isProcessing} className="btn-primary w-full py-4">
            {isProcessing ? '⏳ Splitting...' : '✂️ Split PDF'}
          </button>
        </div>
      )}

      {result && (
        <div className="card-premium p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-surface-800 mb-2">PDF Split Successfully!</h3>
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-sm mx-auto">
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Pages</div><div className="font-bold">{result.pages}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500 mb-1">Size</div><div className="font-bold">{formatFileSize(result.size)}</div></div>
          </div>
          <button onClick={() => downloadBlob(result.blob, `split_${file!.name}`)} className="btn-success w-full py-4 mb-3">📥 Download Split PDF</button>
          <button onClick={reset} className="btn-secondary w-full">🔄 Split Another PDF</button>
        </div>
      )}

      <section className="content-section mt-8"><h2>How to Split a PDF</h2><p>Upload your PDF document, then specify which pages you want to extract using page numbers and ranges (e.g., "1-3, 5, 7-10"). The selected pages are extracted into a new PDF document. All processing happens in your browser — your file never leaves your device.</p></section>
      <FAQ items={faqItems} />
      <RelatedTools currentSlug="pdf-splitter" />
    </div>
  )
}
