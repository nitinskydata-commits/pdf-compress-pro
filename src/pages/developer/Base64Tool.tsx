import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('base64-encoder-decoder')!

const faqItems = [
  { question: 'What is Base64 encoding?', answer: 'Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format using 64 printable characters.' },
  { question: 'Can Base64 handle UTF-8 characters and emojis?', answer: 'Yes! Our tool properly handles unicode UTF-8 characters like emojis, accents, and non-Latin alphabets.' },
  { question: 'Is Base64 an encryption method?', answer: 'No. Base64 is an encoding format, not encryption. Anyone can decode a Base64 string back to its original data.' },
]

export default function Base64Tool() {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)

  // Unicode safe Base64
  const encodeText = () => {
    if (!input) return
    try {
      const utf8Bytes = new TextEncoder().encode(input)
      let binary = ''
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i])
      }
      setOutput(btoa(binary))
      setError(null)
    } catch {
      setError('Failed to encode text to Base64')
    }
  }

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
    } catch {
      setError('Invalid Base64 string. Please verify the input contains valid Base64 characters.')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical={`/${tool.slug}`}
        keywords={tool.keywords}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/${tool.slug}`,
          description: tool.metaDescription,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      <nav className="breadcrumb">
        <a href="/">Home</a>
        <span className="separator">›</span>
        <span>{tool.shortName}</span>
      </nav>

      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'text'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          📝 Text Encoder / Decoder
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-5 py-3 font-semibold text-sm border-b-2 transition ${
            activeTab === 'file'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-surface-500 hover:text-surface-800'
          }`}
        >
          📁 File / Image to Base64
        </button>
      </div>

      {activeTab === 'text' ? (
        <div className="space-y-6">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-sm font-semibold text-surface-700">Input String</label>
              <button
                onClick={() => { setInput(''); setOutput(''); setError(null); }}
                className="text-xs text-red-600 hover:underline"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter plain text to encode, or Base64 string to decode..."
              className="w-full p-4 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 font-mono text-sm resize-y"
            />

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={encodeText}
                disabled={!input}
                className="btn-primary flex-1 py-3 text-sm disabled:opacity-40"
              >
                🔒 Encode to Base64
              </button>
              <button
                onClick={decodeText}
                disabled={!input}
                className="btn-accent flex-1 py-3 text-sm disabled:opacity-40"
              >
                🔓 Decode from Base64
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono">
                {error}
              </div>
            )}
          </div>

          {output && (
            <div className="card-premium p-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-semibold text-surface-700">Result</label>
                <button
                  onClick={() => copyResult(output)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium transition"
                >
                  {copied ? '✓ Copied' : '📋 Copy Output'}
                </button>
              </div>
              <textarea
                readOnly
                rows={5}
                value={output}
                className="w-full p-4 border border-surface-200 rounded-xl bg-surface-50 text-surface-800 font-mono text-sm resize-y"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="card-premium p-6 space-y-4">
          <label className="text-sm font-semibold text-surface-700">Choose Any File or Image to Encode</label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="block w-full text-sm text-surface-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
          />

          {fileBase64 && (
            <div className="mt-4 pt-4 border-t border-surface-100 space-y-3">
              <div className="flex items-center justify-between text-xs text-surface-600">
                <span>File: <strong>{fileName}</strong> ({(fileSize / 1024).toFixed(1)} KB)</span>
                <button
                  onClick={() => copyResult(fileBase64)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium transition"
                >
                  {copied ? '✓ Copied' : '📋 Copy Base64 String'}
                </button>
              </div>
              <textarea
                readOnly
                rows={6}
                value={fileBase64}
                className="w-full p-3 border border-surface-200 rounded-xl bg-surface-50 text-surface-800 font-mono text-xs resize-y"
              />
            </div>
          )}
        </div>
      )}

      <section className="content-section mt-10">
        <h2>About Free Base64 Encoder and Decoder</h2>
        <p>
          Base64 is a widely adopted standard for serializing binary data such as images, certificates, or binary payloads into safe ASCII strings.
          Use this free utility for encoding email headers, embedding inline SVG/PNG images as data URLs, or inspecting API tokens.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="base64-encoder-decoder" />
    </div>
  )
}
