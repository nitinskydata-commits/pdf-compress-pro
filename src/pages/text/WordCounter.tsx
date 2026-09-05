import { useState, useMemo, useEffect } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'
import { trackToolUsage } from '../../utils/telemetry'

const tool = getToolBySlug('word-counter')!

const faqItems = [
  { question: 'How is word count calculated?', answer: 'Words are calculated by splitting text on whitespace and punctuation boundaries, excluding empty spaces.' },
  { question: 'What is the estimated reading time based on?', answer: 'Reading time is calculated using the average adult reading speed of 200 words per minute (WPM).' },
  { question: 'Is my text private and secure?', answer: 'Yes! All analysis is done 100% locally in your browser. None of your text is ever uploaded to any server.' },
]

export default function WordCounter() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => {
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
    const charsWithSpaces = text.length
    const charsWithoutSpaces = text.replace(/\s/g, '').length
    const sentences = trimmed ? (trimmed.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmed]).length : 0
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter(p => p.trim().length > 0).length : 0
    const readingTimeMin = Math.ceil(words / 200) || 0
    const speakingTimeMin = Math.ceil(words / 130) || 0

    // Keyword density
    const wordFreq: Record<string, number> = {}
    if (trimmed) {
      const tokens = trimmed.toLowerCase().match(/\b[a-zA-Z0-9']+\b/g) || []
      for (const t of tokens) {
        if (t.length > 2) {
          wordFreq[t] = (wordFreq[t] || 0) + 1
        }
      }
    }
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return {
      words,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTimeMin,
      speakingTimeMin,
      topKeywords,
    }
  }, [text])

  useEffect(() => {
    if (stats.words >= 3) {
      const timer = setTimeout(() => {
        trackToolUsage({
          toolId: 'word-counter',
          toolName: 'Word Counter',
          category: 'text',
          action: `Analyzed text: ${stats.words} words`,
          details: `${stats.charsWithSpaces} chars, ${stats.sentences} sentences, ~${stats.readingTimeMin} min read`,
          method: 'Client JS',
        })
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [stats.words])

  const copyText = () => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pasteSample = () => {
    setText('PDFCompress Pro provides free, fast, and secure online utility tools for documents, images, and calculations. All processing happens directly inside your web browser for complete privacy.')
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

      {/* Real-time counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="result-card highlight text-center">
          <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Words</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.words.toLocaleString()}</div>
        </div>
        <div className="result-card text-center">
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Characters</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.charsWithSpaces.toLocaleString()}</div>
        </div>
        <div className="result-card text-center">
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">No Spaces</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.charsWithoutSpaces.toLocaleString()}</div>
        </div>
        <div className="result-card text-center">
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Sentences</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.sentences.toLocaleString()}</div>
        </div>
        <div className="result-card text-center">
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Paragraphs</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.paragraphs.toLocaleString()}</div>
        </div>
        <div className="result-card text-center">
          <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Read Time</div>
          <div className="text-2xl font-black text-surface-900 mt-1">{stats.readingTimeMin} min</div>
        </div>
      </div>

      {/* Editor & Controls */}
      <div className="card-premium p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <label className="text-sm font-semibold text-surface-700">Type or Paste Text Below</label>
          <div className="flex items-center gap-2">
            <button
              onClick={pasteSample}
              className="text-xs px-3 py-1.5 rounded-lg border border-surface-200 text-surface-600 hover:bg-surface-50 transition"
            >
              Insert Sample
            </button>
            <button
              onClick={copyText}
              disabled={!text}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 disabled:opacity-40 transition font-medium"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <textarea
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your content here to analyze character count, word density, and reading statistics..."
          className="w-full p-4 border border-surface-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-surface-800 font-sans resize-y leading-relaxed text-base"
        />

        {/* Top Keywords */}
        {stats.topKeywords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Top Keywords</div>
            <div className="flex flex-wrap gap-2">
              {stats.topKeywords.map(([kw, count]) => (
                <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-medium">
                  <span>{kw}</span>
                  <span className="bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded-full font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEO Section */}
      <section className="content-section mt-10">
        <h2>About Free Online Word Counter</h2>
        <p>
          Whether you are writing an essay, crafting a tweet, or polishing a blog post, knowing your exact word and character count is vital.
          This tool runs entirely in your browser without transmitting your words anywhere, making it safe for confidential documents, passwords, or personal notes.
        </p>
        <h3>Features & Capabilities</h3>
        <ul>
          <li><strong>Real-time Word & Character Count:</strong> Instant calculations as you type.</li>
          <li><strong>Space Filtering:</strong> Accurately tracks characters with and without spaces.</li>
          <li><strong>Reading & Speaking Speeds:</strong> Estimates time based on standard 200 WPM reading and 130 WPM speech speeds.</li>
          <li><strong>Keyword Frequency:</strong> Automatically surfaces top repeating keywords to help you avoid repetition.</li>
        </ul>
      </section>

      <FAQ items={faqItems} />
      <RelatedTools currentSlug="word-counter" />
    </div>
  )
}
