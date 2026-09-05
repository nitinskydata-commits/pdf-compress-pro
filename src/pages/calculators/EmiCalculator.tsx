import { useState, useMemo } from 'react'
import SEOHead from '../../components/SEOHead'
import FAQ from '../../components/FAQ'
import RelatedTools from '../../components/RelatedTools'
import { getToolBySlug, SITE_URL } from '../../data/tools'

const tool = getToolBySlug('emi-calculator')!
const faqItems = [
  { question: 'How is EMI calculated?', answer: 'EMI = P × r × (1+r)^n / ((1+r)^n - 1) where P is principal, r is monthly interest rate, and n is number of months.' },
  { question: 'Is this calculator accurate?', answer: 'Yes, it uses the standard reducing balance method used by banks worldwide.' },
]

export default function EmiCalculator() {
  const [principal, setPrincipal] = useState('1000000')
  const [rate, setRate] = useState('8.5')
  const [years, setYears] = useState('20')

  const result = useMemo(() => {
    const P = parseFloat(principal), R = parseFloat(rate), Y = parseFloat(years)
    if (!P || !R || !Y) return null
    const r = R / 12 / 100, n = Y * 12
    const emi = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    const totalPayment = emi * n
    const totalInterest = totalPayment - P
    return { emi, totalPayment, totalInterest, months: n }
  }, [principal, rate, years])

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <SEOHead title={tool.metaTitle} description={tool.metaDescription} canonical={`/${tool.slug}`} keywords={tool.keywords}
        structuredData={{ '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name, url: `${SITE_URL}/${tool.slug}`, description: tool.metaDescription, applicationCategory: 'FinanceApplication', operatingSystem: 'All', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } }}
        faqData={faqItems} />
      <nav className="breadcrumb"><a href="/">Home</a><span className="separator">›</span><span>{tool.shortName}</span></nav>
      <h1 className="text-2xl md:text-3xl font-extrabold text-surface-800 mb-2">{tool.name}</h1>
      <p className="text-surface-500 mb-6">{tool.description}</p>

      <div className="card-premium p-6 space-y-4">
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Loan Amount (₹)</label><input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Interest Rate (% per year)</label><input type="number" step="0.1" value={rate} onChange={e => setRate(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
        <div><label className="block text-sm font-medium text-surface-700 mb-1">Loan Tenure (years)</label><input type="number" value={years} onChange={e => setYears(e.target.value)} className="w-full px-4 py-3 border border-surface-300 rounded-xl" /></div>
      </div>

      {result && (
        <div className="card-premium p-6 mt-6">
          <h3 className="text-xl font-bold text-center text-surface-800 mb-4">EMI Breakdown</h3>
          <div className="text-center mb-6"><div className="text-4xl font-extrabold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">{fmt(result.emi)}/month</div></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="result-card"><div className="text-xs text-surface-500">Principal</div><div className="font-bold">{fmt(parseFloat(principal))}</div></div>
            <div className="result-card"><div className="text-xs text-surface-500">Total Interest</div><div className="font-bold text-warning-500">{fmt(result.totalInterest)}</div></div>
            <div className="result-card highlight"><div className="text-xs text-surface-500">Total Payment</div><div className="font-bold">{fmt(result.totalPayment)}</div></div>
          </div>
          <div className="mt-4 w-full bg-surface-200 rounded-full h-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${(parseFloat(principal) / result.totalPayment) * 100}%` }} />
          </div>
          <div className="flex justify-between text-xs text-surface-500 mt-1"><span>Principal ({((parseFloat(principal) / result.totalPayment) * 100).toFixed(1)}%)</span><span>Interest ({((result.totalInterest / result.totalPayment) * 100).toFixed(1)}%)</span></div>
        </div>
      )}

      <section className="content-section mt-8"><h2>Understanding EMI</h2><p>EMI (Equated Monthly Installment) is the fixed payment you make each month towards your loan. It includes both the principal repayment and the interest. The EMI remains constant throughout the loan tenure, but the proportion of principal vs interest changes — early payments are interest-heavy, while later payments are principal-heavy.</p></section>
      <FAQ items={faqItems} /><RelatedTools currentSlug="emi-calculator" />
    </div>
  )
}
