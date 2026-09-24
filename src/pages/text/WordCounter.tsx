import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import ToolVisualBadge from '../../components/ToolVisualBadge'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { downloadBlob } from '../../utils/fileUtils'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('word-counter') || {
  slug: 'word-counter',
  name: 'Free Online Word Counter & Character Analyzer',
  shortName: 'Word Counter',
  description: 'Count words, characters, sentences, paragraphs, and reading time in real-time. Includes case conversions, keyword density, and 100% private in-browser analysis.',
  metaTitle: 'Word Counter Online Free — Real-Time Character & Word Count Tool',
  metaDescription: 'Accurately count words, characters, sentences, paragraphs, reading speed, and keyword frequency online. Free case converters and 100% private text analysis.',
  category: 'text',
  categoryLabel: 'Text & Writing',
  keywords: ['word counter', 'character count online', 'word count tool', 'reading time calculator', 'case converter online'],
  icon: '🔤',
}

const faqItems = [
  {
    question: 'How is the word count calculated?',
    answer: 'Words are calculated by splitting text on whitespace and punctuation boundaries, excluding empty spaces and punctuation-only tokens.',
  },
  {
    question: 'How are reading and speaking times estimated?',
    answer: 'Reading time is calculated using the standard adult silent reading rate of 200 words per minute (WPM). Speaking time is based on an average conversational speech rate of 130 words per minute.',
  },
  {
    question: 'Is my text private, secure, and kept confidential?',
    answer: 'Yes, 100%! All text processing, character counting, and transformations run completely locally in your web browser. None of your writing, drafts, or sensitive notes are ever uploaded or transmitted to any external server.',
  },
  {
    question: 'Can I upload files like .txt or .md to count words?',
    answer: 'Yes! You can paste text directly, type in real time, or click "Upload File" to load any plain text, markdown, or code document from your device.',
  },
  {
    question: 'What case conversions are supported?',
    answer: 'You can instantly transform text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, kebab-case, or clean up redundant multiple spaces.',
  },
]

const sampleText = `Welcome to PDFCompress Pro! Our suite of over 1,000 online tools delivers instant document compression, image conversion, developer utilities, and calculation engines right inside your web browser.

Everything operates 100% client-side using modern web technologies like WebAssembly, HTML5 Canvas, and client-side cryptography. This architecture ensures complete privacy, zero file uploads to remote servers, and blazingly fast response times without queues or artificial file size limits.

Whether you are editing academic manuscripts, optimizing images for production web applications, or formatting complex API payloads, PDFCompress Pro provides the professional toolset you need.`

// Simple syllable counter heuristic for Flesch Reading Ease
function countSyllables(word: string): number {
  word = word.toLowerCase().trim()
  if (word.length <= 3) return 1
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '')
  word = word.replace(/^y/, '')
  const matches = word.match(/[aeiouy]{1,2}/g)
  return matches ? Math.max(1, matches.length) : 1
}

export default function WordCounter() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    const trimmed = text.trim()
    const rawWords = trimmed ? trimmed.split(/\s+/).filter(Boolean) : []
    const words = rawWords.length
    const charsWithSpaces = text.length
    const charsWithoutSpaces = text.replace(/\s/g, '').length
    
    // Sentences (split on . ! ?)
    const sentenceMatches = trimmed ? trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) : null
    const sentences = sentenceMatches ? sentenceMatches.length : (trimmed ? 1 : 0)
    
    // Paragraphs (split on double or single newlines with content)
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter(p => p.trim().length > 0).length : 0
    
    const readingTimeMin = Math.ceil(words / 200) || (words > 0 ? 1 : 0)
    const speakingTimeMin = Math.ceil(words / 130) || (words > 0 ? 1 : 0)
    const avgWordLength = words > 0 ? (charsWithoutSpaces / words).toFixed(1) : '0'
    const pages = words > 0 ? (words / 250).toFixed(1) : '0'

    // Flesch Reading Ease Score
    let readabilityScore: number | null = null
    let readabilityLabel = 'N/A'
    let readabilityColor = 'text-surface-500'

    if (words >= 10 && sentences > 0) {
      let totalSyllables = 0
      for (const w of rawWords) {
        totalSyllables += countSyllables(w)
      }
      // Flesch Reading Ease formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
      const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (totalSyllables / words)
      const clampedScore = Math.max(0, Math.min(100, Math.round(score)))
      readabilityScore = clampedScore

      if (clampedScore >= 90) {
        readabilityLabel = 'Very Easy (5th Grade)'
        readabilityColor = 'text-emerald-600'
      } else if (clampedScore >= 70) {
        readabilityLabel = 'Easy (7th Grade)'
        readabilityColor = 'text-emerald-500'
      } else if (clampedScore >= 60) {
        readabilityLabel = 'Standard (8th-9th Grade)'
        readabilityColor = 'text-blue-600'
      } else if (clampedScore >= 50) {
        readabilityLabel = 'Fairly Difficult (High School)'
        readabilityColor = 'text-amber-500'
      } else if (clampedScore >= 30) {
        readabilityLabel = 'Difficult (College Level)'
        readabilityColor = 'text-orange-600'
      } else {
        readabilityLabel = 'Very Difficult (Graduate)'
        readabilityColor = 'text-red-600'
      }
    }

    // Keyword density
    const wordFreq: Record<string, number> = {}
    if (trimmed) {
      const tokens = trimmed.toLowerCase().match(/\b[a-zA-Z0-9']+\b/g) || []
      const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'are', 'was', 'from', 'have', 'has', 'you', 'our', 'all', 'not', 'but', 'can'])
      for (const t of tokens) {
        if (t.length > 2 && !stopWords.has(t)) {
          wordFreq[t] = (wordFreq[t] || 0) + 1
        }
      }
    }

    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({
        word,
        count,
        density: words > 0 ? ((count / words) * 100).toFixed(1) : '0',
      }))

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTimeMin,
      speakingTimeMin,
      avgWordLength,
      pages,
      readabilityScore,
      readabilityLabel,
      readabilityColor,
      topKeywords,
    }
  }, [text])

  useEffect(() => {
    if (stats.words >= 5) {
      const timer = setTimeout(() => {
        trackToolUsage({
          toolId: 'word-counter',
          toolName: 'Word Counter',
          category: 'text',
          action: `Counted ${stats.words} words`,
          details: `${stats.charsWithSpaces} chars, ${stats.sentences} sentences, ~${stats.readingTimeMin} min read`,
          method: 'Client JS',
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [stats.words])

  const copyText = () => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadText = () => {
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, 'word-count-document.txt')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const content = evt.target?.result
      if (typeof content === 'string') {
        setText(content)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // Case transforms
  const transformCase = (type: 'upper' | 'lower' | 'title' | 'sentence' | 'camel' | 'kebab' | 'cleanSpaces') => {
    if (!text) return
    let res = text
    switch (type) {
      case 'upper':
        res = text.toUpperCase()
        break
      case 'lower':
        res = text.toLowerCase()
        break
      case 'title':
        res = text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
        break
      case 'sentence':
        res = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (char) => char.toUpperCase())
        break
      case 'camel':
        res = text
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
          .trim()
        break
      case 'kebab':
        res = text
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
        break
      case 'cleanSpaces':
        res = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim()
        break
    }
    setText(res)
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
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={faqItems}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-surface-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition">Home</Link>
        <span>/</span>
        <span className="text-surface-700 font-medium">{tool.shortName}</span>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 rounded-2xl border border-emerald-500/20">
        <ToolVisualBadge category="text" slug={tool.slug} name={tool.name} size="xl" />
        <div className="flex-1">
          <h1 className="text-3xl sm:text-4xl font-black text-surface-900 tracking-tight mb-2">
            {tool.name}
          </h1>
          <p className="text-surface-600 text-base max-w-2xl mb-4 leading-relaxed">
            {tool.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ Real-Time Counts
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              🔒 100% In-Browser Privacy
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              📊 Reading Speed & Density
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              🔤 Instant Case Converters
            </span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3.5 border-2 border-emerald-500/30 shadow-sm text-center">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Words</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.words.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Characters</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.charsWithSpaces.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">No Spaces</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.charsWithoutSpaces.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Sentences</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.sentences.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Paragraphs</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.paragraphs.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Read Time</div>
          <div className="text-2xl font-black text-surface-900 mt-1">~{stats.readingTimeMin}m</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Speak Time</div>
          <div className="text-2xl font-black text-surface-900 mt-1">~{stats.speakingTimeMin}m</div>
        </div>
        <div className="bg-white rounded-xl p-3.5 border border-surface-200 shadow-sm text-center">
          <div className="text-[11px] font-bold text-surface-500 uppercase tracking-wider">Est. Pages</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.pages}</div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden mb-8">
        {/* Top Control Bar */}
        <div className="p-4 bg-surface-50/80 border-b border-surface-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-surface-500">Transform Text:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => transformCase('upper')}
                disabled={!text}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40 transition"
              >
                UPPERCASE
              </button>
              <button
                onClick={() => transformCase('lower')}
                disabled={!text}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40 transition"
              >
                lowercase
              </button>
              <button
                onClick={() => transformCase('title')}
                disabled={!text}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40 transition"
              >
                Title Case
              </button>
              <button
                onClick={() => transformCase('sentence')}
                disabled={!text}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40 transition"
              >
                Sentence case
              </button>
              <button
                onClick={() => transformCase('cleanSpaces')}
                disabled={!text}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 disabled:opacity-40 transition"
                title="Remove consecutive spaces and redundant empty lines"
              >
                Clean Spaces
              </button>
            </div>
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
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 transition inline-flex items-center gap-1.5"
            >
              📁 Upload File
            </button>
            <button
              onClick={() => setText(sampleText)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-surface-200 text-surface-700 hover:bg-surface-100 transition"
            >
              Insert Sample
            </button>
            <button
              onClick={copyText}
              disabled={!text}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-100 text-surface-700 hover:bg-surface-200 disabled:opacity-40 transition inline-flex items-center gap-1.5"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={downloadText}
              disabled={!text}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-100 text-surface-700 hover:bg-surface-200 disabled:opacity-40 transition inline-flex items-center gap-1.5"
            >
              💾 Save .txt
            </button>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="p-4">
          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to inspect word count, characters, speaking speed, and readability..."
            className="w-full p-4 border border-surface-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-surface-800 font-sans resize-y leading-relaxed text-base"
          />
        </div>

        {/* Readability & Extra Metrics Footer */}
        <div className="p-4 bg-surface-50 border-t border-surface-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-surface-500 font-medium">Avg. Word Length: </span>
              <span className="font-bold text-surface-800">{stats.avgWordLength} chars</span>
            </div>
            {stats.readabilityScore !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-surface-500 font-medium">Reading Ease: </span>
                <span className="font-bold text-surface-900">{stats.readabilityScore}/100</span>
                <span className={`font-semibold ${stats.readabilityColor}`}>({stats.readabilityLabel})</span>
              </div>
            )}
          </div>
          <div className="text-surface-400">
            100% processed in browser. No data ever leaves your device.
          </div>
        </div>
      </div>

      {/* Top Keywords Density Table */}
      {stats.topKeywords.length > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-surface-900">Keyword Frequency & Density</h3>
              <p className="text-xs text-surface-500">Most frequent non-trivial words in your text</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-surface-100 text-surface-600 rounded-full">
              Top {stats.topKeywords.length} terms
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.topKeywords.map(({ word, count, density }) => (
              <div key={word} className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-semibold text-surface-800 truncate">{word}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {count}×
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-surface-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, parseFloat(density) * 10)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-surface-500">{density}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEO Content Section */}
      <section className="content-section mt-10">
        <h2>About Free Online Word Counter & Character Analyzer</h2>
        <p>
          Whether you are writing an academic thesis, preparing an email newsletter, drafting social media posts with strict character limits, or tuning SEO copy, having an accurate and instantaneous text analyzer is indispensable.
          PDFCompress Pro's Word Counter processes your text in real time with zero latency and absolute client-side confidentiality.
        </p>

        <h3>Why In-Browser Text Analysis Matters</h3>
        <p>
          Unlike traditional web counters that transmit your text across remote network servers, our utility operates entirely inside your local browser instance via JavaScript.
          This makes it safe for sensitive corporate documents, legal agreements, unpublished literary works, and confidential internal correspondence.
        </p>

        <h3>Comprehensive Text Metrics Included</h3>
        <ul>
          <li><strong>Real-time Word & Character Counting:</strong> Instant tallies as you type or paste without pressing submit.</li>
          <li><strong>Space Isolation:</strong> Accurate character metrics both including and excluding whitespace.</li>
          <li><strong>Silent Reading & Speaking Time:</strong> Based on 200 WPM silent reading speed and 130 WPM speech cadence.</li>
          <li><strong>Flesch Reading Ease Score:</strong> Built-in readability metric evaluating readability levels from elementary school to graduate degree level.</li>
          <li><strong>Keyword Frequency Analysis:</strong> Identify repetitive phrasing and maintain ideal keyword distribution.</li>
          <li><strong>One-Click Case Converters:</strong> Rapidly transform text between UPPERCASE, lowercase, Title Case, and Sentence case.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="word-counter" />
    </div>
  )
}
