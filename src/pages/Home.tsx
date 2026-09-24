import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import FAQ from '../components/FAQ'
import UniversalSearchModal from '../components/UniversalSearchModal'
import ToolVisualBadge from '../components/ToolVisualBadge'
import { tools, categories, SITE_URL, type ToolInfo } from '../data/tools'
import { guides, type GuideArticle } from '../data/guides'
import { useDisabledToolsList } from '../utils/toolStatus'

const homeFAQ = [
  {
    question: 'What is PDFCompress Pro?',
    answer: 'PDFCompress Pro is an independent, web-based platform providing practical, privacy-first tools for compressing, merging, splitting, and converting PDF documents and everyday digital files.'
  },
  {
    question: 'Is PDFCompress Pro free to use?',
    answer: 'Yes! Every tool currently available on PDFCompress Pro is 100% free with no account registration, credit card requirements, or forced subscriptions.'
  },
  {
    question: 'Can I compress a PDF using PDFCompress Pro?',
    answer: 'Yes. Our PDF Compressor allows you to reduce PDF file sizes through customizable compression levels (Low, Medium, High, and Extreme). The final file size reduction depends on original image resolution and internal document streams.'
  },
  {
    question: 'Will compressing a PDF reduce text readability?',
    answer: 'No. Vector typography and system fonts remain mathematical scalable curves, so text stays infinitely sharp at all zoom levels. Only embedded raster images are downsampled to target DPI.'
  },
  {
    question: 'Are my uploaded files stored on your servers?',
    answer: 'No. The majority of our utilities (merging, splitting, image tools, calculators) process files 100% locally in your web browser. For tools requiring server-side Ghostscript optimization, files are processed in ephemeral RAM and permanently purged immediately after generation. We maintain zero persistent file storage.'
  },
  {
    question: 'What should I do if a tool doesn’t work or an upload fails?',
    answer: 'Ensure your file is within the 50MB limit and not corrupted. If you encounter an error, check our Help Center for troubleshooting steps or message our engineering desk via the Contact Us page.'
  },
  {
    question: 'Can I use PDFCompress Pro on a mobile phone?',
    answer: 'Yes! All tools are fully responsive and tested on Google Chrome for Android and Apple Safari for iOS. On iPhones, processed PDFs download directly to the iOS Files app.'
  }
]

export default function Home() {
  const disabledTools = useDisabledToolsList()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [inlineSearch, setInlineSearch] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(48)
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const [searchCategory, setSearchCategory] = useState<string>('all')

  // Featured top tools
  const featuredTools = [
    {
      slug: 'pdf-compressor',
      name: 'Compress PDF',
      badge: 'Most Popular',
      desc: 'Reduce PDF file sizes by up to 80% while preserving sharp vector typography and clean graphics.',
      bestFor: 'Documents too large to email or upload',
      icon: '🗜️',
    },
    {
      slug: 'compress-pdf-to-200kb',
      name: 'PDF to 200KB',
      badge: 'Target Mode',
      desc: 'Calibrated downsampling to compress files strictly under 200KB for government and university portals.',
      bestFor: 'College admissions, UPSC, SSC & job portals',
      icon: '📦',
    },
    {
      slug: 'pdf-merger',
      name: 'Merge PDF',
      badge: 'Consolidate',
      desc: 'Combine multiple PDF files into one single document. Drag and reorder pages effortlessly.',
      bestFor: 'Assignments, tax packets, combined reports',
      icon: '📑',
    },
    {
      slug: 'pdf-splitter',
      name: 'Split PDF',
      badge: 'Extraction',
      desc: 'Extract specific pages or separate custom page ranges into clean standalone PDF documents.',
      bestFor: 'Isolating specific chapters or invoice pages',
      icon: '✂️',
    },
    {
      slug: 'jpg-to-pdf',
      name: 'JPG to PDF',
      badge: 'Convert',
      desc: 'Convert JPG, PNG, and WebP camera photos into standardized, multi-page PDF documents.',
      bestFor: 'Consolidating smartphone homework scans',
      icon: '📄',
    },
    {
      slug: 'pdf-to-jpg',
      name: 'PDF to JPG',
      badge: 'Extract Images',
      desc: 'Convert PDF document pages into high-resolution JPG images for presentations or sharing.',
      bestFor: 'Extracting slides or certificates for web use',
      icon: '🖼️',
    },
  ]

  // Filter tools for all-tools grid
  const filteredTools = tools.filter((t: ToolInfo) => {
    const isNotDisabled = !disabledTools.includes(t.slug)
    const matchesTab = activeTab === 'all' || t.category === activeTab
    const q = inlineSearch.toLowerCase().trim()
    const matchesQuery = !q || 
      t.name.toLowerCase().includes(q) || 
      t.description.toLowerCase().includes(q) ||
      (t.keywords && t.keywords.some(k => k.toLowerCase().includes(q)))
    return t.isActive && isNotDisabled && matchesTab && matchesQuery
  })

  // Visible tools subset for performance
  const displayedTools = filteredTools.slice(0, visibleCount)

  // Top 4 guides for learning center showcase
  const topGuides = guides.slice(0, 4)

  const openSearchWithCategory = (catId: string) => {
    setSearchCategory(catId)
    setIsSearchOpen(true)
  }

  return (
    <div className="min-h-screen bg-surface-50/50">
      <SEOHead
        title="PDFCompressPro — 1000+ Free Online Tools (PDF, Images, Documents, Converters & Calculators)"
        description="1,000+ free online tools with 100% privacy: Compress PDF, convert images, Word documents, Excel/CSV, JSON formatters, calculators, unit converters, QR codes, and everyday utilities."
        canonical="/"
        keywords={['1000 free tools', 'PDF tools', 'compress PDF', 'image converter', 'developer tools', 'calculators', 'unit converter', 'QR code generator']}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'PDFCompressPro — 1000+ Free Online Tools',
          description: '1,000+ free browser tools across 25 categories: PDF, images, converters, developer utilities, calculators, and business tools.',
          url: SITE_URL,
          applicationCategory: 'UtilityApplication',
          operatingSystem: 'All',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }}
        faqData={homeFAQ}
      />

      {/* 1. Hero Section with 1000+ Tools Master Branding */}
      <section className="bg-hero-gradient text-white py-16 md:py-24 relative overflow-hidden">
        {/* Subtle decorative background blur */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs sm:text-sm font-medium mb-6 border border-white/20">
            <span>🛡️</span>
            <span>Client-First Privacy & Ephemeral Processing — 100% Free & No Signup</span>
          </div>

          {/* Master Site Title & Subtitle */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-4 leading-tight">
            <span>PDFCompressPro</span>
            <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 font-extrabold bg-gradient-to-r from-yellow-200 via-pink-200 to-amber-200 bg-clip-text text-transparent">
              1000+ Free Online Tools
            </span>
          </h1>

          {/* Category Roadmap Headline */}
          <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-3xl mx-auto mb-8 font-medium tracking-wide">
            PDF • Images • Documents • Converters • Developer • Calculators • Business • Everyday Utilities
          </p>

          {/* Universal Search Bar Trigger */}
          <div className="max-w-2xl mx-auto mb-8">
            <button
              type="button"
              onClick={() => {
                setSearchCategory('all')
                setIsSearchOpen(true)
              }}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer group text-left"
              aria-label="Universal Search 1,000+ Tools"
            >
              <div className="flex items-center gap-3.5">
                <span className="text-2xl group-hover:scale-110 transition-transform">🔎</span>
                <span className="text-base sm:text-lg font-medium text-white/95">
                  Search 1,000+ tools...
                </span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold bg-white/20 text-white rounded-lg border border-white/20">
                  Ctrl K
                </kbd>
                <span className="px-3 py-1.5 text-xs font-bold bg-white text-primary-700 rounded-lg shadow-sm">
                  Browse All
                </span>
              </div>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pdf-compressor"
              className="btn-primary bg-white text-primary-700 hover:bg-white/95 shadow-xl shadow-black/15 !text-base px-8 py-3.5 font-bold"
            >
              🗜️ Compress PDF Now
            </Link>
            <a
              href="#category-catalog"
              className="btn-secondary border-white/30 text-white hover:bg-white/10 !text-base px-7 py-3.5 font-semibold"
            >
              Browse 25 Categories ↓
            </a>
          </div>

          {/* Quick trust highlights */}
          <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 text-white/90 text-xs sm:text-sm">
            <div className="flex items-center justify-center gap-2">
              <span>⚡</span>
              <span>1,085+ Tools Ready</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🔒</span>
              <span>Zero Document Storage</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🚀</span>
              <span>Client-Side Speed</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>📱</span>
              <span>Mobile & Desktop</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Master Category Catalog Grid */}
      <section id="category-catalog" className="py-16 bg-white border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-2 inline-block">
              Master Tool Directory
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight mb-3">
              Explore 25 Specialized Categories
            </h2>
            <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
              From heavy PDF processing and image conversions to developer syntax formatters, financial calculators, and hardware diagnostics — all accessible free in your browser.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {categories.map(cat => (
              <div
                key={cat.id}
                onClick={() => openSearchWithCategory(cat.id)}
                className="p-4 rounded-2xl bg-surface-50 hover:bg-white border border-surface-200/80 hover:border-primary-300 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                      {cat.countBadge}
                    </span>
                  </div>
                  <h3 className="font-bold text-surface-900 text-sm mb-1 group-hover:text-primary-600 transition-colors">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-surface-500 line-clamp-2 leading-tight">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-surface-100 flex items-center justify-between text-[11px] font-semibold text-primary-600">
                  <span>Browse Tools</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Working Utilities Section */}
      <section id="featured-tools" className="py-16 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-2 inline-block">
              Working Document Utilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight mb-2">
              Featured PDF Tools
            </h2>
            <p className="text-surface-600 text-sm">
              Select a tool to complete your document task directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredTools.map((t) => (
              <div
                key={t.slug}
                className="card-premium p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border border-surface-200 hover:border-primary-300 hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <ToolVisualBadge category="pdf" slug={t.slug} name={t.name} icon={t.icon} size="lg" />
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                      {t.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-2">
                    <Link to={`/${t.slug}`} className="hover:text-primary-600 transition-colors">
                      {t.name}
                    </Link>
                  </h3>
                  <p className="text-xs sm:text-sm text-surface-600 mb-4 leading-relaxed">
                    {t.desc}
                  </p>
                </div>

                <div>
                  <div className="p-3 rounded-xl bg-surface-50 border border-surface-100 text-xs text-surface-600 mb-4">
                    <strong className="text-surface-800">Best for:</strong> {t.bestFor}
                  </div>
                  <Link
                    to={`/${t.slug}`}
                    className="btn-primary w-full !text-xs py-2.5 block text-center font-bold"
                  >
                    Open {t.name} →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* All Utilities Directory with Search & Category Filter */}
          <div className="mt-16 pt-12 border-t border-surface-200">
            <div className="text-center mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-surface-900 mb-2">
                All 1,000+ Online Utilities
              </h3>
              <p className="text-xs sm:text-sm text-surface-600">
                Explore our full suite of document, image, text, developer, and calculator tools.
              </p>
            </div>

            {/* Inline Search & Category Pills */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={inlineSearch}
                  onChange={e => {
                    setInlineSearch(e.target.value)
                    setVisibleCount(48)
                  }}
                  placeholder="Filter tools by name (e.g. compress, convert, bmi)..."
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white border border-surface-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
                />
                <span className="absolute left-3.5 top-2.5 text-surface-400">🔍</span>
                {inlineSearch && (
                  <button
                    onClick={() => setInlineSearch('')}
                    className="absolute right-3 top-2.5 text-xs text-surface-400 hover:text-surface-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mb-8">
              <button
                onClick={() => {
                  setActiveTab('all')
                  setVisibleCount(48)
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                }`}
              >
                All (1,000+)
              </button>
              {categories.map((cat: { id: string; label: string; shortLabel?: string; icon: string }) => {
                const count = tools.filter((t: ToolInfo) => t.category === cat.id && !disabledTools.includes(t.slug)).length
                if (count === 0) return null
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id)
                      setVisibleCount(48)
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                      activeTab === cat.id
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-white text-surface-700 hover:bg-surface-100 border border-surface-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.shortLabel || cat.label}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Filtered Tools Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayedTools.map((t: ToolInfo) => (
                <Link
                  key={t.slug}
                  to={`/${t.slug}`}
                  className="p-3.5 rounded-xl bg-white border border-surface-200/80 hover:border-primary-300 hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <ToolVisualBadge category={t.category} slug={t.slug} name={t.name} icon={t.icon} size="md" className="mb-2.5" />
                    <h4 className="text-xs font-bold text-surface-800 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-surface-500 line-clamp-2 leading-tight">
                      {t.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-surface-50 flex items-center justify-between">
                    <span className="text-[10px] text-surface-400 font-medium">{t.categoryLabel}</span>
                    <span className="text-[10px] font-semibold text-primary-600">
                      Use →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More or Universal Search Trigger */}
            <div className="mt-8 text-center">
              {filteredTools.length > visibleCount ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 48)}
                    className="px-6 py-2.5 rounded-xl bg-white border border-surface-300 hover:border-primary-500 hover:text-primary-600 text-surface-700 font-bold text-xs shadow-xs transition-all"
                  >
                    Load More Tools ({filteredTools.length - visibleCount} remaining) ↓
                  </button>
                  <p className="text-xs text-surface-400">
                    Or press <kbd className="px-1.5 py-0.5 bg-surface-200 rounded text-[10px]">Ctrl+K</kbd> to search all 1,000+ tools instantly.
                  </p>
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-semibold text-surface-700 mb-1">No tools matched your filter</p>
                  <button
                    onClick={() => {
                      setInlineSearch('')
                      setActiveTab('all')
                    }}
                    className="text-xs font-bold text-primary-600 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <p className="text-xs text-surface-400">
                  Showing all {filteredTools.length} matching tools.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Universal Search Modal */}
      <UniversalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        initialCategory={searchCategory}
      />

      {/* 4. How PDFCompress Pro Works */}
      <section className="py-16 bg-white border-y border-surface-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-2 inline-block">
              Simple 5-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight mb-2">
              How to Use PDFCompress Pro
            </h2>
            <p className="text-surface-600 text-sm">
              Getting started with any document tool takes only a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {[
              {
                step: '1',
                title: 'Choose a Tool',
                desc: 'Select the specific PDF, image, or calculation utility matching your task.',
                icon: '🔍',
              },
              {
                step: '2',
                title: 'Upload File',
                desc: 'Drop your document into the upload zone. Check size limits (up to 50MB).',
                icon: '📤',
              },
              {
                step: '3',
                title: 'Configure Options',
                desc: 'Select compression profile (Low, Medium, High) or arrange page sequence.',
                icon: '⚙️',
              },
              {
                step: '4',
                title: 'Process Document',
                desc: 'Click the process button. The engine analyzes and optimizes objects in seconds.',
                icon: '⚡',
              },
              {
                step: '5',
                title: 'Review & Download',
                desc: 'Verify file size savings and download your output directly to your device.',
                icon: '📥',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-5 rounded-2xl bg-surface-50 border border-surface-100 flex flex-col items-center text-center relative"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center mb-3 shadow-md">
                  {s.step}
                </div>
                <div className="text-xl mb-1">{s.icon}</div>
                <h3 className="font-bold text-surface-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-surface-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div className="mt-8 p-4 rounded-xl bg-primary-50/70 border border-primary-100 text-xs sm:text-sm text-primary-900 flex items-center gap-3">
            <span className="text-lg">💡</span>
            <span>
              <strong>Review Tip:</strong> Always open and inspect important legal, medical, or academic documents after downloading to confirm that typography, page order, and signatures are intact.
            </span>
          </div>
        </div>
      </section>

      {/* 5. PDF Guides & Tutorials Section */}
      <section className="py-16 bg-surface-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-2 inline-block">
                Original Educational Knowledge
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                Learn More About PDFs
              </h2>
              <p className="text-surface-600 text-sm mt-1 max-w-xl">
                Explore our practical guides to understand PDF architecture, compression trade-offs, and file management workflows.
              </p>
            </div>
            <Link
              to="/guides"
              className="btn-secondary !text-xs px-4 py-2.5 self-start md:self-auto font-bold flex items-center gap-1.5"
            >
              <span>Explore All 10 Guides</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {topGuides.map((guide: GuideArticle) => (
              <article
                key={guide.slug}
                className="card-premium p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group border border-surface-200 hover:border-primary-300 hover:shadow-lg"
              >
                <div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 mb-3 inline-block">
                    {guide.categoryLabel}
                  </span>
                  <h3 className="font-bold text-surface-900 text-base mb-2 group-hover:text-primary-600 transition-colors leading-snug">
                    <Link to={`/guides/${guide.slug}`}>
                      {guide.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-surface-600 line-clamp-3 mb-4 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-surface-100 flex items-center justify-between text-xs">
                  <span className="text-surface-400">{guide.readTime}</span>
                  <Link
                    to={`/guides/${guide.slug}`}
                    className="font-bold text-primary-600 group-hover:text-primary-700 flex items-center gap-1"
                  >
                    <span>Read guide</span>
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-surface-200 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-surface-900 text-sm mb-0.5">Need a comprehensive guide on PDF formats, troubleshooting, or organization?</h4>
              <p className="text-xs text-surface-600">Our Learning Center covers college assignment caps, DPI math, and online tool safety.</p>
            </div>
            <Link to="/guides" className="btn-primary !text-xs px-5 py-2.5 whitespace-nowrap">
              Visit Learning Center →
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Privacy & File Processing Section */}
      <section className="py-16 bg-white border-b border-surface-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="card-premium p-8 sm:p-10 border-l-4 border-l-emerald-500 bg-gradient-to-br from-white via-surface-50/50 to-emerald-50/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full mb-2 inline-block">
                  Privacy Architecture
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                  Your Files and Privacy: Transparent Handling
                </h2>
              </div>
              <Link
                to="/privacy"
                className="btn-secondary !text-xs px-4 py-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
              >
                Read Privacy Policy →
              </Link>
            </div>

            <p className="text-surface-700 text-sm sm:text-base leading-relaxed mb-6">
              We believe users should always have precise, honest information about where their documents go. We do not bury our file processing practices in confusing legal jargon:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-surface-900 text-sm mb-2">
                  <span className="text-emerald-500 text-base">🟢</span>
                  <span>Browser-Only Client Processing</span>
                </div>
                <p className="text-xs text-surface-600 leading-relaxed mb-2">
                  Utilities including PDF Merger, PDF Splitter, Image Compressors, Calculators, and Developer tools run <strong>100% inside your browser's local sandbox</strong>.
                </p>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Files never leave your computer or phone.
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-surface-200 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-surface-900 text-sm mb-2">
                  <span className="text-primary-500 text-base">🔵</span>
                  <span>Ephemeral Stream Processing</span>
                </div>
                <p className="text-xs text-surface-600 leading-relaxed mb-2">
                  Advanced Ghostscript PDF compression transmits files via encrypted HTTPS to an ephemeral container. Files are processed in RAM memory and <strong>purged immediately upon download</strong>.
                </p>
                <span className="text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                  Zero permanent file retention on disk.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. About PDFCompress Pro Section */}
      <section className="py-16 bg-surface-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full mb-2 inline-block">
              Independent Project
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight mb-3">
              About PDFCompress Pro
            </h2>
            <p className="text-surface-600 text-sm sm:text-base leading-relaxed">
              Making Everyday Document Tasks Straightforward & Accessible
            </p>
          </div>

          <div className="card-premium p-8 sm:p-10 space-y-4 text-surface-700 text-sm sm:text-base leading-relaxed">
            <p>
              PDFCompress Pro is an independent web application built by <strong>Nitin and our engineering team</strong> to address everyday document frustrations.
            </p>
            <p>
              We created this platform around a clear goal: document utilities should be fast, private, and free of artificial hurdles like mandatory signups, bait-and-switch pricing, or deceptive download banners.
            </p>
            <p>
              Alongside building and maintaining tools, we regularly test file fidelity against strict government portal limits (like UPSC, SSC, and college admissions), document rendering accuracy, and cross-browser performance.
            </p>
            <div className="pt-4 border-t border-surface-100 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-surface-500">
                Have a question or found a bug? We welcome feedback.
              </span>
              <div className="flex items-center gap-3">
                <Link to="/about" className="btn-secondary !text-xs px-4 py-2 font-bold">
                  Read Full About Story →
                </Link>
                <Link to="/contact" className="btn-primary !text-xs px-4 py-2 font-bold">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section className="py-16 bg-white border-t border-surface-200/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-surface-600 text-sm">
              Clear, transparent answers about our tools, privacy, and file limits.
            </p>
          </div>

          <div className="card-premium p-6 sm:p-8">
            <FAQ items={homeFAQ} />
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-indigo-700 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            Ready to Work With Your Documents?
          </h2>
          <p className="text-white/85 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Explore PDFCompress Pro's available tools and find the right solution for your next document task. Free forever, no signups required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/pdf-compressor"
              className="btn-primary bg-white text-primary-700 hover:bg-white/95 shadow-lg !text-base px-8 py-3.5 font-bold"
            >
              Compress PDF Now
            </Link>
            <Link
              to="/guides"
              className="btn-secondary border-white/30 text-white hover:bg-white/10 !text-base px-7 py-3.5 font-semibold"
            >
              Browse PDF Guides
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
