import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('case-converter')!

const faqItems = [
  { question: 'What is Title Case vs Sentence Case?', answer: 'Sentence case capitalizes the first letter of each sentence. Title Case capitalizes the first letter of each significant word.' },
  { question: 'What are camelCase and snake_case used for?', answer: 'These are popular programming conventions: camelCase (firstName), snake_case (first_name), and kebab-case (first-name) for code identifiers and URLs.' },
  { question: 'Is my text sent to any server?', answer: 'No, all case conversions run 100% locally in your browser using JavaScript string transformations.' },
]

export default function CaseConverter() {
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  const toSentenceCase = (str: string) => {
    return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())
  }

  const toTitleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
      if (word.length === 0) return ''
      return word.charAt(0).toUpperCase() + word.slice(1)
    }).join(' ')
  }

  const toCapitalizedCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  const toCamelCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^([A-Z])/, c => c.toLowerCase())
  }

  const toPascalCase = (str: string) => {
    return str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (ltr) => ltr.toUpperCase())
      .replace(/[^a-zA-Z0-9]+/g, '')
  }

  const toSnakeCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const toKebabCase = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const toAlternatingCase = (str: string) => {
    let result = ''
    let upper = false
    for (let i = 0; i < str.length; i++) {
      const c = str[i]
      if (/[a-zA-Z]/.test(c)) {
        result += upper ? c.toUpperCase() : c.toLowerCase()
        upper = !upper
      } else {
        result += c
      }
    }
    return result
  }

  const applyCase = (type: string) => {
    if (!input) return
    switch (type) {
      case 'upper':
        setInput(input.toUpperCase())
        break
      case 'lower':
        setInput(input.toLowerCase())
        break
      case 'sentence':
        setInput(toSentenceCase(input))
        break
      case 'title':
        setInput(toTitleCase(input))
        break
      case 'capitalized':
        setInput(toCapitalizedCase(input))
        break
      case 'camel':
        setInput(toCamelCase(input))
        break
      case 'pascal':
        setInput(toPascalCase(input))
        break
      case 'snake':
        setInput(toSnakeCase(input))
        break
      case 'kebab':
        setInput(toKebabCase(input))
        break
      case 'alternating':
        setInput(toAlternatingCase(input))
        break
      default:
        break
    }
  }

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
          applicationCategory: 'UtilityApplication',
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

      {/* Buttons Grid */}
      <div className="card-premium p-6 mb-6">
        <div className="text-sm font-semibold text-surface-700 mb-3">Choose Desired Case Style:</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <button
            onClick={() => applyCase('sentence')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            Sentence case
          </button>
          <button
            onClick={() => applyCase('lower')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            lower case
          </button>
          <button
            onClick={() => applyCase('upper')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            UPPER CASE
          </button>
          <button
            onClick={() => applyCase('capitalized')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            Capitalized Case
          </button>
          <button
            onClick={() => applyCase('title')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            Title Case
          </button>
          <button
            onClick={() => applyCase('camel')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs font-mono"
          >
            camelCase
          </button>
          <button
            onClick={() => applyCase('pascal')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs font-mono"
          >
            PascalCase
          </button>
          <button
            onClick={() => applyCase('snake')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs font-mono"
          >
            snake_case
          </button>
          <button
            onClick={() => applyCase('kebab')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs font-mono"
          >
            kebab-case
          </button>
          <button
            onClick={() => applyCase('alternating')}
            className="px-3 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 hover:border-primary-400 text-surface-800 font-medium text-xs transition shadow-xs"
          >
            aLtErNaTiNg
          </button>
        </div>
      </div>

      {/* Editor Box */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <label className="text-sm font-semibold text-surface-700">Enter Your Text</label>
          <div className="flex items-center gap-2">
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

        <textarea
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type your text here and click any case option above to transform it..."
          className="w-full p-4 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 font-sans resize-y leading-relaxed text-base"
        />

        <div className="mt-3 flex items-center justify-between text-xs text-surface-500">
          <span>Characters: {input.length}</span>
          <span>Words: {input.trim() ? input.trim().split(/\s+/).length : 0}</span>
        </div>
      </div>

      <section className="content-section mt-10">
        <h2>About Free Online Text Case Converter</h2>
        <p>
          Transform text casing effortlessly. Whether you are reformatting code identifiers into camelCase, preparing titles for blog headers, or turning accidentally typed caps into readable sentences, this utility handles all common formats instantly.
        </p>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="case-converter" />
    </div>
  )
}
