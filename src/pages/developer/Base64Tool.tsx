import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { formatFileSize } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('base64-encoder-decoder') || {
  slug: 'base64-tool',
  name: 'Base64 Encoder & Decoder',
  shortName: 'Base64 Tool',
  description: 'Encode text or files to Base64, or decode Base64 strings back to text. Supports full Unicode UTF-8, data URI generation, and image preview.',
  metaTitle: 'Base64 Encoder & Decoder Online Free — Text & Image to Base64',
  metaDescription: 'Encode and decode Base64 online for free. Convert text, images, and files into Base64 data URIs with full Unicode support. 100% private in-browser tool.',
  category: 'developer',
  categoryLabel: 'Developer Tools',
  keywords: ['base64 encoder', 'base64 decoder', 'image to base64', 'file to base64', 'base64 decode online free'],
  icon: '010',
}

const faqItems = [
  {
    question: 'Can this tool encode emojis and foreign characters?',
    answer: 'Yes! Unlike basic JavaScript atob/btoa functions that crash on Unicode, our tool encodes and decodes using the modern TextEncoder and TextDecoder APIs, ensuring 100% fidelity for emojis, accents, and non-Latin alphabets.',
  },
  {
    question: 'What is the difference between Raw Base64 and a Data URI?',
    answer: 'A Data URI includes the MIME type prefix (e.g. data:image/png;base64,...) so that web browsers can directly render it as an image source or CSS background. Raw Base64 contains only the pure encoded bytes.',
  },
  {
    question: 'Is Base64 a secure form of encryption?',
    answer: 'No. Base64 is an encoding format designed for transmitting binary data across text-only protocols (like JSON and email). It provides no confidentiality and can be decoded by anyone.',
  },
  {
    question: 'Are my files or passwords uploaded to a server?',
    answer: 'No. All conversions execute 100% locally inside your web browser. Nothing is sent over the internet.',
  },
]

export default function Base64Tool() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // File state
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [fileSize, setFileSize] = useState(0)

  // Unicode safe Base64 encoding
  const encodeText = () => {
    if (!input) return
    try {
      const utf8Bytes = new TextEncoder().encode(input)
      let binary = ''
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i])
      }
      const encoded = btoa(binary)
      setOutput(encoded)
      setError(null)
      trackToolUsage({
        toolId: 'base64-tool',
        toolName: 'Base64 Encoder/Decoder',
        category: 'developer',
        action: 'Encoded text to Base64',
        details: `${input.length} chars -> ${encoded.length} Base64 chars`,
        method: 'Client JS',
      })
    } catch {
      setError('Failed to encode text to Base64.')
    }
  }

  // Unicode safe Base64 decoding
  const decodeText = () => {
    if (!input) return
    try {
      const binary = atob(input.trim())
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const decoded = new TextDecoder().decode(bytes)
      setOutput(decoded)
      setError(null)
      trackToolUsage({
        toolId: 'base64-tool',
        toolName: 'Base64 Encoder/Decoder',
        category: 'developer',
        action: 'Decoded Base64 to text',
        details: `${input.length} Base64 chars -> ${decoded.length} chars`,
        method: 'Client JS',
      })
    } catch {
      setError('Invalid Base64 string. Please verify the input contains valid Base64 characters.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setFileType(file.type || 'application/octet-stream')
    setFileSize(file.size)

    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      setFileBase64(res)
    }
    reader.readAsDataURL(file)
  }

  const copyResult = (textToCopy: string) => {
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rawBase64 = fileBase64 ? fileBase64.split(',')[1] || '' : ''

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/base64-tool"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/base64-tool`,
          description: tool.metaDescription,
          applicationCategory: 'DeveloperApplication',
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
          <Link to="/#category-catalog">Developer Tools</Link>
          <span className="separator">›</span>
          <span className="text-surface-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Hero */}
        <div className="card-premium p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
          <ToolVisualBadge category="developer" slug="base64-tool" name="Base64" icon="010" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            Base64 Encoder & Decoder
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Convert text and binary files to Base64, or decode Base64 strings back to clean text. Full UTF-8 Unicode support with instant in-browser data URI generation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Full UTF-8 Unicode & Emojis
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> File & Image to Base64 URI
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Zero Server Uploads
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'text'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
            }`}
          >
            📝 Text Encoder / Decoder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'file'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
            }`}
          >
            📁 File / Image to Base64
          </button>
        </div>

        {/* Text Mode */}
        {activeTab === 'text' && (
          <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                  Input String
                </label>
                <span className="text-xs text-surface-500">{input.length} characters</span>
              </div>
              <textarea
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter plain text or Base64 string to convert..."
                rows={5}
                className="w-full p-4 rounded-xl border border-surface-300 font-mono text-xs sm:text-sm text-surface-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={encodeText}
                disabled={!input}
                className="btn-primary text-xs px-5 py-2.5 font-bold shadow-sm"
              >
                🔒 Encode to Base64
              </button>
              <button
                type="button"
                onClick={decodeText}
                disabled={!input}
                className="px-5 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-bold text-xs transition shadow-xs"
              >
                🔓 Decode to Plain Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput('')
                  setOutput('')
                  setError(null)
                }}
                disabled={!input && !output}
                className="text-xs px-3 py-2 text-danger-600 hover:bg-danger-50 rounded-lg font-semibold ml-auto"
              >
                Clear
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Output Box */}
            {output && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                    Converted Result
                  </label>
                  <button
                    type="button"
                    onClick={() => copyResult(output)}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    {copied ? '✓ Copied!' : '📋 Copy Output'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={output}
                  rows={5}
                  className="w-full p-4 rounded-xl border border-surface-200 bg-surface-50 font-mono text-xs sm:text-sm text-surface-800"
                />
              </div>
            )}
          </div>
        )}

        {/* File to Base64 Mode */}
        {activeTab === 'file' && (
          <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200 space-y-6">
            <div className="p-8 border-2 border-dashed border-surface-300 rounded-2xl text-center bg-surface-50/50 hover:bg-surface-50 transition-colors">
              <div className="text-4xl mb-3">📁</div>
              <h3 className="font-bold text-surface-800 text-sm mb-1">
                Select Any File or Image to Encode
              </h3>
              <p className="text-xs text-surface-500 mb-4">
                Supports JPG, PNG, WebP, SVG, PDF, and audio files
              </p>
              <label className="btn-primary text-xs px-5 py-2.5 font-bold cursor-pointer inline-block shadow-sm">
                Browse File
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {fileBase64 && (
              <div className="space-y-4 pt-2">
                {/* File Metadata Card */}
                <div className="p-4 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-surface-900">{fileName}</p>
                    <p className="text-[11px] text-surface-500">
                      {formatFileSize(fileSize)} • {fileType}
                    </p>
                  </div>
                  {fileType.startsWith('image/') && (
                    <img
                      src={fileBase64}
                      alt="Thumbnail"
                      className="w-12 h-12 object-contain rounded-lg border border-surface-200 bg-white"
                    />
                  )}
                </div>

                {/* Data URI String */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                      HTML / CSS Data URI
                    </label>
                    <button
                      type="button"
                      onClick={() => copyResult(fileBase64)}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700"
                    >
                      {copied ? '✓ Copied!' : '📋 Copy Data URI'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={fileBase64}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-surface-200 bg-surface-50 font-mono text-xs text-surface-800"
                  />
                </div>

                {/* Raw Base64 String */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-surface-600">
                      Raw Base64 (Without MIME Prefix)
                    </label>
                    <button
                      type="button"
                      onClick={() => copyResult(rawBase64)}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700"
                    >
                      {copied ? '✓ Copied!' : '📋 Copy Raw Base64'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={rawBase64}
                    rows={4}
                    className="w-full p-3 rounded-xl border border-surface-200 bg-surface-50 font-mono text-xs text-surface-800"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            About Online Base64 Encoding & Decoding
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Base64 is a binary-to-text encoding scheme that translates raw data into a set of 64 ASCII characters. It is widely used in web development for embedding inline images in HTML and CSS, transmitting JSON Web Tokens (JWT), and attaching media files into email bodies.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            Our tool operates completely client-side, enabling developers to convert files and sensitive text safely without transmitting any proprietary information to third-party endpoints.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="base64-tool" />
      </div>
    </div>
  )
}
