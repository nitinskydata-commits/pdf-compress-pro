import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('json-formatter') || {
  slug: 'json-formatter',
  name: 'JSON Formatter & Validator',
  shortName: 'JSON Formatter',
  description: 'Format, beautify, validate, and minify JSON data online. Catch syntax errors with exact line locations. 100% private in-browser processing.',
  metaTitle: 'JSON Formatter & Validator Online Free — Beautify & Minify JSON',
  metaDescription: 'Format and validate JSON online for free. Beautify messy JSON, minify payloads, and detect syntax errors instantly. 100% client-side privacy.',
  category: 'developer',
  categoryLabel: 'Developer Tools',
  keywords: ['json formatter', 'beautify json', 'json validator', 'minify json', 'json pretty print online'],
  icon: '{;}',
}

const faqItems = [
  {
    question: 'Is my confidential JSON or API data kept private?',
    answer: 'Yes, 100%! All JSON validation, formatting, and minification run locally within your web browser. None of your payload data or API responses are ever sent to any remote server.',
  },
  {
    question: 'What syntax errors does this validator catch?',
    answer: 'It catches missing commas, unmatched braces or brackets, invalid single-quotes, trailing commas, and unquoted object keys with helpful error explanations.',
  },
  {
    question: 'What is the difference between Format and Minify?',
    answer: 'Format (Beautify) adds proper newlines and indentation to make nested JSON structures easy for humans to read and inspect. Minify strips all unnecessary whitespace to minimize payload size for network transfers and production APIs.',
  },
  {
    question: 'Can I upload a .json file directly?',
    answer: 'Yes! You can either paste JSON text directly or click "Upload .json File" to load large data files into the editor instantly.',
  },
]

const sampleJson = `{
  "site": "PDFCompress Pro",
  "version": "2.0.0",
  "status": "operational",
  "stats": {
    "totalTools": 1000,
    "categories": 25,
    "clientSide": true
  },
  "features": [
    "100% Private In-Browser",
    "Lossless Document Processing",
    "Instant Zero-Wait Conversions"
  ]
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
      setSuccessMsg('✓ Valid JSON formatted successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
      trackToolUsage({
        toolId: 'json-formatter',
        toolName: 'JSON Formatter',
        category: 'developer',
        action: 'Formatted JSON with indentation',
        details: `${input.length} chars -> ${formatted.length} chars`,
        method: 'Client JS',
      })
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
      const saved = Math.max(0, input.length - minified.length)
      setInput(minified)
      setError(null)
      setSuccessMsg(`✓ Minified! Saved ${saved} whitespace characters.`)
      setTimeout(() => setSuccessMsg(null), 3000)
      trackToolUsage({
        toolId: 'json-formatter',
        toolName: 'JSON Formatter',
        category: 'developer',
        action: 'Minified JSON',
        details: `Saved ${saved} whitespace characters`,
        sizeSaved: saved,
        method: 'Client JS',
      })
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

  const downloadJsonFile = () => {
    if (!input) return
    const blob = new Blob([input], { type: 'application/json' })
    downloadBlob(blob, 'formatted.json')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      const content = evt.target?.result as string
      setInput(content)
      setError(null)
    }
    reader.readAsText(file)
  }

  // Calculate live stats
  const charCount = input.length
  const lineCount = input ? input.split('\n').length : 0

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-14">
      <SEOHead
        title={tool.metaTitle}
        description={tool.metaDescription}
        canonical="/json-formatter"
        keywords={tool.keywords}
        toolName={tool.name}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: tool.name,
          url: `${SITE_URL}/json-formatter`,
          description: tool.metaDescription,
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <ToolVisualBadge category="developer" slug="json-formatter" name="JSON" icon="{;}" size="xl" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
            JSON Formatter & Validator
          </h1>
          <p className="text-sm sm:text-base text-surface-600 max-w-2xl mx-auto leading-relaxed mb-6">
            Beautify, validate, and minify your JSON data with instant syntax error detection. Fast, 100% private in-browser processing with zero remote network calls.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-surface-600">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Instant Syntax Validation
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> 100% Private In-Browser
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-100 rounded-full">
              <span className="text-emerald-500">✓</span> Minify & Beautify
            </span>
          </div>
        </div>

        {/* Main Workspace */}
        <div className="card-premium p-6 sm:p-8 mb-8 border border-surface-200 space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={formatJson}
                className="btn-primary text-xs px-4 py-2 font-bold shadow-sm"
              >
                ✨ Beautify / Format
              </button>
              <button
                type="button"
                onClick={minifyJson}
                className="px-3.5 py-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-semibold text-xs transition shadow-xs"
              >
                📦 Minify
              </button>
              <button
                type="button"
                onClick={validateOnly}
                className="px-3.5 py-2 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 text-surface-700 font-semibold text-xs transition shadow-xs"
              >
                🔍 Validate
              </button>

              <div className="flex items-center gap-1.5 ml-2 text-xs text-surface-600 font-medium">
                <span>Indent:</span>
                <select
                  value={indent}
                  onChange={e => setIndent(e.target.value === 'tab' ? 'tab' : Number(e.target.value))}
                  className="border border-surface-200 rounded-lg px-2 py-1 bg-white text-xs outline-none"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput(sampleJson)
                  setError(null)
                }}
                className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition font-medium"
              >
                Load Sample
              </button>
              <label className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 bg-white text-surface-600 hover:bg-surface-50 transition font-medium cursor-pointer">
                Upload File
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!input}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 transition font-bold"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <button
                type="button"
                onClick={downloadJsonFile}
                disabled={!input}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 transition font-bold"
              >
                📥 Download
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput('')
                  setError(null)
                  setSuccessMsg(null)
                }}
                disabled={!input}
                className="text-xs px-3 py-1.5 rounded-lg text-danger-600 hover:bg-danger-50 disabled:opacity-40 transition font-semibold"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-danger-50 border border-danger-200 text-danger-800 text-xs font-mono leading-relaxed">
              <span className="font-bold">JSON Syntax Error:</span> {error}
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {/* Editor Container */}
          <div className="relative rounded-2xl border border-surface-200 overflow-hidden bg-surface-950">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-surface-800 text-surface-400 text-xs">
              <span className="font-mono">JSON Document</span>
              <div className="flex items-center gap-4">
                <span>{lineCount} lines</span>
                <span>{charCount.toLocaleString()} chars</span>
              </div>
            </div>

            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value)
                if (error) setError(null)
              }}
              placeholder="Paste raw JSON here, or click 'Load Sample'..."
              rows={18}
              className="w-full p-4 font-mono text-xs sm:text-sm text-surface-100 bg-surface-950 focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* SEO Explanations */}
        <section className="card-premium p-6 sm:p-8 mb-8 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-surface-900">
            How to Format and Validate JSON Online
          </h2>
          <p className="text-sm text-surface-600 leading-relaxed">
            Working with dense, unformatted JSON payloads returned from REST or GraphQL APIs can be challenging. PDFCompress Pro parses, validates, and beautifies JSON with customizable 2-space, 4-space, or tab indentation.
          </p>
          <p className="text-sm text-surface-600 leading-relaxed">
            If there are broken syntax structures, trailing commas, or missing brackets, our validator provides instant error messages pointing you straight to the issue. Best of all, your API keys and confidential payloads never leave your browser memory.
          </p>
        </section>

        {/* FAQ & Related */}
        <FAQ items={faqItems} />
        <RelatedTools currentSlug="json-formatter" />
      </div>
    </div>
  )
}
