import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('url-encoder-decoder') || {
  slug: 'url-encoder-decoder',
  name: 'URL Encoder & Decoder — Percent-Encoding & Query Parameter Tool',
  shortName: 'URL Encoder / Decoder',
  description: 'Encode and decode URLs, query strings, and URI components in accordance with RFC 3986. Inspect parsed query parameters with 100% private in-browser execution.',
  metaTitle: 'URL Encoder & Decoder Online Free — RFC 3986 Percent Encoding',
  metaDescription: 'Encode and decode URLs and URI query parameters online. Switch between encodeURI and encodeURIComponent with live query parameter extraction. 100% private.',
  category: 'developer',
  categoryLabel: 'Developer Tools',
  keywords: ['url encoder', 'url decoder', 'percent encoding online', 'encodeURIComponent', 'url query parser'],
  icon: '🔗',
}

const faqItems = [
  {
    question: 'What is URL percent-encoding (RFC 3986)?',
    answer: 'Percent-encoding replaces unsafe, reserved, or non-ASCII characters in a URI with a "%" character followed by two hexadecimal digits representing their UTF-8 byte value (e.g. space becomes %20 or +, "&" becomes %26).',
  },
  {
    question: 'When should I use Component vs Full URL mode?',
    answer: 'Use "Component (encodeURIComponent)" when encoding individual query parameter values (e.g. usernames, search terms, callbacks) so delimiters like "&", "=", and "?" are safely escaped. Use "Full URL (encodeURI)" when encoding a complete web address without breaking standard protocol and path separators (: / ? # & =).',
  },
  {
    question: 'Can this tool parse and inspect complex query parameters?',
    answer: 'Yes! When you input any URL containing query parameters (such as ?q=search&lang=en), the interactive Query Parameter Inspector automatically parses each key-value pair for easy copying and debugging.',
  },
  {
    question: 'Is my URL or API token data stored or transmitted?',
    answer: 'No! All parsing and transformation happen 100% in your local browser memory using native JavaScript engines. No URLs, tokens, or query strings are sent across any network.',
  },
]

const sampleUrls = {
  search: 'https://example.com/search?query=fast pdf compression&category=document-tools&sort=asc#results',
  oauth: 'https://auth.provider.com/oauth/authorize?client_id=pro_client_9823&redirect_uri=https://myapp.com/callback&response_type=code&scope=profile email read:files',
  webhook: 'https://api.gateway.io/v1/events?event_name=user.signup&payload={"userId":"usr_772","role":"admin"}&signature=abc123xyz',
}

export default function UrlEncoder() {
  const [input, setInput] = useState('https://example.com/search?query=hello world & pdf compression&category=tools')
  const [mode, setMode] = useState<'component' | 'full'>('component')
  const [copied, setCopied] = useState(false)
  const [paramCopied, setParamCopied] = useState<string | null>(null)

  const handleEncode = () => {
    if (!input) return
    try {
      const res = mode === 'component' ? encodeURIComponent(input) : encodeURI(input)
      setInput(res)
      trackToolUsage({
        toolId: 'url-encoder-decoder',
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
        toolId: 'url-encoder-decoder',
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

  // Parse query parameters
  const queryParams = useMemo(() => {
    if (!input) return []
    try {
      const url = new URL(input.startsWith('http') ? input : `https://example.com/${input.startsWith('?') ? '' : '?'}${input}`)
      const params: Array<{ key: string; rawValue: string; decodedValue: string }> = []
      url.searchParams.forEach((val, key) => {
        try {
          params.push({
            key,
            rawValue: val,
            decodedValue: decodeURIComponent(val),
          })
        } catch {
          params.push({ key, rawValue: val, decodedValue: val })
        }
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

  const copyParamValue = (val: string, id: string) => {
    navigator.clipboard.writeText(val)
    setParamCopied(id)
    setTimeout(() => setParamCopied(null), 1500)
  }

  const downloadText = () => {
    if (!input) return
    const blob = new Blob([input], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, 'url-encoded-data.txt')
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

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link>
        <span>/</span>
        <span className="text-surface-700 font-medium">{tool.shortName}</span>
      </nav>

      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20">
        <ToolVisualBadge category="developer" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              🔗 RFC 3986 Standards
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
              🔍 Live Query Param Inspector
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              ⚡ Instant Encode / Decode
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden mb-8">
        {/* Top Control Header */}
        <div className="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center justify-between gap-4">
          {/* Encoding Mode Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Encoding Mode:</span>
            <div className="flex bg-surface-200 p-0.5 rounded-xl">
              <button
                onClick={() => setMode('component')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  mode === 'component'
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                Component (encodeURIComponent)
              </button>
              <button
                onClick={() => setMode('full')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  mode === 'full'
                    ? 'bg-white text-surface-900 shadow-sm'
                    : 'text-surface-600 hover:text-surface-900'
                }`}
              >
                Full URL (encodeURI)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 font-medium transition inline-flex items-center gap-1.5"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={downloadText}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 font-medium transition inline-flex items-center gap-1.5"
            >
              💾 Save .txt
            </button>
            <button
              onClick={() => setInput('')}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 font-medium transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4">
          <textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your URL, query string, or text here to encode or decode..."
            className="w-full p-4 border border-surface-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-surface-800 font-mono text-sm resize-y leading-relaxed"
          />
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-surface-50 border-t border-surface-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEncode}
              disabled={!input}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition disabled:opacity-40 flex items-center gap-1.5"
            >
              🔒 Encode URL
            </button>
            <button
              onClick={handleDecode}
              disabled={!input}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm hover:shadow transition disabled:opacity-40 flex items-center gap-1.5"
            >
              🔓 Decode URL
            </button>
          </div>

          {/* Quick Preset Samples */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-surface-400 font-medium mr-1">Samples:</span>
            <button
              onClick={() => setInput(sampleUrls.search)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              Search URL
            </button>
            <button
              onClick={() => setInput(sampleUrls.oauth)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              OAuth Callback
            </button>
            <button
              onClick={() => setInput(sampleUrls.webhook)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              Webhook Payload
            </button>
          </div>
        </div>
      </div>

      {/* Query Parameters Inspector Table */}
      {queryParams.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-surface-900">Query Parameter Inspector</h3>
              <p className="text-xs text-surface-500">Automatically extracted and decoded URL query parameters</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {queryParams.length} {queryParams.length === 1 ? 'parameter' : 'parameters'} detected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-surface-600 text-xs uppercase font-bold border-b border-surface-200">
                <tr>
                  <th className="py-3 px-4 w-1/4">Key (Parameter)</th>
                  <th className="py-3 px-4 w-1/3">Raw / Encoded Value</th>
                  <th className="py-3 px-4">Decoded Value</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 font-mono text-xs text-surface-700">
                {queryParams.map((param, idx) => (
                  <tr key={`${param.key}-${idx}`} className="hover:bg-surface-50 transition">
                    <td className="py-3 px-4 font-bold text-blue-700 break-all">{param.key}</td>
                    <td className="py-3 px-4 text-surface-600 break-all">{param.rawValue}</td>
                    <td className="py-3 px-4 font-sans text-surface-900 break-all">{param.decodedValue}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => copyParamValue(param.decodedValue, `${param.key}-${idx}`)}
                        className="text-xs px-2.5 py-1 rounded bg-surface-100 hover:bg-surface-200 text-surface-700 transition"
                      >
                        {paramCopied === `${param.key}-${idx}` ? '✓ Copied' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About URL Percent-Encoding & Decoding</h2>
        <p>
          Uniform Resource Identifiers (URIs) can only be sent across the internet using the standard ASCII character set.
          When a web address includes characters outside ASCII (such as spaces, punctuation, or non-Latin glyphs), they must be converted into a valid URL format through percent-encoding.
        </p>

        <h3>encodeURI vs encodeURIComponent</h3>
        <p>
          JavaScript provides two primary encoding primitives:
        </p>
        <ul>
          <li><strong>encodeURI:</strong> Intended for complete web addresses. It does not encode protocol delimiters or path separators (<code>:</code>, <code>/</code>, <code>?</code>, <code>#</code>, <code>&</code>, <code>=</code>).</li>
          <li><strong>encodeURIComponent:</strong> Intended for query parameter values. It encodes every reserved symbol (such as <code>&</code> to <code>%26</code>, <code>=</code> to <code>%3D</code>, and <code>/</code> to <code>%2F</code>) so query strings remain well-formed.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="url-encoder-decoder" />
    </div>
  )
}
