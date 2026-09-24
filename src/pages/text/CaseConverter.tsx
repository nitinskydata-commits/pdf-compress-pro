import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('case-converter') || {
  slug: 'case-converter',
  name: 'Case Converter — UPPERCASE, lowercase, Title Case & Code Formats',
  shortName: 'Case Converter',
  description: 'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, and CONSTANT_CASE with instant previews.',
  metaTitle: 'Case Converter Online Free — Title Case, UPPERCASE, camelCase & More',
  metaDescription: 'Instantly convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, and snake_case online. Live preview and 100% private in-browser conversions.',
  category: 'text',
  categoryLabel: 'Text & Writing',
  keywords: ['case converter', 'title case converter', 'uppercase to lowercase', 'camelcase generator', 'snake case converter online'],
  icon: 'Aa',
}

const faqItems = [
  {
    question: 'What is Title Case vs Sentence Case?',
    answer: 'Sentence case capitalizes only the first letter of each sentence and proper nouns. Title Case capitalizes the first letter of all major words while keeping short articles, conjunctions, and prepositions in lowercase.',
  },
  {
    question: 'What are programming cases (camelCase, snake_case, kebab-case)?',
    answer: 'Programming conventions structure multi-word identifiers: camelCase (e.g. userProfileData), PascalCase (e.g. UserProfileData), snake_case (e.g. user_profile_data), and kebab-case (e.g. user-profile-data).',
  },
  {
    question: 'Can I convert large text documents without character limits?',
    answer: 'Yes! Processing happens entirely within your web browser with zero remote transmission, so you can transform long essays, codebases, or draft documents instantly.',
  },
  {
    question: 'Is my text safe and private?',
    answer: 'Yes, 100%! No data is ever transmitted across the internet. Everything is computed directly on your device via JavaScript.',
  },
]

const sampleText = 'PDFCompress Pro is an ultra-fast in-browser document and developer utility suite. It delivers zero-wait conversions without file size limits.'

export default function CaseConverter() {
  const [input, setInput] = useState(sampleText)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pure case converters
  const conversions = useMemo(() => {
    const trimmed = input.trim()

    const toSentenceCase = (str: string) =>
      str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())

    const toTitleCase = (str: string) => {
      const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'yet'])
      return str
        .toLowerCase()
        .split(/\s+/)
        .map((word, idx) => {
          if (idx !== 0 && minorWords.has(word)) return word
          return word.charAt(0).toUpperCase() + word.slice(1)
        })
        .join(' ')
    }

    const toCapitalizedCase = (str: string) =>
      str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())

    const toCamelCase = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^([A-Z])/, (c) => c.toLowerCase())
        .trim()

    const toPascalCase = (str: string) =>
      str
        .toLowerCase()
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr) => ltr.toUpperCase())
        .replace(/[^a-zA-Z0-9]+/g, '')
        .trim()

    const toSnakeCase = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

    const toKebabCase = (str: string) =>
      str
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    const toConstantCase = (str: string) =>
      str
        .trim()
        .toUpperCase()
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

    const toAlternatingCase = (str: string) => {
      let res = ''
      let upper = false
      for (let i = 0; i < str.length; i++) {
        const c = str[i]
        if (/[a-zA-Z]/.test(c)) {
          res += upper ? c.toUpperCase() : c.toLowerCase()
        } else {
          res += c
        }
        upper = !upper
      }
      return res
    }

    const toInverseCase = (str: string) => {
      let res = ''
      for (let i = 0; i < str.length; i++) {
        const c = str[i]
        if (c === c.toUpperCase()) {
          res += c.toLowerCase()
        } else {
          res += c.toUpperCase()
        }
      }
      return res
    }

    return {
      upper: input.toUpperCase(),
      lower: input.toLowerCase(),
      title: toTitleCase(trimmed),
      sentence: toSentenceCase(trimmed),
      capitalized: toCapitalizedCase(trimmed),
      camel: toCamelCase(trimmed),
      pascal: toPascalCase(trimmed),
      snake: toSnakeCase(trimmed),
      kebab: toKebabCase(trimmed),
      constant: toConstantCase(trimmed),
      alternating: toAlternatingCase(input),
      inverse: toInverseCase(input),
    }
  }, [input])

  const stats = useMemo(() => {
    const trimmed = input.trim()
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
    const chars = input.length
    const lines = trimmed ? input.split('\n').length : 0
    return { words, chars, lines }
  }, [input])

  const copyText = (textToCopy: string, key: string) => {
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const applyInPlace = (type: keyof typeof conversions) => {
    const val = conversions[type]
    setInput(val)
    trackToolUsage({
      toolId: 'case-converter',
      toolName: 'Case Converter',
      category: 'text',
      action: `Converted text to ${type} case`,
      details: `${val.length} chars`,
      method: 'Client JS',
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result
      if (typeof content === 'string') {
        setInput(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const downloadText = () => {
    if (!input) return
    const blob = new Blob([input], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, 'converted-case-text.txt')
  }

  const caseCards: Array<{
    key: keyof typeof conversions
    title: string
    desc: string
    badge: string
  }> = [
    { key: 'upper', title: 'UPPERCASE', desc: 'ALL CAPITAL LETTERS', badge: 'TEXT' },
    { key: 'lower', title: 'lowercase', desc: 'all small letters', badge: 'TEXT' },
    { key: 'title', title: 'Title Case', desc: 'Capitalizes Principal Words', badge: 'PROSE' },
    { key: 'sentence', title: 'Sentence case', desc: 'First letter of each sentence capitalized.', badge: 'PROSE' },
    { key: 'capitalized', title: 'Capitalized Case', desc: 'Every Single Word Starts With A Capital', badge: 'HEADLINE' },
    { key: 'camel', title: 'camelCase', desc: 'popularForJavascriptVariables', badge: 'CODE' },
    { key: 'pascal', title: 'PascalCase', desc: 'UsedForClassNamesAndTypes', badge: 'CODE' },
    { key: 'snake', title: 'snake_case', desc: 'common_in_python_and_sql', badge: 'CODE' },
    { key: 'kebab', title: 'kebab-case', desc: 'ideal-for-urls-and-css-classes', badge: 'CODE' },
    { key: 'constant', title: 'CONSTANT_CASE', desc: 'GLOBAL_CONFIG_VARIABLES', badge: 'CODE' },
    { key: 'alternating', title: 'aLtErNaTiNg cAsE', desc: 'mOcKiNg sPoNgEbOb cAsE', badge: 'MEME' },
    { key: 'inverse', title: 'InVeRsE cAsE', desc: 'Flips upper and lower characters', badge: 'UTIL' },
  ]

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
          applicationCategory: 'UtilityApplication',
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent p-6 rounded-2xl border border-teal-500/20">
        <ToolVisualBadge category="text" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Aa 12 Distinct Formats
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ Live Synchronized Previews
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              💻 Programming Conventions
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔒 100% In-Browser Privacy
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden mb-8">
        {/* Top Control Header */}
        <div className="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Stats:</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-surface-200 rounded-lg text-surface-700">
              {stats.words.toLocaleString()} words
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-surface-200 rounded-lg text-surface-700">
              {stats.chars.toLocaleString()} characters
            </span>
            {stats.lines > 1 && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-surface-200 rounded-lg text-surface-700">
                {stats.lines} lines
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.md,.rtf,.json,.csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 font-semibold transition inline-flex items-center gap-1.5"
            >
              📁 Upload .txt
            </button>
            <button
              onClick={() => setInput(sampleText)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 font-semibold transition"
            >
              Insert Sample
            </button>
            <button
              onClick={() => copyText(input, 'main')}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 font-medium transition inline-flex items-center gap-1.5"
            >
              {copiedKey === 'main' ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={downloadText}
              disabled={!input}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 font-medium transition inline-flex items-center gap-1.5"
            >
              💾 Save
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
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text here to transform cases..."
            className="w-full p-4 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-surface-800 font-sans resize-y leading-relaxed text-base"
          />
        </div>

        {/* Instant Transform Buttons Bar */}
        <div className="p-4 bg-surface-50 border-t border-surface-200">
          <div className="text-xs font-bold text-surface-600 uppercase tracking-wider mb-2.5">
            Convert Editor Text Directly:
          </div>
          <div className="flex flex-wrap gap-2">
            {caseCards.map(({ key, title }) => (
              <button
                key={key}
                onClick={() => applyInPlace(key)}
                disabled={!input}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 disabled:opacity-40 transition shadow-sm"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview & Instant Copy Cards Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-surface-900">Synchronized Format Previews</h3>
            <p className="text-xs text-surface-500">Click any card to copy that specific format directly to your clipboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseCards.map(({ key, title, desc, badge }) => {
            const convertedVal = conversions[key]
            return (
              <div
                key={key}
                className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm hover:border-teal-500/50 hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-surface-900">{title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-100 text-surface-600">
                        {badge}
                      </span>
                    </div>
                    <button
                      onClick={() => copyText(convertedVal, key)}
                      disabled={!convertedVal}
                      className="text-xs px-3 py-1 rounded-lg bg-surface-100 group-hover:bg-teal-50 group-hover:text-teal-700 group-hover:border-teal-200 font-semibold border border-transparent transition inline-flex items-center gap-1"
                    >
                      {copiedKey === key ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-surface-400 mb-3">{desc}</p>
                </div>

                <div className="p-3 bg-surface-50 rounded-xl font-mono text-xs text-surface-800 break-words line-clamp-3 leading-relaxed border border-surface-100">
                  {convertedVal || <span className="text-surface-300 italic">Empty output...</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SEO Explanatory Guide */}
      <section className="content-section mt-10">
        <h2>About Free Online Case Converter</h2>
        <p>
          Whether correcting accidental CAPS LOCK typing, formatting blog post titles for search engine visibility, or sanitizing text for programming identifiers, this tool provides instant transformations across 12 distinct typographical formats.
        </p>

        <h3>When to Use Each Case Style</h3>
        <ul>
          <li><strong>Title Case:</strong> Standard for book titles, blog headlines, and press release banners.</li>
          <li><strong>Sentence case:</strong> The standard format for normal English prose and email communications.</li>
          <li><strong>camelCase & PascalCase:</strong> Ubiquitous in TypeScript, JavaScript, C#, and Java for variable and class definitions.</li>
          <li><strong>snake_case & kebab-case:</strong> Industry standard for Python variables, database table columns, and URL slugs.</li>
          <li><strong>CONSTANT_CASE:</strong> Used across backend systems for immutable environment variables and global configuration flags.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="case-converter" />
    </div>
  )
}
