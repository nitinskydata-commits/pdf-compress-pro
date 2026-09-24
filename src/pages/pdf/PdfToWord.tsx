import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import SEOHead from '../../components/SEOHead'
import FileUploader from '../../components/FileUploader'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize, downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

const tool = getToolBySlug('pdf-to-word') || {
  slug: 'pdf-to-word',
  name: 'PDF to Word Converter',
  shortName: 'PDF to Word',
  description: 'Convert PDF documents into editable Word (.doc) and text files directly in your browser. 100% free, private, and preserves paragraphs.',
  metaTitle: 'PDF to Word Converter Online Free — Convert PDF to Editable DOC',
  metaDescription: 'Convert PDF to Word online for free. Extract editable text, headings, and paragraphs into Microsoft Word DOC format. 100% secure with zero file uploads.',
  category: 'pdf',
  categoryLabel: 'PDF Tools',
  keywords: ['pdf to word', 'convert pdf to word', 'pdf to doc', 'pdf to text', 'free pdf to word converter online'],
  icon: '📄',
}

const faqItems = [
  {
    question: 'Can I edit the converted Word document in Microsoft Word?',
    answer: 'Yes! The output .doc file is fully compatible with Microsoft Word, Microsoft 365, Google Docs, Apple Pages, and LibreOffice Writer. You can edit text, alter fonts, and reformat paragraphs.',
  },
  {
    question: 'How does in-browser PDF to Word conversion work?',
    answer: 'We use the PDF.js parsing engine to extract structured text elements and layout coordinates from your PDF pages. The text is assembled into semantic paragraphs with preserved page breaks.',
  },
  {
    question: 'Are my confidential documents uploaded to any server?',
    answer: 'No. All parsing, text extraction, and Word document assembly execute 100% locally inside your web browser. Your confidential agreements, resumes, and reports never leave your device.',
  },
  {
    question: 'Does this tool work on scanned image-only PDFs?',
    answer: 'This tool extracts native digital text and font vectors. For scanned PDFs (which are pure photos of paper), standard text extraction may be blank without an OCR layer.',
  },
]

interface ExtractedPage {
  pageNumber: number
  text: string
  lines: string[]
}

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null)
  const [fullText, setFullText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    wordBlob: Blob
    txtBlob: Blob
    wordCount: number
    charCount: number
    pageCount: number
  } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (result) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [result])

  const handleFile = useCallback((files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setFullText('')
    setResult(null)
    setProgress(0)
  }, [])

  const convertToWord = useCallback(async () => {
    if (!file || isProcessing) return
    setIsProcessing(true)
    setProgress(5)

    try {
      const buffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: buffer })
      const pdf = await loadingTask.promise
      const totalPages = pdf.numPages
      const extractedPagesList: ExtractedPage[] = []

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()

        // Reconstruct lines based on vertical Y coordinates
        let lastY: number | null = null
        let currentLine = ''
        const lines: string[] = []

        for (const item of textContent.items) {
          if ('str' in item) {
            const y = Math.round(item.transform[5])
            if (lastY !== null && Math.abs(y - lastY) > 6) {
              if (currentLine.trim()) lines.push(currentLine.trim())
              currentLine = ''
            } else if (lastY !== null && currentLine.length > 0 && !currentLine.endsWith(' ')) {
              currentLine += ' '
            }
            currentLine += item.str
            lastY = y
          }
        }
        if (currentLine.trim()) lines.push(currentLine.trim())

        const pageJoinedText = lines.join('\n')
        extractedPagesList.push({
          pageNumber: i,
          text: pageJoinedText,
          lines,
        })

        setProgress(Math.round(5 + (i / totalPages) * 85))
      }

      const combinedText = extractedPagesList.map(p => `--- Page ${p.pageNumber} ---\n${p.text}`).join('\n\n')
      setFullText(combinedText)

      // Count metrics
      const words = combinedText.trim().split(/\s+/).filter(Boolean).length
      const chars = combinedText.length

      // Build Microsoft Word HTML formatted document
      const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${file.name.replace(/\.pdf$/i, '')}</title>
  <style>
    body { font-family: Calibri, Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #111827; }
    p { margin: 0 0 12pt 0; text-align: justify; }
    .page-header { font-size: 9pt; font-weight: bold; color: #6B7280; border-bottom: 1pt solid #E5E7EB; padding-bottom: 4pt; margin: 18pt 0 12pt 0; }
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  ${extractedPagesList
    .map(
      p => `
    <div class="page-container">
      <div class="page-header">Document Page ${p.pageNumber} of ${totalPages}</div>
      ${p.lines.map(line => `<p>${line}</p>`).join('\n')}
    </div>
    ${p.pageNumber < totalPages ? '<br class="page-break" />' : ''}
  `
    )
    .join('')}
</body>
</html>
`
      const wordBlob = new Blob(['\ufeff', docHtml], {
        type: 'application/msword;charset=utf-8',
      })

      const txtBlob = new Blob([combinedText], {
        type: 'text/plain;charset=utf-8',
      })

      trackToolUsage({
        toolId: 'pdf-to-word',
        toolName: 'PDF to Word Converter',
        category: 'pdf',
        action: `Converted ${file.name} to Word (${totalPages} pages)`,
        details: `${words} words, ${chars} characters`,
        originalSize: file.size,
        compressedSize: wordBlob.size,
        method: 'Client PDF.js Text Stream Extraction',
      })

      setProgress(100)
      setResult({
        wordBlob,
        txtBlob,
        wordCount: words,
        charCount: chars,
        pageCount: totalPages,
      })
    } catch (err) {
      alert('Failed to extract text from PDF. The document may be encrypted or image-scanned.')
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }, [file, isProcessing])

  const copyToClipboard = () => {
    if (!fullText) return
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setFile(null)
    setFullText('')
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/pdf-to-word"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.metaDescription,
          url: `${SITE_URL}/pdf-to-word`,
          applicationCategory: 'BusinessApplication',
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
          <ToolVisualBadge category="pdf" slug="pdf-to-word" name="PDF to Word" icon="📄" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            PDF to Word Converter
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert PDF documents into fully editable Microsoft Word (.doc) and clean text documents. Fast, 100% private in-browser extraction with zero server uploads.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Editable Word Format (.doc)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private In-Browser
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Unlimited Pages
            </span>
          </div>
        </div>

        {/* Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200">
          {!file ? (
            <FileUploader
              accept=".pdf,application/pdf"
              onFiles={handleFile}
              maxSizeMB={100}
              icon="📄"
              title="Drop your PDF here to convert to Word, or click to browse"
              subtitle="Extract text, headings, and paragraphs directly in your browser"
            />
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ToolVisualBadge category="pdf" slug="pdf-to-word" name="PDF" size="md" />
                  <div>
                    <p className="font-bold text-sm text-surface-900 truncate max-w-xs sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="text-xs font-semibold text-danger-600 hover:text-danger-700 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Progress Bar (if processing) */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-surface-700">
                    <span>Extracting Text & Paragraphs...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              {!result && (
                <button
                  onClick={convertToWord}
                  disabled={isProcessing}
                  className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-500/20 disabled:opacity-50"
                >
                  {isProcessing ? '⏳ Converting Document...' : '📄 Convert to Editable Word (.doc)'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Result Card */}
        {result && (
          <div ref={resultRef} className="card-premium p-6 sm:p-10 mb-8 border-2 border-emerald-500/30 scroll-mt-24">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 text-3xl font-bold flex items-center justify-center mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-surface-900 mb-2">
                Converted to Editable Word Document!
              </h3>
              <p className="text-sm text-surface-500">
                Extracted {result.wordCount.toLocaleString()} words across {result.pageCount} pages.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Pages</div>
                <div className="text-base font-bold text-surface-900">{result.pageCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Words</div>
                <div className="text-base font-bold text-surface-900">{result.wordCount.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200 text-center">
                <div className="text-xs text-surface-500 mb-1">Characters</div>
                <div className="text-base font-bold text-surface-900">{result.charCount.toLocaleString()}</div>
              </div>
            </div>

            {/* Document Text Preview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                  Extracted Text Preview
                </label>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copied ? '✓ Copied!' : '📋 Copy All Text'}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 max-h-64 overflow-y-auto text-left font-mono text-xs text-surface-800 whitespace-pre-wrap leading-relaxed">
                {fullText.slice(0, 4000)}
                {fullText.length > 4000 && '\n\n... [Preview truncated — full text included in downloads]'}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <button
                onClick={() =>
                  downloadBlob(
                    result.wordBlob,
                    `${file?.name.replace(/\.pdf$/i, '') || 'document'}.doc`
                  )
                }
                className="btn-success w-full py-4 text-base font-bold shadow-lg shadow-emerald-500/20"
              >
                📥 Download Word (.doc)
              </button>
              <button
                onClick={() =>
                  downloadBlob(
                    result.txtBlob,
                    `${file?.name.replace(/\.pdf$/i, '') || 'document'}.txt`
                  )
                }
                className="btn-secondary w-full py-4 text-base font-semibold"
              >
                📝 Download Text (.txt)
              </button>
            </div>
            <div className="text-center mt-3">
              <button onClick={reset} className="text-xs font-semibold text-surface-500 hover:text-surface-700 underline">
                Convert another PDF
              </button>
            </div>
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Convert PDF to Word Online for Free
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Need to edit text trapped inside a PDF document without paying expensive Adobe Acrobat subscription fees? PDFCompress Pro extracts the text streams, headings, and paragraphs directly in your browser and packages them into an editable Microsoft Word document.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Because extraction runs client-side using JavaScript, your confidential documents are never uploaded to any third-party server or cloud database, guaranteeing complete privacy for your legal contracts, resumes, and study materials.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="pdf-to-word" />
      </div>
    </div>
  )
}
