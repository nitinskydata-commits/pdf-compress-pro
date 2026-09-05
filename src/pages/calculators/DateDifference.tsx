import { useState } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('date-difference-calculator')!
const faqItems = [{ question: 'Does it account for leap years?', answer: 'Yes! The calculation uses JavaScript Date which correctly handles leap years and varying month lengths.' }]

export default function DateDifference() {
  const [date1, setDate1] = useState(''); const [date2, setDate2] = useState('')

  const result = (() => {
    if (!date1 || !date2) return null
    const d1 = new Date(date1), d2 = new Date(date2)
    const diffMs = Math.abs(d2.getTime() - d1.getTime())
    const days = Math.floor(diffMs / 86400000)
    const weeks = Math.floor(days / 7)
    const months = Math.round(days / 30.44)
    const years = Math.round(days / 365.25 * 100) / 100
    const hours = days * 24
    const minutes = hours * 60
    return { days, weeks, months, years, hours, minutes }
  })()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'UtilityApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      <div className="card-premium p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label><input type="date" value={date1} onChange={e => setDate1(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">End Date</label><input type="date" value={date2} onChange={e => setDate2(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
        </div>
      </div>

      {result && (
        <div className="card-premium p-6 mt-6">
          <h3 className="text-xl font-bold text-center text-surface-800 mb-4">Difference</h3>
          <div className="text-center mb-4"><div className="text-4xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{result.days.toLocaleString()} days</div></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="result-card"><div className="text-xs text-surface-500">Years</div><div className="font-bold">{result.years}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Months</div><div className="font-bold">{result.months}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Weeks</div><div className="font-bold">{result.weeks.toLocaleString()}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Days</div><div className="font-bold">{result.days.toLocaleString()}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Hours</div><div className="font-bold">{result.hours.toLocaleString()}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Minutes</div><div className="font-bold">{result.minutes.toLocaleString()}</div></div>
          </div>
        </div>
      )}

      <FAQ items={faqItems} /><RelatedTools currentSlug="date-difference-calculator" />
    </div>
  )
}
