import { useState, useMemo } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('attendance-calculator')!
const faqItems = [
  { question: 'How is attendance percentage calculated?', answer: 'Attendance % = (Classes Attended / Total Classes) × 100.' },
  { question: 'How do I know how many classes I can skip?', answer: 'Set your target percentage (e.g., 75%) and the calculator tells you how many more classes you can safely miss.' },
]

export default function AttendanceCalculator() {
  const [attended, setAttended] = useState(''); const [total, setTotal] = useState(''); const [target, setTarget] = useState('75')

  const result = useMemo(() => {
    const a = parseInt(attended), t = parseInt(total), tgt = parseFloat(target)
    if (!a || !t || t <= 0 || a < 0 || a > t) return null
    const pct = (a / t) * 100
    const canSkip = Math.max(0, Math.floor(a / (tgt / 100) - t))
    const needAttend = pct >= tgt ? 0 : Math.ceil((tgt * t - 100 * a) / (100 - tgt))
    return { pct, canSkip, needAttend }
  }, [attended, total, target])

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
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Classes Attended</label><input type="number" value={attended} onChange={e => setAttended(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Total Classes</label><input type="number" value={total} onChange={e => setTotal(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
        </div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Target Attendance (%)</label><input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
      </div>

      {result && (
        <div className="card-premium p-6 mt-6 text-center">
          <div className="text-4xl font-extrabold mb-2" style={{ color: result.pct >= parseFloat(target) ? '#48bb78' : '#f56565' }}>{result.pct.toFixed(1)}%</div>
          <p className="text-surface-500 mb-4">{result.pct >= parseFloat(target) ? '✅ You meet the target!' : '⚠️ Below target attendance'}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="result-card"><div className="text-xs text-surface-500">Can Skip</div><div className="font-bold text-lg text-success-600">{result.canSkip} classes</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Need to Attend</div><div className="font-bold text-lg text-warning-500">{result.needAttend} more</div></div>
          </div>
        </div>
      )}

      <FAQ items={faqItems} /><RelatedTools currentSlug="attendance-calculator" />
    </div>
  )
}
