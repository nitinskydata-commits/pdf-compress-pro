import { useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import { getGuideBySlug, guides, type GuideArticle } from '../../data/guides'
import { SITE_NAME, SITE_URL } from '../../data/tools'

export default function GuideDetail() {
  const { slug } = useParams<{ slug: string }>()
  const guide = slug ? getGuideBySlug(slug) : undefined

  // Related articles (same category or next in list)
  const relatedGuides = useMemo(() => {
    if (!guide) return []
    return guides
      .filter((g: GuideArticle) => g.slug !== guide.slug)
      .slice(0, 3)
  }, [guide])

  if (!guide) {
    return <Navigate to="/guides" replace />
  }

  const articleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: guide.title,
    description: guide.metaDescription,
    author: {
      '@type': 'Person',
      name: guide.author.name,
      jobTitle: guide.author.role,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    datePublished: guide.publishedDate,
    dateModified: guide.lastUpdated,
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  }

  return (
    <div className="min-h-screen bg-surface-50/40 py-8 lg:py-12">
      <SEOHead
        title={`${guide.metaTitle} | ${SITE_NAME}`}
        description={guide.metaDescription}
        canonical={`/guides/${guide.slug}`}
        keywords={[guide.title, guide.categoryLabel, 'PDF tutorial', 'PDF guide', 'document productivity']}
        structuredData={articleStructuredData}
        faqData={guide.faq}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="breadcrumb mb-6" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="separator">›</span>
          <Link to="/guides">Guides</Link>
          <span className="separator">›</span>
          <span className="text-surface-600 truncate max-w-xs">{guide.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-100 text-primary-700">
              {guide.categoryLabel}
            </span>
            <span className="text-xs text-surface-500 flex items-center gap-1">
              <span>⏱️</span>
              <span>{guide.readTime}</span>
            </span>
            <span className="text-xs text-surface-400">•</span>
            <span className="text-xs text-surface-500">
              Updated on {guide.lastUpdated}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-surface-900 tracking-tight leading-tight mb-4">
            {guide.title}
          </h1>

          <p className="text-base sm:text-lg text-surface-600 leading-relaxed max-w-3xl mb-6">
            {guide.summary}
          </p>

          {/* Author attribution */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-surface-200/80 shadow-xs">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              {guide.author.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-surface-800">{guide.author.name}</div>
              <div className="text-xs text-surface-500">{guide.author.role} • {guide.author.bio}</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Article Body */}
          <article className="lg:col-span-8 space-y-10">
            {/* Key Takeaways Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-50/60 to-indigo-50/40 border border-primary-200/80 shadow-xs">
              <h2 className="text-sm font-extrabold text-primary-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Executive Summary & Key Takeaways</span>
              </h2>
              <ul className="space-y-2.5 text-sm text-surface-700">
                {guide.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-primary-600 font-bold mt-0.5">✓</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Render Sections */}
            {guide.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className="space-y-4 scroll-mt-24">
                <h2 className="text-xl sm:text-2xl font-bold text-surface-900 border-b border-surface-100 pb-2">
                  {sec.title}
                </h2>
                
                {sec.content.map((p, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base text-surface-700 leading-relaxed">
                    {p}
                  </p>
                ))}

                {/* Table if present */}
                {sec.table && (
                  <div className="my-6 overflow-x-auto rounded-2xl border border-surface-200 bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-surface-100/70 border-b border-surface-200">
                          {sec.table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="py-3 px-4 font-bold text-surface-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {sec.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-surface-50/50 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className={`py-3 px-4 ${cIdx === 0 ? 'font-semibold text-surface-900' : 'text-surface-600'}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tip box if present */}
                {sec.tip && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3">
                    <span className="text-base">💡</span>
                    <div>
                      <strong className="font-semibold block mb-0.5">Pro Tip:</strong>
                      <span>{sec.tip}</span>
                    </div>
                  </div>
                )}

                {/* Warning box if present */}
                {sec.warning && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className="font-semibold block mb-0.5">Important Warning:</strong>
                      <span>{sec.warning}</span>
                    </div>
                  </div>
                )}
              </section>
            ))}

            {/* Embedded Action Banner */}
            <div className="card-premium p-6 sm:p-8 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-3xl shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-2 inline-block">
                    Recommended Tool
                  </span>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Apply this in your documents right now
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm max-w-md">
                    Test your documents with our free, privacy-first {guide.relatedToolName}. No signup or software installation required.
                  </p>
                </div>
                <Link
                  to={`/${guide.relatedToolSlug}`}
                  className="btn-primary bg-white text-primary-600 hover:bg-white/95 !text-sm px-6 py-3 whitespace-nowrap shadow-md"
                >
                  Open {guide.relatedToolName} →
                </Link>
              </div>
            </div>

            {/* Article FAQ */}
            {guide.faq.length > 0 && (
              <section className="pt-6 border-t border-surface-200">
                <h2 className="text-xl sm:text-2xl font-bold text-surface-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <FAQ items={guide.faq} />
              </section>
            )}

            {/* Feedback / Bug Report note */}
            <div className="p-4 rounded-xl bg-surface-100/60 border border-surface-200 text-xs text-surface-600 flex items-center justify-between">
              <span>Found an inaccuracy or have a question about this guide?</span>
              <Link to="/contact" className="font-semibold text-primary-600 hover:underline">
                Send Editorial Feedback
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Table of Contents */}
            <div className="card-premium p-5 sticky top-20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3">
                In This Guide
              </h3>
              <nav className="space-y-1 text-xs">
                {guide.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="block py-1.5 px-2 rounded-lg text-surface-600 hover:text-primary-600 hover:bg-surface-50 transition-colors"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>

              <hr className="my-4 border-surface-100" />

              {/* Action Widget */}
              <div className="bg-primary-50/60 rounded-xl p-4 border border-primary-100">
                <div className="text-xs font-bold text-primary-800 mb-1">
                  🔧 Ready to test?
                </div>
                <p className="text-xs text-surface-600 mb-3">
                  Use our free {guide.relatedToolName} directly in your browser.
                </p>
                <Link
                  to={`/${guide.relatedToolSlug}`}
                  className="btn-primary w-full !text-xs py-2 block text-center"
                >
                  Launch {guide.relatedToolName}
                </Link>
              </div>

              <hr className="my-4 border-surface-100" />

              {/* Related Guides */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 mb-3">
                  More Practical Guides
                </h4>
                <div className="space-y-3">
                  {relatedGuides.map((rel) => (
                    <Link
                      key={rel.slug}
                      to={`/guides/${rel.slug}`}
                      className="block group"
                    >
                      <span className="text-xs font-semibold text-surface-800 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {rel.title}
                      </span>
                      <span className="text-[11px] text-surface-400">
                        {rel.readTime}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-surface-100">
                  <Link
                    to="/guides"
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <span>View all 10 guides</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
