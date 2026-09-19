import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import { guides, type GuideArticle } from '../../data/guides'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function GuidesHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const categories = [
    { id: 'all', label: 'All Guides' },
    { id: 'compression', label: '🗜️ Compression' },
    { id: 'organization', label: '📑 Organization' },
    { id: 'conversion', label: '🔄 Format Conversion' },
    { id: 'troubleshooting', label: '🛠️ Troubleshooting' },
    { id: 'security', label: '🔒 Security & Safety' },
  ]

  const filteredGuides = useMemo(() => {
    return guides.filter((guide: GuideArticle) => {
      const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory
      const matchesSearch = searchQuery === '' || 
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.keyTakeaways.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const featuredGuide = guides[0] // How to compress PDF

  return (
    <div className="min-h-screen bg-surface-50/50 pb-20">
      <SEOHead
        title={`PDF Guides & Tutorials — Learn to Manage Documents Better | ${SITE_NAME}`}
        description="Comprehensive guides, tutorials, and practical experiments on PDF compression, merging, format conversion, and security. Written by engineers."
        canonical="/guides"
        keywords={['PDF guides', 'PDF compression tutorial', 'how to merge PDF', 'PDF tools safety', 'reduce PDF size']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `PDF Learning Center — ${SITE_NAME}`,
          description: 'Educational articles, practical examples, compression experiments, and technical guides for PDF productivity.',
          url: `${SITE_URL}/guides`,
        }}
      />

      {/* Hero Header */}
      <section className="bg-hero-gradient text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium mb-6 border border-white/20">
            <span>📚</span>
            <span>PDF Learning Center & Engineering Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Master Your Document Workflow
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            In-depth guides, practical compression benchmarks, and honest explanations of PDF technology written to help students, professionals, and teams handle documents smarter.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-surface-400 text-lg">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides (e.g., college assignment, 200KB, DPI, scanned)..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-surface-900 placeholder:text-surface-400 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-semibold text-surface-400 hover:text-surface-600 bg-surface-100 rounded-full px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        {/* Category Pills */}
        <div className="bg-white rounded-2xl p-2 shadow-elevated border border-surface-100 flex items-center gap-2 overflow-x-auto scrollbar-none mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Featured Guide Banner (shown only on 'all' view without active search query) */}
        {selectedCategory === 'all' && searchQuery === '' && featuredGuide && (
          <div className="mb-12">
            <div className="card-premium overflow-hidden border border-primary-200 bg-gradient-to-br from-primary-50/70 via-white to-accent-50/40 p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-bold uppercase tracking-wider mb-4">
                    ⭐ Featured Pillar Guide
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight mb-3">
                    <Link to={`/guides/${featuredGuide.slug}`} className="hover:text-primary-600 transition-colors">
                      {featuredGuide.title}
                    </Link>
                  </h2>
                  <p className="text-surface-600 text-sm sm:text-base leading-relaxed mb-6">
                    {featuredGuide.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-surface-500 mb-6">
                    <span className="font-semibold text-surface-700">By {featuredGuide.author.name}</span>
                    <span>•</span>
                    <span>Updated {featuredGuide.lastUpdated}</span>
                    <span>•</span>
                    <span className="bg-surface-100 px-2.5 py-1 rounded-md font-medium text-surface-700">{featuredGuide.readTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/guides/${featuredGuide.slug}`}
                      className="btn-primary !text-sm px-6 py-2.5 shadow-md shadow-primary-500/20"
                    >
                      Read Full Article →
                    </Link>
                    <Link
                      to={`/${featuredGuide.relatedToolSlug}`}
                      className="btn-secondary !text-sm px-4 py-2.5"
                    >
                      Try Tool ({featuredGuide.relatedToolName})
                    </Link>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-primary-100 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 mb-3">Key Takeaways in this Guide</h3>
                  <ul className="space-y-2 text-xs text-surface-600">
                    {featuredGuide.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guides Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-surface-900">
              {selectedCategory === 'all' ? 'All Practical Guides' : `Guides in ${categories.find(c => c.id === selectedCategory)?.label}`}
            </h2>
            <span className="text-xs font-medium text-surface-500">
              Showing {filteredGuides.length} {filteredGuides.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {filteredGuides.length === 0 ? (
            <div className="card-premium p-12 text-center max-w-lg mx-auto">
              <span className="text-4xl mb-3 block">🔍</span>
              <h3 className="font-bold text-surface-800 text-lg mb-1">No articles found</h3>
              <p className="text-sm text-surface-500 mb-4">
                We couldn't find any guides matching "{searchQuery}". Try a different keyword or reset filters.
              </p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                className="btn-secondary !text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((guide) => (
                <article
                  key={guide.slug}
                  className="card-premium flex flex-col justify-between p-6 hover:-translate-y-1 transition-all duration-300 group border border-surface-200/70 hover:border-primary-300 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                        {guide.categoryLabel}
                      </span>
                      <span className="text-xs text-surface-400 font-medium">
                        {guide.readTime}
                      </span>
                    </div>

                    <h3 className="font-bold text-surface-900 text-lg mb-2.5 group-hover:text-primary-600 transition-colors leading-snug">
                      <Link to={`/guides/${guide.slug}`}>
                        {guide.title}
                      </Link>
                    </h3>

                    <p className="text-xs sm:text-sm text-surface-600 line-clamp-3 mb-4 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-surface-100 flex items-center justify-between mt-2">
                    <div className="text-xs text-surface-400">
                      <span>Updated {guide.lastUpdated}</span>
                    </div>
                    <Link
                      to={`/guides/${guide.slug}`}
                      className="text-xs font-bold text-primary-600 group-hover:text-primary-700 flex items-center gap-1 group-hover:gap-1.5 transition-all"
                    >
                      <span>Read Guide</span>
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Editorial Standards & Trust Banner */}
        <section className="card-premium p-8 bg-gradient-to-r from-surface-900 to-surface-800 text-white rounded-3xl mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="text-2xl">🔬</div>
              <h4 className="font-bold text-white text-base">Original Research & Benchmarks</h4>
              <p className="text-xs text-surface-300 leading-relaxed">
                All articles include verified measurements, empirical file-size tests, and vector preservation checks run across our actual tools.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🛡️</div>
              <h4 className="font-bold text-white text-base">Privacy-First Architecture</h4>
              <p className="text-xs text-surface-300 leading-relaxed">
                We clearly disclose which processes run in your local browser sandbox and which utilize ephemeral server rendering. No AI training on documents.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">💬</div>
              <h4 className="font-bold text-white text-base">Continuous Reader Support</h4>
              <p className="text-xs text-surface-300 leading-relaxed">
                Have a question about a complex PDF or encountered an unexpected upload error? Our support desk replies to inquiries within 24–48 hours.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
