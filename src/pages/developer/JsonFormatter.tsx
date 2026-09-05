import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('json-formatter')!

const faqItems = [
  { question: 'Is my JSON data kept private?', answer: 'Yes, 100%! All JSON validation, formatting, and minification runs locally within your browser.' },
  { question: 'What syntax errors does this detector catch?', answer: 'It catches missing commas, unmatched braces or brackets, invalid quotes, trailing commas, and unquoted keys with exact error messages.' },
  { question: 'What is the difference between Beautify and Minify?', answer: 'Beautify adds proper newlines and indentation to make JSON easy for humans to read. Minify strips all extra whitespace to minimize payload size for network transfer.' },
]

const sampleJson = `{
  "name": "PDFCompress Pro",
  "version": "1.0.0",
  "tools": [
    { "id": "pdf-compressor", "status": "active" },
    { "id": "json-formatter", "status": "active" }
  ],
  "features": {
    "clientSide": true,
    "fast": true,
    "privacyGuaranteed": true
  }
}`

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [indent, setIndent] = useState<number | string>(2)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const formatJson = () => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const space = indent === 'tab' ? '\t' : Number(indent)
      const formatted = JSON.stringify(parsed, null, space)
      setInput(formatted)
      setError(null)
      setSuccessMsg('Valid JSON formatted successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
      setSuccessMsg(null)
    }
  }

  const minifyJson = () => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      setInput(minified)
      setError(null)
      setSuccessMsg('JSON minified successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format')
      setSuccessMsg(null)
    }
  }

  const validateOnly = () => {
    if (!input.trim()) return
    try {
      JSON.parse(input)
      setError(null)
      setSuccessMsg('✓ Valid JSON structure!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid JSON structure')
      setSuccessMsg(null)
    }
  }

  const copyToClipboard = () => {
    if (!input) return
    navigator.clipboard.writeText(input)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Action Toolbar */}
      <div className="card-premium p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={formatJson}
              className="btn-primary text-xs px-4 py-2"
            >
              ✨ Format / Beautify
            </button>
            <button
              onClick={minifyJson}
              className="px-3.5 py-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-semibold text-xs transition shadow-xs"
            >
              📦 Minify
            </button>
            <button
              onClick={validateOnly}
              className="px-3.5 py-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-semibold text-xs transition shadow-xs"
            >
              🔍 Validate
            </button>

            <div className="flex items-center gap-1.5 ml-2 text-xs text-surface-600 font-medium">
              <span>Indent:</span>
              <select
                value={indent}
                onChange={(e) => setIndent(e.target.value === 'tab' ? 'tab' : Number(e.target.value))}
                className="border border-surface-200 rounded-lg px-2 py-1 bg-white text-xs outline-none"
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
                <option value="tab">Tab</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setInput(sampleJson); setError(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              Sample JSON
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 transition font-medium"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={() => { setInput(''); setError(null); setSuccessMsg(null); }}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-mono flex items-start gap-2">
            <span>⚠️</span>
            <div><strong>Error:</strong> {error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Editor Box */}
      <div className="card-premium p-4">
        <textarea
          rows={16}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder="Paste unformatted or invalid JSON here to validate, beautify, and clean up..."
          className="w-full p-4 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 font-mono text-xs sm:text-sm leading-relaxed resize-y bg-surface-50/50"
          spellCheck={false}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-surface-500">
          <span>Characters: {input.length.toLocaleString()}</span>
          <span>Lines: {input ? input.split('\n').length : 0}</span>
        </div>
      </div>

      <section className="content-section mt-10">
        <h2>About Online JSON Formatter & Validator</h2>
        <p>
          JSON (JavaScript Object Notation) is the ubiquitous standard for transferring structured data across web APIs, microservices, and databases.
          Our browser-based JSON Formatter allows developers to parse, beautify, and validate JSON payloads instantly without worrying about leaking proprietary API keys or data to third-party servers.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="json-formatter" />
    </div>
  )
}
