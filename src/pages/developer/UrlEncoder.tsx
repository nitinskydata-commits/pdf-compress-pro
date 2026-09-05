import { useState, useMemo } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('url-encoder-decoder')!

const faqItems = [
  { question: 'What is URL percent-encoding?', answer: 'Percent-encoding replaces unsafe or reserved ASCII characters in URLs with a "%" followed by their two-digit hexadecimal representation (e.g., space becomes %20).' },
  { question: 'What is the difference between encodeURI and encodeURIComponent?', answer: 'encodeURI preserves protocol and domain separators (: / ? # & =), whereas encodeURIComponent encodes every special character, making it ideal for query string parameters.' },
  { question: 'Is my URL data stored anywhere?', answer: 'No. Everything is parsed and transformed locally in your browser memory.' },
]

export default function UrlEncoder() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState<'component' | 'full'>('component')

  const handleEncode = () => {
    if (!input) return
    try {
      const res = mode === 'component' ? encodeURIComponent(input) : encodeURI(input)
      setInput(res)
      trackToolUsage({
        toolId: 'url-encoder',
        toolName: 'URL Encoder/Decoder',
        category: 'developer',
        action: `Encoded URL (${mode})`,
        details: `${input.length} chars -> ${res.length} encoded chars`,
        method: 'Client JS',
      })
    } catch {
      // ignore
    }
  }

  const handleDecode = () => {
    if (!input) return
    try {
      const res = mode === 'component' ? decodeURIComponent(input) : decodeURI(input)
      setInput(res)
      trackToolUsage({
        toolId: 'url-encoder',
        toolName: 'URL Encoder/Decoder',
        category: 'developer',
        action: `Decoded URL (${mode})`,
        details: `${input.length} chars -> ${res.length} decoded chars`,
        method: 'Client JS',
      })
    } catch {
      // ignore
    }
  }

  // Parse query parameters if valid URL
  const queryParams = useMemo(() => {
    if (!input) return []
    try {
      const url = new URL(input.startsWith('http') ? input : `https://example.com/${input.startsWith('?') ? '' : '?'}${input}`)
      const params: [string, string][] = []
      url.searchParams.forEach((val, key) => {
        params.push([key, val])
      })
      return params
    } catch {
      return []
    }
  }, [input])

  const copyToClipboard = () => {
    if (!input) return
    navigator.clipboard.writeText(input)
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

      {/* Control Bar */}
      <div className="card-premium p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-surface-700">Encoding Scope:</span>
            <label className="flex items-center gap-1.5 text-xs text-surface-600 cursor-pointer">
              <input
                type="radio"
                name="urlMode"
                checked={mode === 'component'}
                onChange={() => setMode('component')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Component (Query Params)</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-surface-600 cursor-pointer">
              <input
                type="radio"
                name="urlMode"
                checked={mode === 'full'}
                onChange={() => setMode('full')}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span>Full URL (encodeURI)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInput('https://example.com/search?query=hello world&category=pdf+tools&lang=en')}
              className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              Sample URL
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 transition font-medium"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={() => setInput('')}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Editor Box */}
      <div className="card-premium p-6">
        <label className="block text-sm font-semibold text-surface-700 mb-2">URL or Query String</label>
        <textarea
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste URL or string to encode or decode..."
          className="w-full p-4 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 font-mono text-sm resize-y"
        />

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleEncode}
            disabled={!input}
            className="btn-primary flex-1 py-3 text-sm disabled:opacity-40"
          >
            🔒 Encode URL
          </button>
          <button
            onClick={handleDecode}
            disabled={!input}
            className="btn-accent flex-1 py-3 text-sm disabled:opacity-40"
          >
            🔓 Decode URL
          </button>
        </div>

        {/* Parsed Query Parameters Inspector */}
        {queryParams.length > 0 && (
          <div className="mt-6 pt-6 border-t border-surface-100">
            <h3 className="text-sm font-bold text-surface-800 mb-3">Detected Query Parameters ({queryParams.length})</h3>
            <div className="overflow-x-auto border border-surface-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-50 text-surface-600 font-semibold border-b border-surface-200">
                  <tr>
                    <th className="px-4 py-2.5">Key</th>
                    <th className="px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {queryParams.map(([k, v], idx) => (
                    <tr key={idx} className="hover:bg-surface-50/50 font-mono">
                      <td className="px-4 py-2 text-primary-600 font-semibold">{k}</td>
                      <td className="px-4 py-2 text-surface-700 break-all">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <section className="content-section mt-10">
        <h2>About Free Online URL Encoder and Decoder</h2>
        <p>
          Uniform Resource Identifiers (URIs) require specific percent-encoding to ensure symbols like spaces, question marks, and ampersands are not misinterpreted by web browsers and servers.
          This tool lets developers and webmasters encode or decode URI strings and query parameters instantly.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="url-encoder-decoder" />
    </div>
  )
}
